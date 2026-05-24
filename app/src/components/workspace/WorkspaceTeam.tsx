'use client';

import { memo, useState, useRef, useEffect } from 'react';
import { Users, Shield, UserPlus, ChevronDown, Mail, RotateCcw, X, Clock } from 'lucide-react';
import { useParams } from 'next/navigation';
import {
    useWorkspaceMembers,
    useUpdateWorkspaceMemberRole,
    useRemoveWorkspaceMember,
    useSentInvitations,
    useInviteWorkspaceMember,
    useRevokeInvitation,
    useResendInvitation,
    type WorkspaceInvitation,
} from '@/src/hooks/queries/workspace-management';
import { useLookupUser } from '@/src/hooks/queries/project-management';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    UserAvatar,
    EmptyState,
    Button,
    Form,
    FormGroup,
    FormInput,
    FormLabel,
    Modal,
    ModalBody,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    useToast,
    FormActions,
    Badge,
} from '@/src/components/shared/ui';

interface WorkspaceTeamProps {
    workspaceId: string;
}

interface Member {
    user_id: string;
    name?: string;
    email?: string;
    username?: string;
    role: string;
    avatar_url?: string;
    joined_at?: string;
}

const roleConfig: Record<string, { label: string; color: string; description: string }> = {
    owner: { label: 'Owner', color: 'primary', description: 'Full workspace control' },
    admin: { label: 'Admin', color: 'info', description: 'Can manage workspace team and settings' },
    member: { label: 'Member', color: 'default', description: 'Standard workspace access' },
    viewer: { label: 'Viewer', color: 'secondary', description: 'View-only access' },
};

const roleOptions = ['admin', 'member', 'viewer'];

function WorkspaceTeamHeader({
    members,
    setShowAddModal
}: {
    members: Member[];
    setShowAddModal: (show: boolean) => void;
}) {
    return (
        <div className='project-list'>
            <div className="project-team__header">
                <div className="project-team__header-left">
                    {members.length > 0 && (
                        <div className="project-team__stats">
                            {members.filter(m => m.role === 'owner').length > 0 && (
                                <span className="project-team__stat project-team__stat--primary">
                                    <Shield size={12} />
                                    {members.filter(m => m.role === 'owner').length}
                                </span>
                            )}
                            {members.filter(m => m.role === 'admin').length > 0 && (
                                <span className="project-team__stat project-team__stat--info">
                                    <Shield size={12} />
                                    {members.filter(m => m.role === 'admin').length}
                                </span>
                            )}
                            <span className="project-team__stat project-team__stat--default">
                                <Users size={12} />
                                {members.length} member{members.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                    )}
                </div>
                <div className="project-team__header-actions">
                    <Button
                        variant="primary"
                        size="xs"
                        iconSize={14}
                        onClick={() => setShowAddModal(true)}
                        rightIcon={'plus'}
                    >
                        Invite Member
                    </Button>
                </div>
            </div>
        </div>
    );
}

function MemberCard({
    member,
    workspaceId,
    onRemove,
}: {
    member: Member;
    workspaceId: string;
    onRemove: () => void;
}) {
    const updateRole = useUpdateWorkspaceMemberRole();
    const toast = useToast();
    const role = roleConfig[member.role] || roleConfig.member;
    const displayName = member.name || member.username || member.email || 'Unknown User';

    const handleRoleChange = (newRole: string) => {
        updateRole.mutate(
            { workspaceId, userId: member.user_id, data: { role: newRole } },
            {
                onSuccess: () => {
                    toast.success(`Role updated to ${roleConfig[newRole]?.label || newRole}`);
                },
                onError: (error) => {
                    toast.error(error.message || 'Failed to update role');
                }
            }
        );
    };

    const joinedDate = member.joined_at
        ? new Date(member.joined_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
        : null;

    return (
        <div className="team-member">
            <UserAvatar
                size='xl'
                name={displayName}
                avatarUrl={member.avatar_url}
            />
            <div className="team-member__info">
                <span className="team-member__name">{displayName}</span>
                {member.email && member.name && (
                    <span className="team-member__email">{member.email}</span>
                )}
                {joinedDate && (
                    <span className="team-member__joined">Joined {joinedDate}</span>
                )}
            </div>
            <div className="team-member__role">
                <Badge variant={role.color as any} icon="shield">
                    {role.label}
                </Badge>
            </div>
            <div className="team-member__actions">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="team-member__menu" aria-label="Member options">
                            <ChevronDown size={16} />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {member.role !== 'owner' && (
                            <>
                                {roleOptions.map((r) => (
                                    <DropdownMenuItem
                                        key={r}
                                        onClick={() => handleRoleChange(r)}
                                        icon="shield"
                                    >
                                        Change to {roleConfig[r]?.label || r}
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    variant="danger"
                                    onClick={onRemove}
                                    icon="trash"
                                >
                                    Remove from Workspace
                                </DropdownMenuItem>
                            </>
                        )}
                        {member.role === 'owner' && (
                            <DropdownMenuItem disabled>
                                Owner cannot be modified
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}

interface LookedUpUser {
    id: string;
    name?: string;
    email?: string;
    username?: string;
    last_name?: string;
    avatar_url?: string;
}

const invStatusConfig: Record<string, { label: string; variant: 'warning' | 'success' | 'danger' | 'secondary' }> = {
    pending:  { label: 'Pending',  variant: 'warning' },
    accepted: { label: 'Accepted', variant: 'success' },
    revoked:  { label: 'Revoked',  variant: 'danger' },
    expired:  { label: 'Expired',  variant: 'secondary' },
};

function PendingInvitationRow({
    inv,
    workspaceId,
}: {
    inv: WorkspaceInvitation;
    workspaceId: string;
}) {
    const revoke = useRevokeInvitation();
    const resend = useResendInvitation();
    const toast = useToast();

    const expiresDate = new Date(inv.expires_at);
    const now = new Date();
    const days = Math.ceil((expiresDate.getTime() - now.getTime()) / 86_400_000);
    const expiryLabel = expiresDate < now ? 'Expired' : days === 1 ? 'Expires tomorrow' : `${days}d left`;

    return (
        <div className="team-member">
            <Mail size={28} style={{ flexShrink: 0, opacity: 0.5 }} />
            <div className="team-member__info">
                <span className="team-member__name">{inv.email}</span>
                <span className="team-member__joined">
                    <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                    {expiryLabel}
                </span>
            </div>
            <div className="team-member__role">
                <Badge variant={roleConfig[inv.role]?.color as any || 'default'}>
                    {roleConfig[inv.role]?.label || inv.role}
                </Badge>
                <Badge variant={invStatusConfig[inv.status]?.variant || 'secondary'} style={{ marginLeft: 4 }}>
                    {invStatusConfig[inv.status]?.label || inv.status}
                </Badge>
            </div>
            <div className="team-member__actions">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="team-member__menu" aria-label="Invitation options">
                            <ChevronDown size={16} />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            icon="rotate-ccw"
                            onClick={() =>
                                resend.mutate(
                                    { workspaceId, invitationId: inv.id },
                                    {
                                        onSuccess: () => toast.success(`Invitation resent to ${inv.email}`),
                                        onError: (e) => toast.error(e.message || 'Failed to resend'),
                                    }
                                )
                            }
                        >
                            <RotateCcw size={14} style={{ marginRight: 6 }} />
                            Resend
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            variant="danger"
                            onClick={() =>
                                revoke.mutate(
                                    { workspaceId, invitationId: inv.id },
                                    {
                                        onSuccess: () => toast.success('Invitation revoked'),
                                        onError: (e) => toast.error(e.message || 'Failed to revoke'),
                                    }
                                )
                            }
                        >
                            <X size={14} style={{ marginRight: 6 }} />
                            Revoke
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}

function WorkspaceTeamComponent({ workspaceId }: WorkspaceTeamProps) {
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchIdentifier, setSearchIdentifier] = useState('');
    const [lookedUpUser, setLookedUpUser] = useState<LookedUpUser | null>(null);
    const [lookupError, setLookupError] = useState('');
    const [newMemberRole, setNewMemberRole] = useState<'admin' | 'member' | 'viewer'>('member');

    const { data, isLoading } = useWorkspaceMembers(workspaceId);
    const { data: invData } = useSentInvitations(workspaceId);
    const sendInvite = useInviteWorkspaceMember();
    const removeMember = useRemoveWorkspaceMember();
    const lookupUser = useLookupUser();
    const toast = useToast();
    const inputRef = useRef<HTMLInputElement>(null);

    const pendingInvitations = (invData?.invitations ?? []).filter((i) => i.status === 'pending');

    const members = (data?.members ?? []) as Member[];

    useEffect(() => {
        if (showAddModal && inputRef.current) {
            inputRef.current.focus();
        }
    }, [showAddModal]);

    const handleCloseModal = () => {
        setShowAddModal(false);
        setSearchIdentifier('');
        setLookedUpUser(null);
        setLookupError('');
        setNewMemberRole('member');
    };

    const handleSearchUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchIdentifier.trim()) return;

        setLookupError('');
        setLookedUpUser(null);

        lookupUser.mutate(searchIdentifier.trim(), {
            onSuccess: (data) => {
                const user = data.user;
                if (user) {
                    const isAlreadyMember = members.some((m) => m.user_id === user.id);
                    if (isAlreadyMember) {
                        setLookupError('This user is already a member of the workspace');
                    } else {
                        setLookedUpUser(user as LookedUpUser);
                    }
                } else {
                    setLookupError('User not found. Please check the username or email.');
                }
            },
            onError: () => {
                setLookupError('User not found. Please check the username or email.');
            }
        });
    };

    const handleSendInviteToUser = () => {
        if (!lookedUpUser?.email) {
            toast.error('Cannot send invitation: user has no email address on file');
            return;
        }
        sendInvite.mutate(
            { workspaceId, data: { email: lookedUpUser.email, role: newMemberRole } },
            {
                onSuccess: () => {
                    toast.success(`Invitation sent to ${lookedUpUser.email}`);
                    handleCloseModal();
                },
                onError: (error) => {
                    toast.error(error.message || 'Failed to send invitation');
                },
            }
        );
    };

    const handleRemove = (userId: string, memberName: string) => {
        if (!confirm(`Are you sure you want to remove ${memberName} from this workspace? They will lose access to all associated projects.`)) return;

        removeMember.mutate(
            { workspaceId, userId },
            {
                onSuccess: () => {
                    toast.success(`${memberName} has been removed from the workspace`);
                },
                onError: (error) => {
                    toast.error(error.message || 'Failed to remove member');
                }
            }
        );
    };

    if (isLoading) {
        return (
            <div className="project-team project-team--loading" style={{ padding: '0 2rem' }}>
                {[1, 2, 3].map(i => (
                    <div key={i} className="team-member team-member--skeleton" />
                ))}
            </div>
        );
    }

    return (
        <div>
            <div className="project-team">
                <WorkspaceTeamHeader members={members} setShowAddModal={setShowAddModal} />
                {members.length === 1 ? (
                    <div className="py-12 w-full">
                        <EmptyState
                            icon="users"
                            title="You are the only member of this workspace"
                            description="Invite members to collaborate in this workspace"
                            cta={{
                                label: 'Invite Member',
                                onClick: () => setShowAddModal(true)
                            }}
                        />
                    </div>
                ) : (
                    <div className="project-team__list">
                        {members.map(member => (
                            <MemberCard
                                key={member.user_id}
                                member={member}
                                workspaceId={workspaceId}
                                onRemove={() => handleRemove(member.user_id, member.name || member.email || 'Member')}
                            />
                        ))}
                    </div>
                )}
            </div>

            {pendingInvitations.length > 0 && (
                <div className="project-team" style={{ marginTop: '2rem' }}>
                    <div className="project-team__header">
                        <div className="project-team__header-left">
                            <span className="project-team__stat project-team__stat--default">
                                <Mail size={12} />
                                {pendingInvitations.length} pending invitation{pendingInvitations.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>
                    <div className="project-team__list">
                        {pendingInvitations.map((inv) => (
                            <PendingInvitationRow key={inv.id} inv={inv} workspaceId={workspaceId} />
                        ))}
                    </div>
                </div>
            )}

            <Modal
                isOpen={showAddModal}
                onClose={handleCloseModal}
                title="Invite to Workspace"
                titleIcon={<UserPlus size={20} />}
            >
                {/* Username / email lookup */}
                {!lookedUpUser && (
                    <Form onSubmit={handleSearchUser}>
                        <ModalBody>
                            <FormGroup>
                                <FormLabel htmlFor="identifier">Username or Email</FormLabel>
                                <FormInput
                                    ref={inputRef}
                                    type="text"
                                    id="identifier"
                                    placeholder="Enter username or email"
                                    value={searchIdentifier}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchIdentifier(e.target.value)}
                                    hint="Enter the username or email of the user you want to add directly"
                                    required
                                />
                                {lookupError && (
                                    <p className="form-group__error" style={{ marginTop: '0.5rem' }}>{lookupError}</p>
                                )}
                            </FormGroup>
                        </ModalBody>
                        <FormActions className="modal__footer">
                            <Button type="button" variant="ghost" onClick={handleCloseModal}>Cancel</Button>
                            <Button
                                type="submit"
                                disabled={lookupUser.isPending || !searchIdentifier.trim()}
                                loading={lookupUser.isPending}
                            >
                                {lookupUser.isPending ? 'Searching...' : 'Find User'}
                            </Button>
                        </FormActions>
                    </Form>
                )}

                {lookedUpUser && (
                    <>
                        <ModalBody>
                            <div className="team-member">
                                <UserAvatar
                                    size='xl'
                                    name={lookedUpUser.name || lookedUpUser.username || 'Unknown'}
                                    avatarUrl={lookedUpUser.avatar_url}
                                />
                                <div className="team-member__info">
                                    <span className="team-member__name">{lookedUpUser.name || lookedUpUser.username || 'Unknown'}</span>
                                    {lookedUpUser.email && (
                                        <span className="team-member__email">{lookedUpUser.email}</span>
                                    )}
                                    {lookedUpUser.username && (
                                        <span className="team-member__joined">@{lookedUpUser.username}</span>
                                    )}
                                </div>
                            </div>
                            <FormGroup>
                                <FormLabel htmlFor="role">Workspace Role</FormLabel>
                                <Select
                                    value={newMemberRole}
                                    onValueChange={(value) => setNewMemberRole(value as 'admin' | 'member' | 'viewer')}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roleOptions.map((r) => (
                                            <SelectItem key={r} value={r}>
                                                {roleConfig[r]?.label || r} - {roleConfig[r]?.description}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormGroup>
                        </ModalBody>
                        <FormActions className="modal__footer">
                            <Button type="button" variant="ghost" onClick={() => setLookedUpUser(null)}>Back</Button>
                            <Button
                                type="button"
                                disabled={sendInvite.isPending || !lookedUpUser?.email}
                                loading={sendInvite.isPending}
                                onClick={handleSendInviteToUser}
                            >
                                {sendInvite.isPending ? 'Sending…' : 'Send Invitation'}
                            </Button>
                        </FormActions>
                    </>
                )}
            </Modal>
        </div>
    );
}

export const WorkspaceTeam = memo(WorkspaceTeamComponent);

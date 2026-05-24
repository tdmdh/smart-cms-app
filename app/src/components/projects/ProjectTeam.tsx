'use client';

import { memo, useState } from 'react';
import { Users, Shield, UserPlus, ChevronDown } from 'lucide-react';
import { useParams } from 'next/navigation';
import {
    useProjectMembers,
    useAddProjectMember,
    useUpdateProjectMemberRole,
    useRemoveProjectMember,
} from '@/src/hooks/queries/project-management';
import { useWorkspaceMembers } from '@/src/hooks/queries/workspace-management';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    UserAvatar,
    EmptyState,
    Button,
    Input,
    FormGroup,
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
    Icon,
} from '@/src/components/shared/ui';

interface ProjectTeamProps {
    projectId: string;
}

interface Member {
    user_id: string;
    name?: string;
    email?: string;
    role: string;
    avatar_url?: string;
    joined_at?: string;
}

const roleConfig: Record<string, { label: string; color: string; description: string }> = {
    owner: { label: 'Owner', color: 'primary', description: 'Full project control' },
    admin: { label: 'Admin', color: 'info', description: 'Can manage team and settings' },
    member: { label: 'Member', color: 'default', description: 'Can view and edit tasks' },
    viewer: { label: 'Viewer', color: 'secondary', description: 'View-only access' },
};

const roleOptions = ['admin', 'member', 'viewer'];

function ProjectTeamHeader({
    members,
    setShowAddModal
}: {
    members: Member[];
    setShowAddModal: (show: boolean) => void;
}) {
    return (
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
                    Add Member
                </Button>
            </div>
        </div>
    );
}

function MemberCard({
    member,
    projectId,
    onRemove,
}: {
    member: Member;
    projectId: string;
    onRemove: () => void;
}) {
    const updateRole = useUpdateProjectMemberRole();
    const toast = useToast();
    const role = roleConfig[member.role] || roleConfig.member;
    const displayName = member.name || member.email || 'Unknown User';
    const initials = displayName.slice(0, 2).toUpperCase();

    const handleRoleChange = (newRole: string) => {
        updateRole.mutate(
            { projectId, userId: member.user_id, data: { role: newRole } },
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
                                    Remove from Project
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

function ProjectTeamComponent({ projectId }: ProjectTeamProps) {
    const params = useParams();
    const workspaceId = params.workspaceId as string | undefined;

    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [newMemberRole, setNewMemberRole] = useState<'admin' | 'member' | 'viewer'>('member');
    const [search, setSearch] = useState('');

    const { data, isLoading } = useProjectMembers(projectId);
    const { data: workspaceMembersData, isLoading: isLoadingWorkspace } = useWorkspaceMembers(workspaceId ?? null);
    const addMember = useAddProjectMember();
    const removeMember = useRemoveProjectMember();
    const toast = useToast();

    const members = (data?.members ?? []) as Member[];
    const projectMemberIds = new Set(members.map((m) => m.user_id));

    // Workspace members who are not yet in this project
    const availableMembers = (workspaceMembersData?.members ?? []).filter(
        (wm) => !projectMemberIds.has(wm.user_id)
    );

    const filteredAvailable = search.trim()
        ? availableMembers.filter((wm) => {
            const q = search.toLowerCase();
            return (
                wm.name?.toLowerCase().includes(q) ||
                wm.email?.toLowerCase().includes(q) ||
                wm.username?.toLowerCase().includes(q)
            );
        })
        : availableMembers;

    const selectedUser = availableMembers.find((wm) => wm.user_id === selectedUserId) ?? null;

    const handleCloseModal = () => {
        setShowAddModal(false);
        setSelectedUserId(null);
        setNewMemberRole('member');
        setSearch('');
    };

    const handleAddMember = () => {
        if (!selectedUserId) return;

        addMember.mutate(
            { projectId, data: { user_id: selectedUserId, role: newMemberRole } },
            {
                onSuccess: () => {
                    toast.success(`${selectedUser?.name || selectedUser?.email || 'Member'} added successfully`);
                    handleCloseModal();
                },
                onError: (error) => {
                    toast.error(error.message || 'Failed to add member');
                }
            }
        );
    };

    const handleRemove = (userId: string, memberName: string) => {
        if (!confirm(`Are you sure you want to remove ${memberName} from this project?`)) return;

        removeMember.mutate(
            { projectId, userId },
            {
                onSuccess: () => {
                    toast.success(`${memberName} has been removed from the project`);
                },
                onError: (error) => {
                    toast.error(error.message || 'Failed to remove member');
                }
            }
        );
    };

    if (isLoading) {
        return (
            <div className="project-team project-team--loading">
                {[1, 2, 3].map(i => (
                    <div key={i} className="team-member team-member--skeleton" />
                ))}
            </div>
        );
    }

    return (
        <>
            <div className="project-team">
                <ProjectTeamHeader members={members} setShowAddModal={setShowAddModal} />
                {members.length === 0 ? (
                    <div className="py-12 w-full">
                        <EmptyState
                            icon="users"
                            title="No team members"
                            description="Add workspace members to collaborate on this project"
                            cta={{
                                label: 'Add Member',
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
                                projectId={projectId}
                                onRemove={() => handleRemove(member.user_id, member.name || member.email || 'Member')}
                            />
                        ))}
                    </div>
                )}
            </div>

            <Modal
                isOpen={showAddModal}
                onClose={handleCloseModal}
                title="Add Team Member"
                titleIcon={<UserPlus size={20} />}
            >
                <ModalBody>
                    <FormGroup>
                        <Input
                            type="text"
                            leftIcon="search"
                            placeholder="Search workspace members..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                    </FormGroup>

                    {/* Member list */}
                    {isLoadingWorkspace ? (
                        <div className="project-team project-team--loading">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="team-member team-member--skeleton team-member--skeleton-spaced" />
                            ))}
                        </div>
                    ) : filteredAvailable.length === 0 ? (
                        <div className="project-team__empty-message">
                            {availableMembers.length === 0
                                ? 'All workspace members are already in this project.'
                                : 'No members match your search.'}
                        </div>
                    ) : (
                        <div className="project-team__member-picker">
                            {filteredAvailable.map((wm) => {
                                const displayName = wm.name || wm.username || wm.email || 'Unknown';
                                const isSelected = selectedUserId === wm.user_id;
                                return (
                                    <button
                                        key={wm.user_id}
                                        type="button"
                                        onClick={() => setSelectedUserId(isSelected ? null : wm.user_id)}
                                        className={`team-member team-member--selectable${isSelected ? ' is-selected' : ''}`}
                                    >
                                        <UserAvatar size="xl" name={displayName} />
                                        <div className="team-member__info">
                                            <span className="team-member__name">{displayName}</span>
                                            {wm.email && wm.name && (
                                                <span className="team-member__email">{wm.email}</span>
                                            )}
                                        </div>
                                        <Badge variant="secondary">{wm.role}</Badge>
                                        {isSelected && (
                                            <Icon name="check" size={16} className="team-member__selected-icon" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Role selector — only shown when a user is selected */}
                    {selectedUserId && (
                        <FormGroup>
                            <FormLabel htmlFor="role">Project Role for {selectedUser?.name || selectedUser?.email}</FormLabel>
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
                                            {roleConfig[r]?.label || r} — {roleConfig[r]?.description}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormGroup>
                    )}
                </ModalBody>

                <FormActions className="modal__footer">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={handleCloseModal}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        disabled={!selectedUserId || addMember.isPending}
                        loading={addMember.isPending}
                        onClick={handleAddMember}
                    >
                        {addMember.isPending ? 'Adding...' : 'Add to Project'}
                    </Button>
                </FormActions>
            </Modal>
        </>
    );
}


export const ProjectTeam = memo(ProjectTeamComponent);

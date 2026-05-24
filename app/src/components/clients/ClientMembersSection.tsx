'use client';

import { memo, useMemo } from 'react';
import { Users, Trash2, Shield, Crown, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Card,
    CardHeader,
    CardBody,
    Button,
    Skeleton,
    Alert,
    UserAvatar,
    useToast,
    Badge,
    EmptyState
} from '@/src/components/shared/ui';
import { useAppDispatch } from '@/src/store/hooks';
import { pushView } from '@/src/store/slices/layoutSlice';
import { useClientMembers, useRemoveClientMember } from '@/src/hooks/queries/client-management';
import { DashboardMember, toDashboardMembers } from '@/src/types/dashboard';

interface ClientMembersSectionProps {
    clientId: string;
    clientName?: string;
}

function getRoleIcon(role: string) {
    switch (role.toLowerCase()) {
        case 'owner':
            return <Crown size={12} />;
        case 'admin':
            return <Shield size={12} />;
        default:
            return null;
    }
}

function getRoleBadgeVariant(role: string): string {
    switch (role.toLowerCase()) {
        case 'owner':
            return 'warning';
        case 'admin':
            return 'primary';
        default:
            return 'default';
    }
}

function getRolePriority(role: string): number {
    switch (role.toLowerCase()) {
        case 'owner':
            return 0;
        case 'admin':
            return 1;
        default:
            return 2;
    }
}

// Animation variants for staggered list items
const listVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring' as const,
            stiffness: 300,
            damping: 24
        }
    }
};


function ClientMembersSectionComponent({ clientId, clientName }: ClientMembersSectionProps) {
    const dispatch = useAppDispatch();
    const toast = useToast();
    const { data, isLoading, isError } = useClientMembers(clientId);
    const removeMutation = useRemoveClientMember();

    const handleAddMember = () => {
        dispatch(pushView({
            view: 'client-member-invite-form',
            data: { clientId, clientName }
        }));
    };

    const handleRemoveMember = async (userId: string, memberName?: string) => {
        if (!confirm(`Are you sure you want to remove ${memberName || 'this member'}?`)) return;

        try {
            await removeMutation.mutateAsync({ clientId, userId });
            toast.success('Member removed successfully');
        } catch (error) {
            console.error('Failed to remove member:', error);
            toast.error('Failed to remove member');
        }
    };

    // Sort members by role priority: Owner > Admin > Member
    const sortedMembers = useMemo(() => {
        const members = toDashboardMembers(data?.members);
        return [...members].sort((a, b) => getRolePriority(a.role) - getRolePriority(b.role));
    }, [data?.members]);

    const adminCount = sortedMembers.filter(m =>
        m.role.toLowerCase() === 'admin' || m.role.toLowerCase() === 'owner'
    ).length;

    if (isLoading) {
        return (
            <div className="client-members">
                <div className="client-members__header">
                    <Skeleton className="h-8 w-32 rounded" />
                    <Skeleton className="h-9 w-28 rounded" />
                </div>
                <div className="client-members__list">
                    {[1, 2, 3].map(i => (
                        <Card key={i} variant="default">
                            <CardBody className="client-members__member-skeleton">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="client-members__member-skeleton-content">
                                    <Skeleton className="h-4 w-32 rounded" />
                                    <Skeleton className="h-3 w-24 rounded mt-1" />
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="client-members">
                <Alert variant="error" title="Failed to load team members">
                    We couldn&apos;t load the team members. Please try again.
                </Alert>
            </div>
        );
    }

    if (sortedMembers.length === 0) {
        return (
            <EmptyState
                icon={'users'}
                title="No team members"
                description="Add team members to collaborate on this client's projects."
                cta={{
                    label: 'Invite Member',
                    onClick: handleAddMember,
                }}
            />
        )
    }
            

    return (
        <div className="client-members">
            <div className="client-members__header">
                <div>
                    <h3 className="client-members__title">
                        Members
                        <span className="client-members__count">{sortedMembers.length}</span>
                    </h3>
                    {adminCount > 0 && (
                        <p className="client-members__meta">
                            {adminCount} admin{adminCount !== 1 ? 's' : ''}
                        </p>
                    )}
                </div>
                <Button
                    variant="primary"
                    size="xs"
                    iconSize={14}
                    rightIcon="plus"
                    onClick={handleAddMember}
                >
                    Invite Member
                </Button>
            </div>

            <motion.ul
                className="client-members__list"
                variants={listVariants}
                initial="hidden"
                animate="visible"
            >
                <AnimatePresence>
                    {sortedMembers.map(member => (
                        <motion.li
                            key={member.user_id}
                            className="client-members__member"
                            variants={itemVariants}
                            layout
                        >
                            <UserAvatar
                                name={member.name || member.username}
                                email={member.email}
                                size="md"
                            />
                            <div className="client-members__member-info">
                                <span className="client-members__member-name">
                                    {member.name || member.username}
                                </span>
                                {member.email && (
                                    <span className="client-members__member-email">
                                        {member.email}
                                    </span>
                                )}
                            </div>
                            <Badge
                                size="sm"
                                variant={getRoleBadgeVariant(member.role) as 'warning' | 'primary' | 'default'}
                                className="client-members__member-role"
                            >
                                {getRoleIcon(member.role)}
                                {member.role}
                            </Badge>
                            <button
                                className="client-members__remove"
                                aria-label={`Remove ${member.name || member.username}`}
                                onClick={() => handleRemoveMember(member.user_id, member.name || member.username)}
                                disabled={removeMutation.isPending}
                            >
                                <Trash2 size={14} />
                            </button>
                        </motion.li>
                    ))}
                </AnimatePresence>
            </motion.ul>
        </div>
    );
}

export const ClientMembersSection = memo(ClientMembersSectionComponent);
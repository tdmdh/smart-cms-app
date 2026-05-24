'use client';

import { memo, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserMinus, UserPlus, Wrench } from 'lucide-react';
import {
    Alert,
    Badge,
    Button,
    EmptyState,
    Skeleton,
    UserAvatar,
    useToast,
} from '@/src/components/shared/ui';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/src/components/shared/ui/Dialog';
import { useAgencyMembers } from '@/src/hooks/queries/client-management';
import { useAssignDeveloper, useUnassignDeveloper } from '@/src/hooks/queries/client-management';
import type { AgencyMemberResponse } from '@/src/hooks/queries/client-management/config';

interface AssignedDevelopersSectionProps {
    clientId: string;
}

type AgencyMember = AgencyMemberResponse & { user_id?: string };

const listVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const itemVariants = {
    hidden: { opacity: 0, y: 6 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

function roleBadgeVariant(role: string): 'warning' | 'primary' | 'default' {
    switch (role?.toLowerCase()) {
        case 'owner': return 'warning';
        case 'admin': return 'primary';
        default: return 'default';
    }
}

function AssignedDevelopersSectionComponent({ clientId }: AssignedDevelopersSectionProps) {
    const toast = useToast();
    const [showAssignDialog, setShowAssignDialog] = useState(false);

    const { data, isLoading, isError } = useAgencyMembers();
    const assignMutation = useAssignDeveloper();
    const unassignMutation = useUnassignDeveloper();

    const allMembers: AgencyMember[] = useMemo(
        () => (data?.members ?? []) as AgencyMember[],
        [data?.members]
    );

    /**
     * For now we show all agency members and let the user assign/unassign.
     * When a `GET /clients/:id/assigned-developers` endpoint exists, replace
     * this with a dedicated hook that returns only assigned members.
     */
    const handleAssign = async (member: AgencyMember) => {
        const userId = member.user_id ?? (member as Record<string, unknown>).id as string;
        if (!userId) return;
        try {
            await assignMutation.mutateAsync({ developer_id: userId, client_id: clientId });
            toast.success(`${member.name || member.username || 'Developer'} assigned to client`);
        } catch {
            toast.error('Failed to assign developer');
        }
    };

    const handleUnassign = async (member: AgencyMember) => {
        const userId = member.user_id ?? (member as Record<string, unknown>).id as string;
        if (!userId) return;
        try {
            await unassignMutation.mutateAsync({ developer_id: userId, client_id: clientId });
            toast.success(`${member.name || member.username || 'Developer'} removed from client`);
        } catch {
            toast.error('Failed to unassign developer');
        }
    };

    if (isLoading) {
        return (
            <div className="client-developers">
                <div className="client-members__header">
                    <Skeleton className="h-6 w-36 rounded" />
                    <Skeleton className="h-8 w-28 rounded" />
                </div>
                <div className="client-members__list">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="client-members__member client-members__member--skeleton" />
                    ))}
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="client-developers">
                <Alert variant="error" title="Failed to load team">
                    We couldn&apos;t load agency members. Please try again.
                </Alert>
            </div>
        );
    }

    if (allMembers.length === 0) {
        return (
            <EmptyState
                icon="users"
                title="No agency members"
                description="Add agency members first before assigning them to clients."
            />
        );
    }

    return (
        <div className="client-developers">
            <div className="client-members__header">
                <div>
                    <h3 className="client-members__title">
                        Agency Team
                        <span className="client-members__count">{allMembers.length}</span>
                    </h3>
                    <p className="client-members__meta">Agency members with access to this client</p>
                </div>
                <Button
                    variant="ghost"
                    size="xs"
                    iconSize={14}
                    leftIcon="plus"
                    onClick={() => setShowAssignDialog(true)}
                >
                    Assign Developer
                </Button>
            </div>

            <motion.ul
                className="client-members__list"
                variants={listVariants}
                initial="hidden"
                animate="visible"
            >
                <AnimatePresence>
                    {allMembers.map(member => {
                        const userId = member.user_id ?? (member as Record<string, unknown>).id as string;
                        const displayName = member.name || member.username || member.email || 'Unknown';
                        return (
                            <motion.li
                                key={userId}
                                className="client-members__member"
                                variants={itemVariants}
                                layout
                            >
                                <UserAvatar name={displayName} email={member.email} size="md" />
                                <div className="client-members__member-info">
                                    <span className="client-members__member-name">{displayName}</span>
                                    {member.email && (
                                        <span className="client-members__member-email">{member.email}</span>
                                    )}
                                </div>
                                <Badge size="sm" variant={roleBadgeVariant(member.role ?? '')} className="client-members__member-role">
                                    <Wrench size={10} />
                                    {member.role}
                                </Badge>
                                <button
                                    className="client-members__remove"
                                    aria-label={`Unassign ${displayName}`}
                                    onClick={() => handleUnassign(member)}
                                    disabled={unassignMutation.isPending}
                                >
                                    <UserMinus size={14} />
                                </button>
                            </motion.li>
                        );
                    })}
                </AnimatePresence>
            </motion.ul>

            {/* Assign dialog — pick from agency members not yet assigned */}
            <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Developer</DialogTitle>
                        <DialogDescription>
                            Select an agency member to give them access to this client.
                        </DialogDescription>
                    </DialogHeader>
                    <ul className="assign-member-list">
                        {allMembers.map(member => {
                            const userId = member.user_id ?? (member as Record<string, unknown>).id as string;
                            const displayName = member.name || member.username || member.email || 'Unknown';
                            return (
                                <li key={userId} className="assign-member-list__item">
                                    <UserAvatar name={displayName} email={member.email} size="sm" />
                                    <span className="assign-member-list__name">{displayName}</span>
                                    <Badge size="sm" variant={roleBadgeVariant(member.role ?? '')}>{member.role}</Badge>
                                    <Button
                                        variant="ghost"
                                        size="xs"
                                        iconSize={14}
                                        leftIcon="plus"
                                        loading={assignMutation.isPending}
                                        onClick={() => { handleAssign(member); setShowAssignDialog(false); }}
                                    >
                                        Assign
                                    </Button>
                                </li>
                            );
                        })}
                    </ul>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowAssignDialog(false)}>Cancel</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export const AssignedDevelopersSection = memo(AssignedDevelopersSectionComponent);

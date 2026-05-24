'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspacePath } from '@/src/hooks/useWorkspacePath';

import { DeploymentStatusBadge } from './DeploymentStatusBadge';
import { GitCommit } from 'lucide-react';
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
    TableEmpty,
    Button,
    useToast,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '../shared/ui';
import { useCancelDeployment, useRollbackDeployment } from '@/src/hooks/queries/deployments/useDeployments';
import { DeploymentItem } from '@/src/api/deployments/config';

interface DeploymentListProps {
    deployments: DeploymentItem[];
    projectId: string;
}

function timeAgo(dateStr: string) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}

export function DeploymentList({ deployments, projectId }: DeploymentListProps) {
    const router = useRouter();
    const workspacePath = useWorkspacePath();
    const toast = useToast();
    const cancelMutation = useCancelDeployment();
    const rollbackMutation = useRollbackDeployment();

    const [confirmAction, setConfirmAction] = useState<{
        type: 'cancel' | 'rollback';
        id: string;
    } | null>(null);

    const handleConfirm = () => {
        if (!confirmAction) return;
        const { type, id } = confirmAction;

        if (type === 'cancel') {
            cancelMutation.mutate(id, {
                onSuccess: () => toast.success('Deployment cancelled'),
                onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to cancel deployment'),
            });
        } else {
            rollbackMutation.mutate(id, {
                onSuccess: () => toast.success('Rollback initiated'),
                onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to rollback deployment'),
            });
        }
        setConfirmAction(null);
    };

    if (deployments.length === 0) {
        return (
            <div className="rounded-md border border-slate-800 bg-slate-900/50 p-8">
                <TableEmpty
                    title="No deployments found"
                    description="Trigger a deployment to get started."
                />
            </div>
        );
    }

    return (
        <div className="w-full">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Commit</TableHead>
                        <TableHead>Config</TableHead>
                        <TableHead>Trigger</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {deployments.map((deployment) => (
                        <TableRow
                            key={deployment.id}
                            className="group"
                            onClick={() => router.push(workspacePath(`projects/${projectId}/deployments/${deployment.id}`))}
                        >
                            <TableCell>
                                <DeploymentStatusBadge status={deployment.status} />
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1.5 font-medium text-slate-200">
                                        <GitCommit size={14} className="text-slate-500" />
                                        <span className="truncate max-w-[200px]">{deployment.git_message || 'No commit message'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                        <span className="font-mono">{deployment.git_sha ? deployment.git_sha.substring(0, 7) : '-'}</span>
                                        <span>•</span>
                                        <span>{deployment.git_ref || 'main'}</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                {deployment.config_name || 'Production'}
                            </TableCell>
                            <TableCell>
                                <span className="text-slate-400 lowercase">{deployment.trigger_type}</span>
                            </TableCell>
                            <TableCell>
                                {deployment.duration_seconds ? `${deployment.duration_seconds}s` : '-'}
                            </TableCell>
                            <TableCell>
                                {timeAgo(deployment.queued_at)}
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {['queued', 'cloning', 'building', 'deploying'].includes(deployment.status.toLowerCase()) && (
                                        <Button
                                            size="xs"
                                            variant="danger"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setConfirmAction({ type: 'cancel', id: deployment.id });
                                            }}
                                            disabled={cancelMutation.isPending}
                                            title="Cancel Deployment"
                                            iconOnly
                                            leftIcon='ban'
                                        />
                                    )}
                                    {deployment.status.toLowerCase() === 'success' && (
                                        <>
                                            {deployment.provider_url && (
                                                <Button
                                                    size="xs"
                                                    variant="ghost"
                                                    href={deployment.provider_url}
                                                    title="Visit URL"
                                                    iconOnly
                                                    leftIcon='external-link'
                                                />
                                            )}
                                            <Button
                                                size="xs"
                                                variant="secondary"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setConfirmAction({ type: 'rollback', id: deployment.id });
                                                }}
                                                disabled={rollbackMutation.isPending}
                                                title="Rollback to this version"
                                                iconOnly
                                                leftIcon='rotate-ccw'
                                            />
                                        </>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <Dialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {confirmAction?.type === 'cancel' ? 'Cancel Deployment' : 'Rollback Deployment'}
                        </DialogTitle>
                        <DialogDescription>
                            {confirmAction?.type === 'cancel'
                                ? 'Are you sure you want to cancel this deployment? This will stop the build process.'
                                : 'Are you sure you want to rollback to this deployment? A new deployment will be triggered with the previous version.'}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setConfirmAction(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant={confirmAction?.type === 'cancel' ? 'danger' : 'primary'}
                            onClick={handleConfirm}
                        >
                            {confirmAction?.type === 'cancel' ? 'Cancel Deployment' : 'Rollback'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default DeploymentList;

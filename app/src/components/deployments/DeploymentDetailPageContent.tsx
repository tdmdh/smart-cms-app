'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    useDeployment,
    useDeploymentLogs,
} from '@/src/hooks/queries/deployments/useDeployments';
import { useWorkspacePath } from '@/src/hooks/useWorkspacePath';
import {
    Badge,
    Button,
    Card,
    CardBody,
    CardHeader,
    EmptyState,
    Icon,
} from '@/src/components/shared/ui';
import { DeploymentLogsViewer } from '@/src/components/deployments/DeploymentLogsViewer';
import { DeploymentStatusBadge } from '@/src/components/deployments/DeploymentStatusBadge';
import { toDashboardDeploymentRuns, toDashboardDeploymentLogs } from '@/src/types/dashboard';

interface DeploymentDetailPageContentProps {
    projectId: string;
    deploymentId: string;
}

function formatDateTime(value?: string): string {
    if (!value) return '-';
    return new Date(value).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatDuration(seconds?: number): string {
    if (!seconds) return '-';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    return `${mins}m ${remaining}s`;
}

export default function DeploymentDetailPageContent({ projectId, deploymentId }: DeploymentDetailPageContentProps) {
    const router = useRouter();
    const workspacePath = useWorkspacePath();

    const { data: deploymentData, isLoading: isLoadingDeployment } = useDeployment(deploymentId);

    const deployment = useMemo(() => {
        const raw = deploymentData?.deployment;
        return raw ? toDashboardDeploymentRuns([raw])[0] : undefined;
    }, [deploymentData?.deployment]);

    const isRunning = !!deployment?.status && ['queued', 'cloning', 'building', 'deploying'].includes(deployment.status.toLowerCase());

    const { data: logsData, isLoading: isLoadingLogs } = useDeploymentLogs(deploymentId, deployment?.status);
    const logs = useMemo(() => toDashboardDeploymentLogs(logsData?.logs), [logsData?.logs]);

    useEffect(() => {
        if (deploymentData && !deployment) {
            router.replace(workspacePath(`projects/${projectId}/deployments`));
        }
    }, [deploymentData, deployment, projectId, router, workspacePath]);

    if (isLoadingDeployment) {
        return (
            <div className="deployments-detail deployments-detail--loading">
                <Icon name="loader" size={22} className="animate-spin" />
                <span>Loading deployment details...</span>
            </div>
        );
    }

    if (!deployment) {
        return (
            <EmptyState
                icon="warning"
                title="Deployment not found"
                description="The deployment does not exist or has been deleted."
                cta={{
                    label: 'Back to Deployments',
                    onClick: () => router.push(workspacePath(`projects/${projectId}/deployments`)),
                }}
            />
        );
    }

    return (
        <div className="deployments-detail">
            <div className="deployments-detail__header">
                <div className="deployments-detail__header-main">
                    <Button
                        variant="ghost"
                        size="xs"
                        iconOnly
                        leftIcon="arrow-left"
                        onClick={() => router.push(workspacePath(`projects/${projectId}/deployments`))}
                        title="Back to Deployments"
                    />
                    <div className="deployments-detail__title-wrap">
                        <h1 className="deployments-detail__title">
                            Deployment
                            <span className="deployments-detail__id">#{deployment.id.substring(0, 8)}</span>
                        </h1>
                        <p className="deployments-detail__subtitle">
                            Triggered via <strong>{deployment.trigger_type}</strong> by <strong>{deployment.triggered_by_name || 'System'}</strong>
                        </p>
                    </div>
                </div>

                <div className="deployments-detail__header-actions">
                    <DeploymentStatusBadge status={deployment.status} />
                    {deployment.status.toLowerCase() === 'success' && deployment.provider_url && (
                        <Button variant="secondary" size="sm" leftIcon="external-link" href={deployment.provider_url}>
                            Visit Live URL
                        </Button>
                    )}
                </div>
            </div>

            <div className="deployments-detail__grid">
                <div className="deployments-detail__logs">
                    <DeploymentLogsViewer
                        logs={logs}
                        isLoading={isLoadingLogs}
                        status={deployment.status}
                        className="deployments-detail__logs-viewer"
                    />
                </div>

                <div className="deployments-detail__sidebar">
                    <Card variant="transparent">
                        <CardHeader title="Commit Details" />
                        <CardBody>
                            <div className="deployments-detail__commit-message">
                                {deployment.git_message || 'No commit message'}
                            </div>
                            <div className="deployments-detail__commit-meta">
                                <Badge variant="secondary" size="xs">{deployment.git_ref || 'main'}</Badge>
                                <span className="deployments-detail__dot">•</span>
                                <span className="deployments-detail__mono">{deployment.git_sha ? deployment.git_sha.substring(0, 7) : '-'}</span>
                            </div>
                            <div className="deployments-detail__author">
                                <Icon name="user" size={12} />
                                <span>{deployment.git_author || 'Unknown author'}</span>
                            </div>
                        </CardBody>
                    </Card>

                    <Card variant="transparent">
                        <CardHeader title="Timeline" />
                        <CardBody>
                            <div className="deployments-detail__timeline-row">
                                <span className="deployments-detail__timeline-label">Queued</span>
                                <span>{formatDateTime(deployment.queued_at)}</span>
                            </div>
                            <div className="deployments-detail__timeline-row">
                                <span className="deployments-detail__timeline-label">Started</span>
                                <span>{formatDateTime(deployment.started_at)}</span>
                            </div>
                            <div className="deployments-detail__timeline-row">
                                <span className="deployments-detail__timeline-label">Finished</span>
                                <span>{formatDateTime(deployment.finished_at)}</span>
                            </div>
                            <div className="deployments-detail__timeline-row deployments-detail__timeline-row--strong">
                                <span className="deployments-detail__timeline-label">Duration</span>
                                <span className="deployments-detail__mono">{formatDuration(deployment.duration_seconds)}</span>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>

            {isRunning && (
                <div className="deployments-detail__live-banner">
                    <Icon name="loader" size={14} className="animate-spin" />
                    <span>Deployment is running. Logs update automatically.</span>
                </div>
            )}
        </div>
    );
}

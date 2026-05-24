
import {
    Clock,
    Loader2,
    CheckCircle2,
    XCircle,
    StopCircle,
    AlertTriangle
} from 'lucide-react';
import { Badge, type BadgeVariant } from '@/src/components/shared/ui/Badge';

interface DeploymentStatusBadgeProps {
    status: string;
    className?: string;
}

export function DeploymentStatusBadge({ status, className = '' }: DeploymentStatusBadgeProps) {
    const getStatusConfig = (status: string): { icon: any; text: string; variant: BadgeVariant; spin?: boolean } => {
        const s = status.toLowerCase();
        switch (s) {
            case 'queued':
                return { icon: Clock, text: 'Queued', variant: 'warning' };
            case 'cloning':
            case 'building':
            case 'deploying':
                return { icon: Loader2, text: s.charAt(0).toUpperCase() + s.slice(1), variant: 'info', spin: true };
            case 'success':
            case 'active':
                return { icon: CheckCircle2, text: 'Success', variant: 'success' };
            case 'failed':
            case 'error':
                return { icon: XCircle, text: 'Failed', variant: 'danger' };
            case 'canceled':
                return { icon: StopCircle, text: 'Canceled', variant: 'default' };
            default:
                return { icon: AlertTriangle, text: status, variant: 'default' };
        }
    };

    const config = getStatusConfig(status);
    const StatusIcon = config.icon;

    return (
        <Badge variant={config.variant} className={className}>
            <StatusIcon size={14} className={`deployment-status-badge__icon${config.spin ? ' animate-spin' : ''}`} />
            {config.text}
        </Badge>
    );
}

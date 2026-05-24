'use client';

import { parsePayload } from '@/src/api/cosign';
import { ConfidenceBadge } from '@/src/components/shared/ui/ConfidenceBadge';
import { useCoSignRequests } from '@/src/hooks/queries/cosign';

interface Props {
    workspaceId: string;
    referenceId: string;
    referenceType: 'doc' | 'task';
}

const statusLabels: Record<string, string> = {
    pending: 'Pending',
    approved: 'Approved',
    auto_approved: 'Auto-Approved',
    rejected: 'Rejected',
};

const statusClasses: Record<string, string> = {
    pending: 'badge--warning',
    approved: 'badge--success',
    auto_approved: 'badge--info',
    rejected: 'badge--danger',
};

export function CoSignHistoryTab({ workspaceId, referenceId, referenceType }: Props) {
    const payloadKey = referenceType === 'doc' ? 'doc_id' : 'task_id';
    const { data, isLoading } = useCoSignRequests(workspaceId, { status: '' });

    const requests = (data?.requests ?? []).filter(
        (req) => parsePayload(req)[payloadKey] === referenceId
    );

    if (isLoading) {
        return <p className="cosign-history__empty">Loading…</p>;
    }

    if (requests.length === 0) {
        return (
            <p className="cosign-history__empty">No Co-Sign history for this task.</p>
        );
    }

    return (
        <ul className="cosign-history">
            {requests.map((req) => (
                <li key={req.id} className="cosign-history__item">
                    <div className="cosign-history__item-header">
                        <span className={`badge badge--sm ${statusClasses[req.status] ?? 'badge--default'}`}>
                            {statusLabels[req.status] ?? req.status}
                        </span>
                        <ConfidenceBadge score={req.confidence_score} size="sm" />
                    </div>
                    <p className="cosign-history__rationale">
                        {req.rationale
                            ? <>{req.rationale.slice(0, 120)}{req.rationale.length > 120 ? '…' : ''}</>
                            : <span className="cosign-history__rationale--empty">No rationale provided</span>
                        }
                    </p>
                    {req.resolved_at && (
                        <span className="cosign-history__date">
                            {new Date(req.resolved_at).toLocaleString()}
                        </span>
                    )}
                </li>
            ))}
        </ul>
    );
}

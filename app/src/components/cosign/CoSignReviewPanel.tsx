'use client';

import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { closeAllViews, selectSidebarViewData } from '@/src/store/slices/layoutSlice';
import { selectCurrentWorkspaceId } from '@/src/store/slices/workspaceSlice';
import { useCoSignRequest, useApproveCoSign, useRejectCoSign, parseCheckpoints, parseCheckpointResults } from '@/src/hooks/queries/cosign';
import { ConfidenceBadge } from '@/src/components/shared/ui/ConfidenceBadge';
import { Button, Textarea } from '@/src/components/shared/ui';
import { CheckpointList } from './CheckpointList';

const outputTypeLabels: Record<string, string> = {
    doc: 'Knowledge Doc',
    doc_upload: 'Uploaded Doc',
    triage: 'Triage Suggestion',
    assignment: 'Task Assignment',
};

const statusLabels: Record<string, string> = {
    pending: 'Pending Review',
    approved: 'Approved',
    auto_approved: 'Auto-Approved',
    rejected: 'Rejected',
};

export default function CoSignReviewPanel() {
    const dispatch = useAppDispatch();
    const viewData = useAppSelector(selectSidebarViewData) as { requestId?: string } | null;
    const workspaceId = useAppSelector(selectCurrentWorkspaceId) ?? '';
    const requestId = viewData?.requestId ?? '';

    const { data: req, isLoading } = useCoSignRequest(workspaceId, requestId);
    const approve = useApproveCoSign(workspaceId);
    const reject = useRejectCoSign(workspaceId);

    const [showRejectInput, setShowRejectInput] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    const handleApprove = async () => {
        if (!req) return;
        await approve.mutateAsync(req.id);
        dispatch(closeAllViews());
    };

    const handleReject = async () => {
        if (!req) return;
        await reject.mutateAsync({ id: req.id, reason: rejectReason });
        dispatch(closeAllViews());
    };

    if (isLoading || !req) {
        return <div className="cosign-review"><p>Loading…</p></div>;
    }

    const checkpoints = parseCheckpoints(req);
    const checkpointResults = parseCheckpointResults(req);
    const isPending = req.status === 'pending';

    return (
        <div className="cosign-review">
            <div className="cosign-review__header">
                <span className="cosign-review__output-type">
                    {outputTypeLabels[req.output_type] ?? req.output_type}
                </span>
                <ConfidenceBadge score={req.confidence_score} size="md" />
                <span className="badge badge--default">{statusLabels[req.status] ?? req.status}</span>
            </div>

            <blockquote className="cosign-review__rationale">
                {req.rationale || 'No rationale provided.'}
            </blockquote>

            {checkpoints.length > 0 && (
                <div>
                    <p className="cosign-review__section-title">Checkpoints</p>
                    <CheckpointList checkpoints={checkpoints} results={checkpointResults} />
                </div>
            )}

            {isPending && (
                <div className="cosign-review__actions">
                    {!showRejectInput ? (
                        <div className="cosign-review__action-row">
                            <Button
                                variant="primary"
                                onClick={handleApprove}
                                disabled={approve.isPending}
                            >
                                {approve.isPending ? 'Approving…' : 'Approve'}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setShowRejectInput(true)}
                            >
                                Reject
                            </Button>
                        </div>
                    ) : (
                        <>
                            <Textarea
                                className="cosign-review__reject-input"
                                placeholder="Reason for rejection (optional)"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                rows={3}
                            />
                            <div className="cosign-review__action-row">
                                <Button
                                    variant="danger"
                                    onClick={handleReject}
                                    disabled={reject.isPending}
                                >
                                    {reject.isPending ? 'Rejecting…' : 'Confirm Reject'}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => { setShowRejectInput(false); setRejectReason(''); }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

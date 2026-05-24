'use client';

import { useState } from 'react';
import { Check, X, Edit2, Lock, AlertTriangle } from 'lucide-react';
import { KnowledgeDoc } from '@/src/api/knowledge';
import { usePublishKnowledgeDoc, useRejectKnowledgeDraft, useUpdateKnowledgeDoc } from '@/src/hooks/queries/knowledge';

interface DraftReviewPanelProps {
    doc: KnowledgeDoc;
    projectId: string;
    locked?: boolean;
    onPublish?: () => void;
}

export default function DraftReviewPanel({ doc, projectId, locked = false, onPublish }: DraftReviewPanelProps) {
    const [editing, setEditing] = useState(false);
    const [title, setTitle] = useState(doc.title);
    const [body, setBody] = useState(doc.body);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectForm, setShowRejectForm] = useState(false);

    const publish = usePublishKnowledgeDoc(projectId);
    const reject = useRejectKnowledgeDraft(projectId);
    const update = useUpdateKnowledgeDoc(projectId);

    const handlePublish = () => publish.mutate(doc.id, { onSuccess: () => onPublish?.() });
    const handleReject = () => {
        reject.mutate({ id: doc.id, reason: rejectReason });
        setShowRejectForm(false);
    };
    const handleSave = async () => {
        await update.mutateAsync({ id: doc.id, title, body });
        setEditing(false);
    };

    // Draft locked by a pending Co-Sign review — block manual actions.
    if (locked) {
        return (
            <div className="draft-review draft-review--locked">
                <div className="draft-review__lock-banner">
                    <Lock size={14} />
                    <span>Pending Co-Sign Review — approve or reject this document in the Co-Sign queue.</span>
                </div>
            </div>
        );
    }

    // Co-Sign was rejected: doc is preserved, human decides next step.
    if (doc.status === 'cosign_rejected') {
        return (
            <div className="draft-review draft-review--cosign-rejected">
                <div className="draft-review__cosign-rejected-banner">
                    <AlertTriangle size={14} />
                    <span>Co-Sign Rejected — the AI auto-publish was declined. You can still publish manually or discard.</span>
                </div>
                {showRejectForm ? (
                    <div className="draft-review__reject-form">
                        <input
                            className="draft-review__reason-input"
                            placeholder="Reason for discarding (optional)"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                        <div className="draft-review__actions">
                            <button className="btn btn--danger btn--sm" onClick={handleReject} disabled={reject.isPending}>
                                {reject.isPending ? 'Discarding…' : 'Confirm Discard'}
                            </button>
                            <button className="btn btn--ghost btn--sm" onClick={() => setShowRejectForm(false)}>Cancel</button>
                        </div>
                    </div>
                ) : (
                    <div className="draft-review__actions">
                        <button className="btn btn--primary btn--sm" onClick={handlePublish} disabled={publish.isPending}>
                            <Check size={14} />
                            {publish.isPending ? 'Publishing…' : 'Publish Manually'}
                        </button>
                        <button className="btn btn--ghost btn--sm" onClick={() => setShowRejectForm(true)}>
                            <X size={14} /> Discard
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // Normal draft editing mode.
    if (editing) {
        return (
            <div className="draft-review draft-review--editing">
                <input
                    className="draft-review__title-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Title"
                />
                <textarea
                    className="draft-review__body-input"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={10}
                />
                <div className="draft-review__actions">
                    <button className="btn btn--primary btn--sm" onClick={handleSave} disabled={update.isPending}>
                        {update.isPending ? 'Saving…' : 'Save'}
                    </button>
                    <button className="btn btn--ghost btn--sm" onClick={() => setEditing(false)}>Cancel</button>
                </div>
            </div>
        );
    }

    return (
        <div className="draft-review">
            {doc.rationale && (
                <p className="draft-review__rationale"><em>AI rationale:</em> {doc.rationale}</p>
            )}

            {showRejectForm ? (
                <div className="draft-review__reject-form">
                    <input
                        className="draft-review__reason-input"
                        placeholder="Reason for rejection (optional)"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                    />
                    <div className="draft-review__actions">
                        <button className="btn btn--danger btn--sm" onClick={handleReject} disabled={reject.isPending}>
                            {reject.isPending ? 'Rejecting…' : 'Confirm Reject'}
                        </button>
                        <button className="btn btn--ghost btn--sm" onClick={() => setShowRejectForm(false)}>Cancel</button>
                    </div>
                </div>
            ) : (
                <div className="draft-review__actions">
                    <button
                        className="btn btn--primary btn--sm"
                        onClick={handlePublish}
                        disabled={publish.isPending}
                    >
                        <Check size={14} />
                        {publish.isPending ? 'Publishing…' : 'Approve'}
                    </button>
                    <button className="btn btn--ghost btn--sm" onClick={() => setEditing(true)}>
                        <Edit2 size={14} /> Edit
                    </button>
                    <button className="btn btn--ghost btn--sm" onClick={() => setShowRejectForm(true)}>
                        <X size={14} /> Reject
                    </button>
                </div>
            )}
        </div>
    );
}

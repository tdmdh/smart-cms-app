'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, GitBranch, CheckSquare, Upload, FileText } from 'lucide-react';
import { KnowledgeDoc } from '@/src/api/knowledge';
import { Badge } from '@/src/components/shared/ui';
import { MarkdownViewer } from '@/src/components/shared/MarkdownViewer';
import DraftReviewPanel from './DraftReviewPanel';

interface KnowledgeDocCardProps {
    doc: KnowledgeDoc;
    projectId: string;
    canReview?: boolean;
    locked?: boolean;
    onPublish?: () => void;
    archetypeName?: string;
}

const SOURCE_ICONS: Record<string, React.ReactNode> = {
    git: <GitBranch size={13} />,
    task: <CheckSquare size={13} />,
    upload: <Upload size={13} />,
    manual: <FileText size={13} />,
};

const STATUS_CLASS: Record<string, string> = {
    draft: 'knowledge-card__status--draft',
    published: 'knowledge-card__status--published',
    rejected: 'knowledge-card__status--rejected',
    cosign_rejected: 'knowledge-card__status--cosign-rejected',
};

const STATUS_LABEL: Record<string, string> = {
    draft: 'draft',
    published: 'published',
    rejected: 'rejected',
    cosign_rejected: 'co-sign rejected',
};

export default function KnowledgeDocCard({ doc, projectId, canReview = false, locked = false, onPublish, archetypeName }: KnowledgeDocCardProps) {
    const [expanded, setExpanded] = useState(false);

    const showReviewPanel = canReview && (doc.status === 'draft' || doc.status === 'cosign_rejected');

    return (
        <article className="knowledge-card">
            <header className="knowledge-card__header" onClick={() => setExpanded((v) => !v)}>
                <div className="knowledge-card__meta">
                    <span className="knowledge-card__source" title={doc.source_type}>
                        {SOURCE_ICONS[doc.source_type] ?? <FileText size={13} />}
                        <span>{doc.source_type}</span>
                    </span>
                    <span className={`knowledge-card__status ${STATUS_CLASS[doc.status] ?? ''}`}>
                        {STATUS_LABEL[doc.status] ?? doc.status}
                    </span>
                    {doc.status === 'draft' && doc.confidence_score > 0 && (
                        <span className="knowledge-card__confidence">{doc.confidence_score}% confidence</span>
                    )}
                    {archetypeName && (
                        <Badge variant="secondary" size="xs" pill icon="file-text" title={`Archetype: ${archetypeName}`}>
                            {archetypeName}
                        </Badge>
                    )}
                    <span className="knowledge-card__date" title={doc.created_at}>
                        {new Date(doc.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                </div>

                <h3 className="knowledge-card__title">{doc.title}</h3>

                <button
                    className="knowledge-card__toggle"
                    aria-label={expanded ? 'Collapse' : 'Expand'}
                    aria-expanded={expanded}
                >
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
            </header>

            {expanded && (
                <div className="knowledge-card__body">
                    <MarkdownViewer content={doc.body} />

                    {showReviewPanel && (
                        <DraftReviewPanel doc={doc} projectId={projectId} locked={locked} onPublish={onPublish} />
                    )}
                </div>
            )}
        </article>
    );
}

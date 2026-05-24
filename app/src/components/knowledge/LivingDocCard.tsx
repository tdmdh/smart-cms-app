'use client';

import { useEffect, useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { KnowledgeDoc } from '@/src/api/knowledge';
import { MarkdownViewer } from '@/src/components/shared/MarkdownViewer';

interface LivingDocCardProps {
    doc: KnowledgeDoc;
}

export default function LivingDocCard({ doc }: LivingDocCardProps) {
    const [pulsing, setPulsing] = useState(false);
    const [expanded, setExpanded] = useState(true);

    // Pulse briefly whenever updatedAt changes (living doc was just updated).
    useEffect(() => {
        setPulsing(true);
        const t = setTimeout(() => setPulsing(false), 2500);
        return () => clearTimeout(t);
    }, [doc.updated_at]);

    const updatedAt = new Date(doc.updated_at).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <article className={`knowledge-living${pulsing ? ' knowledge-living--pulsing' : ''}`}>
            <header
                className="knowledge-living__header knowledge-living__header--clickable"
                onClick={() => setExpanded((v) => !v)}
            >
                <span className="knowledge-living__badge">
                    <Sparkles size={11} />
                    Living Document
                </span>
                <h3 className="knowledge-living__title">{doc.title}</h3>
                <span className="knowledge-living__updated">Updated {updatedAt}</span>
                <button
                    className="knowledge-living__toggle"
                    aria-label={expanded ? 'Collapse' : 'Expand'}
                    aria-expanded={expanded}
                    onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
                >
                    {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
            </header>
            {expanded && (
                <div className="knowledge-living__body">
                    <MarkdownViewer content={doc.body} />
                </div>
            )}
        </article>
    );
}

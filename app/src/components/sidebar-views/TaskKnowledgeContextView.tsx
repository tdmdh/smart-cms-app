'use client';

import { BookOpen, ExternalLink } from 'lucide-react';
import { useAppSelector } from '@/src/store/hooks';
import { selectSidebarViewData } from '@/src/store/slices/layoutSlice';
import { useLocalKnowledgeSearch, useKnowledgeDocs } from '@/src/hooks/queries/knowledge';
import { MarkdownViewer } from '@/src/components/shared/MarkdownViewer';

interface ViewData {
    taskId?: string;
    projectId?: string;
    keywords?: string;
}

export default function TaskKnowledgeContextView() {
    const viewData = useAppSelector(selectSidebarViewData) as ViewData | null;
    const projectId = viewData?.projectId ?? '';
    const keywords = viewData?.keywords ?? '';

    // Ensure the cache is warm for the local search
    useKnowledgeDocs(projectId, { status: 'published' });

    const docs = useLocalKnowledgeSearch(projectId, keywords);

    if (!projectId) {
        return (
            <div className="knowledge-context knowledge-context--empty">
                <BookOpen size={24} />
                <p>No task selected</p>
            </div>
        );
    }

    return (
        <div className="knowledge-context">
            <header className="knowledge-context__header">
                <BookOpen size={16} />
                <span>Relevant knowledge</span>
                <span className="knowledge-context__count">{docs.length} docs</span>
            </header>

            {docs.length === 0 && (
                <div className="knowledge-context--empty">
                    <p>No matching knowledge docs found.</p>
                    <p className="knowledge-context__hint">
                        Knowledge docs are auto-drafted from commits, completed tasks, and uploads.
                    </p>
                </div>
            )}

            <ul className="knowledge-context__list">
                {docs.map((doc) => (
                    <li key={doc.id} className="knowledge-context__item">
                        <div className="knowledge-context__item-header">
                            <h4 className="knowledge-context__title">{doc.title}</h4>
                            <a
                                className="knowledge-context__source"
                                title={`Source: ${doc.source_type} / ${doc.source_ref}`}
                                aria-label="Source reference"
                            >
                                <ExternalLink size={12} />
                            </a>
                        </div>
                        <details className="knowledge-context__collapse">
                            <summary className="knowledge-context__summary">Read more</summary>
                            <MarkdownViewer content={doc.body} />
                        </details>
                    </li>
                ))}
            </ul>
        </div>
    );
}

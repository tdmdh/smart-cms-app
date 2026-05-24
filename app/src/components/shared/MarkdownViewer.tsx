'use client';

import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

interface MarkdownViewerProps {
    content: string;
    className?: string;
}

export function MarkdownViewer({ content, className }: MarkdownViewerProps) {
    return (
        <div className={`markdown-viewer ${className ?? ''}`.trim()}>
            <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                {content}
            </ReactMarkdown>
        </div>
    );
}

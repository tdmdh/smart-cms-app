import KnowledgeBase from '@/src/components/knowledge/KnowledgeBase';

interface PageProps {
    params: Promise<{ projectId: string }>;
}

export default async function KnowledgePage({ params }: PageProps) {
    const { projectId } = await params;
    return <KnowledgeBase projectId={projectId} />;
}

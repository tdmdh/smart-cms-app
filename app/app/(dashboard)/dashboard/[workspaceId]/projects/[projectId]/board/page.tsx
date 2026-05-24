import { ProjectKanban } from '@/src/components/projects';

interface PageProps {
    params: Promise<{ projectId: string }>;
}

export default async function BoardPage({ params }: PageProps) {
    const { projectId } = await params;

    return <ProjectKanban projectId={projectId} />;
}

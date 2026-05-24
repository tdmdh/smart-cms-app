import { ProjectMedia } from '@/src/components/projects';

interface PageProps {
    params: Promise<{ projectId: string }>;
}

export default async function FilesPage({ params }: PageProps) {
    const { projectId } = await params;

    return <ProjectMedia projectId={projectId} />;
}

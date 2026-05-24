import { ProjectTeam } from '@/src/components/projects';

interface PageProps {
    params: Promise<{ projectId: string }>;
}

export default async function TeamPage({ params }: PageProps) {
    const { projectId } = await params;

    return <ProjectTeam projectId={projectId} />;
}

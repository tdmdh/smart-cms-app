import { ProjectDashboard } from '@/src/components/projects';

interface PageProps {
    params: Promise<{ projectId: string }>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
    const { projectId } = await params;

    return <ProjectDashboard projectId={projectId} />;
}
 

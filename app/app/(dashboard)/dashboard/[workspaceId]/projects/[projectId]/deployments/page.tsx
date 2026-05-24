import ProjectDeploymentsPage from '@/src/components/deployments/ProjectDeploymentsPage';

interface PageProps {
    params: Promise<{ projectId: string }>;
}

export default async function DeploymentsPage({ params }: PageProps) {
    const { projectId } = await params;

    return <ProjectDeploymentsPage projectId={projectId} />;
}

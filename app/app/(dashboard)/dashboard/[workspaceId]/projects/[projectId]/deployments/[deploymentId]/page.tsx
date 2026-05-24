import DeploymentDetailPageContent from '@/src/components/deployments/DeploymentDetailPageContent';

interface PageProps {
    params: Promise<{ projectId: string; deploymentId: string }>;
}

export default async function DeploymentDetailPage({ params }: PageProps) {
    const { projectId, deploymentId } = await params;

    return <DeploymentDetailPageContent projectId={projectId} deploymentId={deploymentId} />;
}

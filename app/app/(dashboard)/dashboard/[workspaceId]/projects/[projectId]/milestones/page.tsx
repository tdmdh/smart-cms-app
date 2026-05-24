import { MilestonesList } from '@/src/components/projects';

interface PageProps {
    params: Promise<{ projectId: string }>;
}

export default async function MilestonesPage({ params }: PageProps) {
    const { projectId } = await params;

    return <MilestonesList projectId={projectId} />;
}

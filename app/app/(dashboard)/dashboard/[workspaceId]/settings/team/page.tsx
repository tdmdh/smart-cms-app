import { WorkspaceTeam } from '@/src/components/workspace';

interface PageProps {
    params: Promise<{ workspaceId: string }>;
}

export default async function WorkspaceTeamPage({ params }: PageProps) {
    const { workspaceId } = await params;

    return (
        <div className="dashboard-page">
            <div className="dashboard-page__header">
                <h1 className="dashboard-page__title">Team</h1>
                <p className="dashboard-page__description">Manage your team members and their roles.</p>
            </div>
            <WorkspaceTeam workspaceId={workspaceId} />
        </div>
    )
}

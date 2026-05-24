import { BandwidthMeter } from '@/src/components/dashboard/BandwidthMeter';

export default async function WorkspaceDashboardPage({
    params,
}: {
    params: Promise<{ workspaceId: string }>;
}) {
    const { workspaceId } = await params;

    return (
        <div className="dashboard-page">
            <header className="dashboard-page__header">
                <h1 className="dashboard-page__title">Dashboard</h1>
                <p className="dashboard-page__description">
                    An overview of your workspace activity.
                </p>
            </header>
            <div className="dashboard-widgets">
                <BandwidthMeter workspaceId={workspaceId} />
            </div>
        </div>
    );
}

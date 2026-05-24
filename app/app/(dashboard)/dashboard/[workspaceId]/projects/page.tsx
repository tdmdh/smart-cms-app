import { ProjectsList } from '@/src/components/projects';

export default function ProjectsPage() {
    return (
        <div className="dashboard-page">
            <div className="dashboard-page__header">
                <h1 className="dashboard-page__title">Projects</h1>
                <p className="dashboard-page__description">Manage your projects and track progress across all clients.</p>
            </div>
            <ProjectsList />
        </div>
    );
}

'use client';

import { useParams } from 'next/navigation';

export default function ClientProjectsPage() {
    const params = useParams();
    const clientSlug = params.clientSlug as string;

    return (
        <div className="portal-projects">
            <div className="portal-projects__header">
                <h1 className="portal-projects__title">Your Projects</h1>
                <p className="portal-projects__subtitle">
                    Track progress and updates on all your projects.
                </p>
            </div>

            <div className="portal-projects__list">
                <div className="portal-card portal-card--empty">
                    <p>Loading projects...</p>
                </div>
            </div>
        </div>
    );
}

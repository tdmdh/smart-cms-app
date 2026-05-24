'use client';

import { useParams } from 'next/navigation';

export default function ClientTasksPage() {
    const params = useParams();
    const clientSlug = params.clientSlug as string;

    return (
        <div className="portal-tasks">
            <div className="portal-tasks__header">
                <h1 className="portal-tasks__title">Tasks</h1>
                <p className="portal-tasks__subtitle">
                    View and track tasks across your projects.
                </p>
            </div>

            <div className="portal-tasks__list">
                <div className="portal-card portal-card--empty">
                    <p>Loading tasks...</p>
                </div>
            </div>
        </div>
    );
}

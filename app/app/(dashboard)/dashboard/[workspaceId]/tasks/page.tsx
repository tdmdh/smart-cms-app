'use client';

import { TasksList } from '@/src/components/tasks/TasksList';

export default function TasksPage() {
    return (
        <div className="dashboard-page">
            <header className="dashboard-page__header">
                <h1 className="dashboard-page__title">My Tasks</h1>
                <p className="dashboard-page__description">
                    View and manage all tasks assigned to you
                </p>
            </header>
            <TasksList />
        </div>
    );
}

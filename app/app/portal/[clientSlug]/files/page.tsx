'use client';

import { useParams } from 'next/navigation';

export default function ClientFilesPage() {
    const params = useParams();
    const clientSlug = params.clientSlug as string;

    return (
        <div className="portal-files">
            <div className="portal-files__header">
                <h1 className="portal-files__title">Shared Files</h1>
                <p className="portal-files__subtitle">
                    Access project files and shared documents.
                </p>
            </div>

            <div className="portal-files__grid">
                <div className="portal-card portal-card--empty">
                    <p>No files uploaded yet.</p>
                </div>
            </div>
        </div>
    );
}

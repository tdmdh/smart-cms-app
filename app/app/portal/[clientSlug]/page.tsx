'use client';

import { useParams } from 'next/navigation';

export default function ClientPortalDashboard() {
    const params = useParams();
    const clientSlug = params.clientSlug as string;

    return (
        <div className="portal-dashboard">
            <div className="portal-dashboard__header">
                <h1>Client Portal: {clientSlug}</h1>
            </div>
            <div className="portal-dashboard__content">
                <p>Welcome to the portal dashboard for client: {clientSlug}</p>
            </div>
        </div>
    );
}

'use client';

import { useParams } from 'next/navigation';

export default function ClientMessagesPage() {
    const params = useParams();
    const clientSlug = params.clientSlug as string;

    return (
        <div className="portal-messages">
            <div className="portal-messages__header">
                <h1 className="portal-messages__title">Messages</h1>
                <p className="portal-messages__subtitle">
                    Communicate with the team about your projects.
                </p>
            </div>

            <div className="portal-messages__thread">
                <div className="portal-card portal-card--empty">
                    <p>No messages yet. Start a conversation!</p>
                </div>
            </div>
        </div>
    );
}

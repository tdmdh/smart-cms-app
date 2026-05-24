'use client';

import { use } from 'react';
import { useClient } from '@/src/hooks/queries/client-management';
import { ClientMembersSection } from '@/src/components/clients/ClientMembersSection';
import { AssignedDevelopersSection } from '@/src/components/clients/AssignedDevelopersSection';

interface ClientTeamPageProps {
    params: Promise<{ id: string }>;
}

export default function ClientTeamPage({ params }: ClientTeamPageProps) {
    const { id: clientId } = use(params);
    const { data: client } = useClient(clientId);

    return (
        <div className="client-team">
            {/* Agency developers assigned to this client */}
            <AssignedDevelopersSection clientId={clientId} />

            {/* Client's own invited members */}
            <ClientMembersSection clientId={clientId} clientName={client?.name} />
        </div>
    );
}

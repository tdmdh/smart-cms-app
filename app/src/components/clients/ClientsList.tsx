'use client';

import { memo } from 'react';
import { ClientCard, type Client } from './ClientCard';

interface ClientsListProps {
    clients: Client[];
    selectedIds?: string[];
    onSelect?: (id: string) => void;
}

function ClientsListComponent({ clients, selectedIds = [], onSelect }: ClientsListProps) {
    if (clients.length === 0) return null;

    return (
        <div className="clients-list">
            {clients.map((client) => (
                <ClientCard
                    key={client.id}
                    client={client}
                    selected={selectedIds.includes(client.id)}
                    onSelect={onSelect ? () => onSelect(client.id) : undefined}
                />
            ))}
        </div>
    );
}

export const ClientsList = memo(ClientsListComponent);

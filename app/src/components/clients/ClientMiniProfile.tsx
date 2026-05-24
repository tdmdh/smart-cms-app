'use client';

import { memo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, FolderKanban, Users } from 'lucide-react';
import { UserAvatar, Button, Card } from '@/src/components/shared/ui';
import { useWorkspacePath } from '@/src/hooks/useWorkspacePath';

interface ClientMiniProfileProps {
    client?: {
        id?: string;
        name?: string;
        logo?: string;
        primary_email?: string;
        primary_phone?: string;
        total_projects?: number;
        total_members?: number;
    };
    isLoading?: boolean;
    showBackButton?: boolean;
    showActions?: boolean;
    projectCount?: number;
    memberCount?: number;
}

function ClientMiniProfileComponent({
    client,
    isLoading = false,
    showBackButton = true,
    showActions = true,
    projectCount,
    memberCount
}: ClientMiniProfileProps) {
    const workspacePath = useWorkspacePath();
    if (isLoading) {
        return (
            <div className="client-mini-profile">
                {showBackButton && (
                    <div className="client-mini-profile__back">
                        <div className="skeleton h-5 w-5 rounded" />
                    </div>
                )}
                <div className="client-mini-profile__avatar">
                    <div className="skeleton h-10 w-10 rounded-lg" />
                </div>
                <div className="client-mini-profile__info">
                    <div className="skeleton h-5 w-32 rounded" />
                    <div className="skeleton h-3 w-24 rounded mt-1" />
                </div>
            </div>
        );
    }

    if (!client) return null;

    const displayProjectCount = projectCount ?? client.total_projects ?? 0;
    const displayMemberCount = memberCount ?? client.total_members ?? 0;

    return (
        <Card variant="bordered" className="client-mini-profile">
            {/* {showBackButton && (
                <Button href="/dashboard/clients" iconOnly rounded variant="ghost">
                    <ArrowLeft />
                </Button>
            )} */}

            <div>
                {client.logo ? (
                    <img src={client.logo} alt={client.name || 'Client'} />
                ) : (
                    <UserAvatar
                        name={client.name}
                        email={client.primary_email}
                        size="lg"
                    />
                )}
            </div>

            <div className="client-mini-profile__info">
                <h2 className="client-mini-profile__name">{client.name}</h2>
                <div className="client-mini-profile__meta">
                    {displayProjectCount > 0 && (
                        <span className="client-mini-profile__meta-item">
                            <FolderKanban />
                            {displayProjectCount} project{displayProjectCount !== 1 ? 's' : ''}
                        </span>
                    )}
                    {displayMemberCount > 0 && (
                        <span className="client-mini-profile__meta-item">
                            <Users />
                            {displayMemberCount} member{displayMemberCount !== 1 ? 's' : ''}
                        </span>
                    )}
                    {client.primary_email && displayProjectCount === 0 && displayMemberCount === 0 && (
                        <span className="client-mini-profile__meta-item">
                            {client.primary_email}
                        </span>
                    )}
                </div>
            </div>

            {showActions && (
                <div>
                    <Button variant="ghost" size="sm" iconSize={20} href={workspacePath(`clients/${client.id}/settings`)} leftIcon="settings" iconOnly />
                </div>
            )}
        </Card>
    );
}

export const ClientMiniProfile = memo(ClientMiniProfileComponent);

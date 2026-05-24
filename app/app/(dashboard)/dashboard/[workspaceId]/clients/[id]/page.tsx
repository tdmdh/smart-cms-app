'use client';

import { use } from 'react';
import Link from 'next/link';
import { useClient, useClientMembers } from '@/src/hooks/queries/client-management';
import { useProjects } from '@/src/hooks/queries/project-management';
import { useAppDispatch } from '@/src/store/hooks';
import { pushView } from '@/src/store/slices/layoutSlice';
import { toDashboardClient, toDashboardMembers, toDashboardProjects } from '@/src/types/dashboard';
import {
    Card,
    CardHeader,
    CardBody,
    Button,
    Skeleton,
    Alert,
    UserAvatar,
    Icon,
    EmptyState
} from '@/src/components/shared/ui';

interface ClientOverviewPageProps {
    params: Promise<{ id: string }>;
}

export default function ClientOverviewPage({ params }: ClientOverviewPageProps) {
    const { id: clientId } = use(params);
    const dispatch = useAppDispatch();
    const { data, isLoading, isError } = useClient(clientId);
    const { data: membersData } = useClientMembers(clientId);
    const { data: projectsData } = useProjects({ client_id: clientId });

    const client = toDashboardClient(data);
    const members = toDashboardMembers(membersData?.members); 
    const clientProjects = toDashboardProjects(projectsData?.projects);

    const handleCreateProject = () => {
        dispatch(pushView({
            view: 'project-form',
            data: { clientId, clientName: client?.name }
        }));
    };

    const handleInviteMember = () => {
        dispatch(pushView({
            view: 'client-member-invite-form',
            data: { clientId, clientName: client?.name }
        }));
    };

    
    return (
        <div className="client-overview">
            <header className="client-overview__header">
                <h1 className="client-overview__title">{client?.name}</h1>
                <p className="client-overview__description">
                    Manage your client and their projects
                </p>
            </header>
        </div>
    );
}

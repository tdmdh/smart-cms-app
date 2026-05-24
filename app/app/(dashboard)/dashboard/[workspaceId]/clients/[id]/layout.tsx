'use client';

import { useEffect } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { Building2, FolderKanban, Users } from 'lucide-react';
import { useClient, useClientMembers } from '@/src/hooks/queries/client-management';
import { useProjects } from '@/src/hooks/queries/project-management';
import { ClientMiniProfile } from '@/src/components/clients';
import { TabsNav, TabsHeader, TabsTriggerLink } from '@/src/components/shared/ui';
import { useAppDispatch } from '@/src/store/hooks';
import { setBreadcrumbMapping } from '@/src/store/slices/breadcrumbSlice';

interface ClientLayoutProps {
    children: React.ReactNode;
}

interface Project {
    id: string;
    client_id: string;
}

const tabs = [
    { href: '', label: 'Overview', icon: Building2, countKey: null },
    { href: '/projects', label: 'Projects', icon: FolderKanban, countKey: 'projects' },
    { href: '/team', label: 'Team', icon: Users, countKey: 'members' },
] as const;
export default function ClientLayout({ children }: ClientLayoutProps) {
    const params = useParams();
    const pathname = usePathname();
    const router = useRouter();
    const workspaceId = params.workspaceId as string;
    const clientId = params.id as string;
    const dispatch = useAppDispatch();

    const { data: clientData, isLoading: isClientLoading, isError } = useClient(clientId);
    const { data: membersData } = useClientMembers(clientId);
    const { data: projectsData } = useProjects();

    const client = clientData;
    const members = membersData?.members || [];
    const clientProjects = ((projectsData?.projects as unknown as Project[])?.filter((p) => p.client_id === clientId) || []);

    const basePath = `/dashboard/${workspaceId}/clients/${clientId}`;

    useEffect(() => {
        if (isError) {
            router.replace(`/dashboard/${workspaceId}`);
        }
    }, [isError, workspaceId, router]);

    useEffect(() => {
        if (client?.name && clientId) {
            dispatch(setBreadcrumbMapping({ id: clientId, name: client.name }));
        }
    }, [client?.name, clientId, dispatch]);

    const getTabHref = (tabHref: string) => `${basePath}${tabHref}`;

    const normalizePath = (value: string) => value.replace(/\/+$/, '');

    const isActiveTab = (tabHref: string) => {
        const currentPath = normalizePath(pathname);

        if (tabHref === '') {
            return currentPath === basePath;
        }

        const fullHref = getTabHref(tabHref);
        return currentPath === fullHref || currentPath.startsWith(`${fullHref}/`);
    };

    const getCount = (countKey: string | null): number | undefined => {
        if (!countKey) return undefined;
        if (countKey === 'projects') return clientProjects.length || undefined;
        if (countKey === 'members') return members.length || undefined;
        return undefined;
    };

    return (
        <div className="tabs">
            <TabsHeader
                layout="row"
                // topContent={
                //     <ClientMiniProfile
                //         showActions={false}
                //         client={client}
                //         isLoading={isClientLoading}
                //         projectCount={clientProjects.length}
                //         memberCount={members.length}
                //     />
                // }
            >
                <nav aria-label="Client sections">
                    <TabsNav variant="default" centered>
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = isActiveTab(tab.href);
                            const count = getCount(tab.countKey);

                            return (
                                <TabsTriggerLink
                                    key={tab.href}
                                    href={getTabHref(tab.href)}
                                    isActive={isActive}
                                    icon={<Icon size={18} className="tabs-nav__foreground" />}
                                    badge={count}
                                    showIndicator={isActive}
                                    indicatorLayoutId="client-tab-indicator"
                                    indicatorTransition={{
                                        type: 'spring',
                                        stiffness: 500,
                                        damping: 35,
                                    }}
                                >
                                    {tab.label}
                                </TabsTriggerLink>
                            );
                        })}
                    </TabsNav>
                </nav>
            </TabsHeader>
            <div className="tabs__content">
                {children}
            </div>
        </div>
    );
}

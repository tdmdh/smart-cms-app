'use client';

import { useEffect } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Columns, Target, Users, FileBox, Cloud, BookOpen, type LucideIcon } from 'lucide-react';
import { useMilestones, useProject, useProjectMembers, useTasks } from '@/src/hooks/queries/project-management';
import { useAssets } from '@/src/hooks/queries/asset-management';
import { useKnowledgeDocs } from '@/src/hooks/queries/knowledge';
import { TabsNav, TabsTriggerLink } from '@/src/components/shared/ui/Tabs';
import { useAppDispatch } from '@/src/store/hooks';
import { setBreadcrumbMapping } from '@/src/store/slices/breadcrumbSlice';

interface ProjectLayoutProps {
    children: React.ReactNode;
}

type CountKey = 'tasks' | 'milestones' | 'team' | 'assets' | 'knowledge';

interface ProjectTab {
    href: string;
    label: string;
    icon: LucideIcon;
    countKey?: CountKey;
}

const tabs: ProjectTab[] = [
    { href: '', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/board', label: 'Board', icon: Columns, countKey: 'tasks' },
    { href: '/milestones', label: 'Milestones', icon: Target, countKey: 'milestones' },
    { href: '/team', label: 'Team', icon: Users, countKey: 'team' },
    { href: '/files', label: 'Files', icon: FileBox, countKey: 'assets' },
    { href: '/deployments', label: 'Deployments', icon: Cloud },
    { href: '/knowledge', label: 'Knowledge', icon: BookOpen, countKey: 'knowledge' },
];

export default function ProjectLayout({ children }: ProjectLayoutProps) {
    const params = useParams();
    const pathname = usePathname();
    const router = useRouter();
    const workspaceId = params.workspaceId as string;
    const projectId = params.projectId as string;
    const dispatch = useAppDispatch();

    const basePath = `/dashboard/${workspaceId}/projects/${projectId}`;
    const normalizePath = (value: string) => value.replace(/\/+$/, '');
    const currentPath = normalizePath(pathname);
    const getTabHref = (tabHref: string) => `${basePath}${tabHref}`;

    const activeCountKey =
        tabs.find((tab) => {
            if (!tab.countKey) return false;
            const fullHref = getTabHref(tab.href);
            return currentPath === fullHref || currentPath.startsWith(`${fullHref}/`);
        })?.countKey ?? null;

    const { data: projectData, isError } = useProject(projectId);
    const { data: tasksData } = useTasks(projectId, undefined, {
        enabled: activeCountKey === 'tasks',
    });
    const { data: milestonesData } = useMilestones(projectId, {
        enabled: activeCountKey === 'milestones',
    });
    const { data: teamData } = useProjectMembers(projectId, {
        enabled: activeCountKey === 'team',
    });
    const { data: assetsData } = useAssets(projectId, undefined, {
        enabled: activeCountKey === 'assets',
    });
    const { data: knowledgeData } = useKnowledgeDocs(projectId, { status: 'draft' });
    const project = projectData?.project as { name?: string; client_name?: string } | undefined;
    const tasks = tasksData?.tasks || [];
    const milestones = milestonesData?.milestones || [];
    const team = teamData?.members || [];
    const assets = assetsData?.assets || [];
    const knowledgeDrafts = knowledgeData?.docs ?? [];

    useEffect(() => {
        if (isError) {
            router.replace(`/dashboard/${workspaceId}`);
        }
    }, [isError, workspaceId, router]);

    useEffect(() => {
        if (project?.name && projectId) {
            dispatch(setBreadcrumbMapping({ id: projectId, name: project.name }));
        }
    }, [project?.name, projectId, dispatch]);

    const counts: Record<CountKey, number | undefined> = {
        tasks: tasks.length || undefined,
        milestones: milestones.length || undefined,
        team: team.length || undefined,
        assets: assets.length || undefined,
        knowledge: knowledgeDrafts.length || undefined,
    };

    const isActiveTab = (tabHref: string) => {
        if (tabHref === '') {
            return currentPath === basePath;
        }
        const fullHref = getTabHref(tabHref);
        return currentPath === fullHref || currentPath.startsWith(`${fullHref}/`);
    };

    const getCount = (countKey?: CountKey): number | undefined => countKey ? counts[countKey] : undefined;

    return (
        <div className="project-detail">
            <div className="project-detail__header">
                <nav aria-label="Project sections">
                    <TabsNav variant='default' centered>
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = isActiveTab(tab.href);
                            const count = getCount(tab.countKey);

                            return (
                                <TabsTriggerLink
                                    key={tab.href}
                                    href={getTabHref(tab.href)}
                                    isActive={isActive}
                                    icon={<Icon size={16} className='tabs-nav__foreground' />}
                                    badge={count}
                                    showIndicator={isActive}
                                    indicatorLayoutId='client-tab-indicator'
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
            </div>

            <div className="tabs__content">
                {children}
            </div>
        </div>
    );
}

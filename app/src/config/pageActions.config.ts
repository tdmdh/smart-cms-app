// ==========================================================================
// PAGE ACTIONS CONFIGURATION
// ==========================================================================


import type { IconName } from '@/src/components/shared/ui';
export interface PageAction {
    id: string;
    icon: IconName;
    label: string;
    opensView?: string;
    action?: 'create' | 'refresh' | 'filter' | 'search' | 'switch' | 'back' | 'modal';
}

export interface DynamicActionConfig {
    whenHasData: PageAction;
    whenEmpty: PageAction;
}

export interface PageActionsConfig {
    route: string;
    matchNested?: boolean;
    actions?: PageAction[];
    dynamicActions?: {
        dataType: 'projects' | 'clients' | 'tasks';
        config: DynamicActionConfig;
    };
}

export const pageActionsConfig: PageActionsConfig[] = [
    {
        route: `/dashboard/[workspaceId]/projects`,
        matchNested: true,
        dynamicActions: {
            dataType: 'projects',
            config: {
                whenHasData: {
                    id: 'switch-project',
                    icon: 'chevron-up-down',
                    label: 'Switch project',
                    action: 'switch',
                    opensView: 'project-switcher',
                },
                whenEmpty: {
                    id: 'new-project',
                    icon: 'plus',
                    label: 'Create new project',
                    action: 'create',
                    opensView: 'project-form',
                },
            },
        },
    },
    {
        route: `/dashboard/[workspaceId]/clients`,
        matchNested: true,
        actions: [
            {
                id: 'new-client',
                icon: 'plus',
                label: 'Add new client',
                action: 'create',
                opensView: 'client-form',
            },
        ],
    },
    {
        route: `/dashboard/[workspaceId]/tasks`,
        matchNested: true,
        actions: [
            {
                id: 'new-task',
                icon: 'plus',
                label: 'Create new task',
                action: 'create',
                opensView: 'task-form',
            },
        ],
    },
    {
        route: `/dashboard/[workspaceId]/chat`,
        matchNested: true,
        actions: [
            {
                id: 'new-conversation',
                icon: 'plus',
                label: 'New conversation',
                action: 'modal',
            },
        ],
    }
];

export function getConfigForPath(pathname: string): PageActionsConfig | null {
    for (const config of pageActionsConfig) {
        const pattern = config.route.replace('[workspaceId]', '[^/]+');
        
        if (config.matchNested) {
            const regex = new RegExp(`^${pattern}`);
            if (regex.test(pathname)) {
                return config;
            }
        } else {
            const regex = new RegExp(`^${pattern}$`);
            if (regex.test(pathname)) {
                return config;
            }
        }
    }
    return null;
}

export function getActionsForPath(pathname: string): PageAction[] {
    const config = getConfigForPath(pathname);
    return config?.actions ?? [];
}


// ==========================================================================
// SIDEBAR VIEWS CONFIGURATION
// ==========================================================================

import { lazy, ComponentType } from 'react';

export const VIEW_WIDTHS = {
    sm: 280,
    md: 360,
    lg: 440,
    xl: 600,
    xxl: 800,
} as const;

export type ViewWidth = keyof typeof VIEW_WIDTHS | number;

export interface ViewConfig {
    component: React.LazyExoticComponent<ComponentType<any>>;
    width: ViewWidth;
    title: string;
}

export const viewRegistry: Record<string, ViewConfig> = {
    settings: {
        component: lazy(() => import('@/src/components/sidebar-views/SettingsView')),
        width: 'md',
        title: 'Settings',
    },
    profile: {
        component: lazy(() => import('@/src/components/sidebar-views/ProfileView')),
        width: 'lg',
        title: 'Edit Profile',
    },
    'project-switcher': {
        component: lazy(() => import('@/src/components/sidebar-views/ProjectSwitcherView')),
        width: 'md',
        title: 'Select Project',
    },
    'workspace-manager': {
        component: lazy(() => import('@/src/components/sidebar-views/WorkspaceManagerView')),
        width: 'md',
        title: 'Workspaces',
    },
    'workspace-switcher': {
        component: lazy(() => import('@/src/components/sidebar-views/WorkspaceSwitcherView')),
        width: 'md',
        title: 'Select Workspace',
    },
    'task-detail': {
        component: lazy(() => import('@/src/components/sidebar-views/TaskDetailView')),
        width: 'xl',
        title: 'Task Details',
    },
    'task-subtask-detail': {
        component: lazy(() => import('@/src/components/sidebar-views/TaskDetailView')),
        width: 'xl',
        title: 'Sub Task Details',
    },
    'project-form': {
        component: lazy(() => import('@/src/components/sidebar-views/ProjectFormView')),
        width: 'xxl',
        title: 'Create Project',
    },
    'task-form': {
        component: lazy(() => import('@/src/components/sidebar-views/TaskFormView')),
        width: 'xl',
        title: 'Create Task',
    },
    'task-subtask-form': {
        component: lazy(() => import('@/src/components/sidebar-views/TaskFormView')),
        width: 'xl',
        title: 'Create Sub Task',
    },
    'milestone-form': {
        component: lazy(() => import('@/src/components/sidebar-views/MilestoneFormView')),
        width: 'lg',
        title: 'Create Milestone',
    },
    'milestone-form-edit': {
        component: lazy(() => import('@/src/components/sidebar-views/MilestoneFormView')),
        width: 'lg',
        title: 'Edit Milestone',
    },
    'client-form': {
        component: lazy(() => import('@/src/components/sidebar-views/ClientFormView')),
        width: 'lg',
        title: 'New Client',
    },
    'client-member-invite-form': {
        component: lazy(() => import('@/src/components/sidebar-views/ClientMemberInviteFormView')),
        width: 'md',
        title: 'Invite Member',
    },
    'milestone-roadmap': {
        component: lazy(() => import('@/src/components/sidebar-views/MilestoneRoadmapView')),
        width: 'xl',
        title: 'Milestone Roadmap',
    },
    'deployment-config-form': {
        component: lazy(() => import('@/src/components/sidebar-views/DeploymentConfigFormView')),
        width: 'xl',
        title: 'Deployment Configuration',
    },
    'conversations': {
        component: lazy(() => import('@/src/components/sidebar-views/ConversationsView')),
        width: 'md',
        title: 'Messages',
    },
    'task-knowledge-context': {
        component: lazy(() => import('@/src/components/sidebar-views/TaskKnowledgeContextView')),
        width: 'lg',
        title: 'Knowledge Context',
    },
    'cosign-review': {
        component: lazy(() => import('@/src/components/cosign/CoSignReviewPanel')),
        width: 'lg',
        title: 'Co-Sign Review',
    },
};

export function getViewWidth(width: ViewWidth): number {
    if (typeof width === 'number') return width;
    return VIEW_WIDTHS[width];
}
export function getViewConfig(viewName: string): ViewConfig | undefined {
    return viewRegistry[viewName];
}

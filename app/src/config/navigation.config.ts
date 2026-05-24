// ==========================================================================
// NAVIGATION CONFIGURATION
// ==========================================================================

import {
    LayoutDashboard,
    FolderKanban,
    Building2,
    CheckSquare,
    FileText,
    Image,
    ChartLine,
    Bot,
    Server,
    Settings,
    Link2,
    Users,
    Inbox,
    ShieldCheck,
    type LucideIcon,
    MessageCircleCode,
    MessageCircle,
} from 'lucide-react';
import type { AgencyRole, Permission } from './permissions';
import type { ViewWidth } from './sidebarViews.config';

export interface NavLink {
    label: string;
    href?: string;
    icon: LucideIcon;
    badge?: string | number;
    children?: NavLink[];
    /** Minimum agency role required to see this item */
    requiredAgencyRole?: AgencyRole;
    /** Permission required to see this item */
    requiredPermission?: Permission;
    /** When set, dispatches setSidebarView on click (workspaceId is injected at runtime) */
    setSideBarView?: { view: string; width?: ViewWidth };
}

export interface NavSection {
    title?: string;
    links: NavLink[];
    /** Minimum agency role required to see this section */
    requiredAgencyRole?: AgencyRole;
    /** Permission required to see this section */
    requiredPermission?: Permission;
}


export const navigationConfig: NavSection[] = [
    {
        links: [
            {
                label: 'Dashboard',
                href: '/dashboard',
                icon: LayoutDashboard,
            },
            {
                label: 'Inbox',
                href: '/dashboard/inbox',
                icon: Inbox,
            },
            {
                label: 'Co-Sign',
                href: '/dashboard/cosign',
                icon: ShieldCheck,
            },
        ],
    },
    {
        links: [
            {
                label: 'Projects',
                href: '/dashboard/projects',
                icon: FolderKanban,
            },
            {
                label: 'Tasks',
                href: '/dashboard/tasks',
                icon: CheckSquare,
            },
            {
                label: 'Clients',
                href: '/dashboard/clients',
                icon: Building2,
            },
            {
                label: 'Chat',
                href: '/dashboard/chat',
                icon: MessageCircle,
                setSideBarView: { view: 'conversations', width: 'md' },
            }
        ],
    },
    {
        links: [
            {
                label: 'Integrations',
                href: '/integrations',
                icon: Link2,
            },
        ],
    },
    {
        links: [
            {
                label: 'Team',
                href: '/dashboard/settings/team',
                icon: Users,
            },
        ],
    }
];

function flattenLinks(links: NavLink[]): NavLink[] {
    return links.flatMap((link) =>
        link.children ? [link, ...flattenLinks(link.children)] : [link]
    );
}

export const allNavigationLinks = navigationConfig.flatMap((section) =>
    flattenLinks(section.links)
).filter(link => link.href);


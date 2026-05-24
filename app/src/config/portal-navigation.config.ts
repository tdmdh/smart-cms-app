// ==========================================================================
// PORTAL NAVIGATION CONFIGURATION
// ==========================================================================

import {
    LayoutDashboard,
    FolderKanban,
    CheckSquare,
    MessageSquare,
    FileStack,
} from 'lucide-react';
import type { NavLink, NavSection } from './navigation.config';

/**
 * Creates portal navigation config with client-specific routes
 * @param clientSlug - The client's URL slug
 */
export function createPortalNavigation(clientSlug: string): NavSection[] {
    const base = `/portal/${clientSlug}`;

    return [
        {
            links: [
                {
                    label: 'Dashboard',
                    href: base,
                    icon: LayoutDashboard,
                },
                {
                    label: 'Projects',
                    href: `${base}/projects`,
                    icon: FolderKanban,
                },
                {
                    label: 'Tasks',
                    href: `${base}/tasks`,
                    icon: CheckSquare,
                },
                {
                    label: 'Messages',
                    href: `${base}/messages`,
                    icon: MessageSquare,
                },
                {
                    label: 'Files',
                    href: `${base}/files`,
                    icon: FileStack,
                },
            ],
        },
    ];
}

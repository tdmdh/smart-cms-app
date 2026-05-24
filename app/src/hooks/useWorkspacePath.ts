'use client';

import { useParams, usePathname } from 'next/navigation';
import { useWorkspaceId } from '@/src/hooks/useWorkspaceId';

/**
 * Returns a helper function that prefixes any workspace-scoped path
 * with the current workspaceId segment: `/dashboard/[workspaceId]/[rest]`.
 *
 * Usage:
 *   const workspacePath = useWorkspacePath();
 *   workspacePath('projects')          // => /dashboard/abc-123/projects
 *   workspacePath('projects/my-id')    // => /dashboard/abc-123/projects/my-id
 */
export function useWorkspacePath() {
    const workspaceId = useWorkspaceId();

    return (path: string = '') => {
        if (!workspaceId) return `/dashboard`;
        const cleaned = path.startsWith('/') ? path.slice(1) : path;
        return cleaned
            ? `/dashboard/${workspaceId}/${cleaned}`
            : `/dashboard/${workspaceId}`;
    };
}

/**
 * Builds a workspace-scoped link from a static href defined in navigation.config,
 * e.g. '/dashboard/projects'  → '/dashboard/[workspaceId]/projects'
 */
export function useWorkspaceNavHref(staticHref: string): string {
    const workspaceId = useWorkspaceId();
    if (!workspaceId) return staticHref;
    // Replace /dashboard prefix with /dashboard/[workspaceId]
    return staticHref.replace(/^\/dashboard/, `/dashboard/${workspaceId}`);
}

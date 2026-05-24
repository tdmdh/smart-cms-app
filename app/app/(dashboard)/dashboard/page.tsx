'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/src/store/hooks';
import { selectCurrentWorkspaceId } from '@/src/store/slices/workspaceSlice';
import { useWorkspaces, getDefaultWorkspace } from '@/src/hooks/queries/workspace-management';

/**
 * /dashboard root page.
 *
 * Determines the workspace the user should land in and immediately redirects:
 *   - Prefer the last-used workspaceId stored in Redux/LocalStorage.
 *   - Fall back to the first workspace returned from the API.
 * Once a workspaceId is resolved → push to `/dashboard/[workspaceId]`.
 */
export default function DashboardRootPage() {
    const router = useRouter();
    const currentWorkspaceId = useAppSelector(selectCurrentWorkspaceId);
    const shouldFetchWorkspaces = !currentWorkspaceId;
    const { data, isLoading } = useWorkspaces(1, 20, {
        enabled: shouldFetchWorkspaces,
        staleTime: 10 * 60 * 1000,
    });

    useEffect(() => {
        if (currentWorkspaceId) {
            router.replace(`/dashboard/${currentWorkspaceId}`);
            return;
        }

        if (!shouldFetchWorkspaces) return;
        if (isLoading) return;

        const targetId = getDefaultWorkspace(data?.workspaces, currentWorkspaceId);
        if (targetId) {
            router.replace(`/dashboard/${targetId}`);
        }
        // If no workspace exists at all, stay here and render nothing
        // (the UI will prompt the user to create one via the sidebar).
    }, [isLoading, data, currentWorkspaceId, router, shouldFetchWorkspaces]);

    // Render nothing — this page is purely a redirect gate.
    return null;
}

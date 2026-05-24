'use client';

import { useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { setCurrentWorkspaceId, selectCurrentWorkspaceId } from '@/src/store/slices/workspaceSlice';
import { fetchAgencyRole } from '@/src/store/slices/roleSlice';
import { DeepWorkProtectionListener } from '@/src/components/dashboard/DeepWorkProtectionListener';

/**
 * This layout sits at /dashboard/[workspaceId]/ and is responsible for:
 * 1. Syncing the URL `workspaceId` param into Redux (so sidebar,
 *    switcher, and legacy LocalStorage consumers stay correct).
 * 2. Rendering children without any extra UI chrome (the dashboard
 *    layout above this already provides Sidebar + main wrapper).
 */
export default function WorkspaceScopedLayout({ children }: { children: React.ReactNode }) {
    const dispatch = useAppDispatch();
    const params = useParams<{ workspaceId: string }>();
    const workspaceId = params?.workspaceId;
    const currentWorkspaceId = useAppSelector(selectCurrentWorkspaceId);
    const lastSyncedId = useRef<string | null>(null);

    useEffect(() => {
        if (workspaceId && workspaceId !== currentWorkspaceId && workspaceId !== lastSyncedId.current) {
            lastSyncedId.current = workspaceId;
            dispatch(setCurrentWorkspaceId(workspaceId));
            // Force a refresh of user roles/permissions for the new workspace
            dispatch(fetchAgencyRole());
        }
    }, [workspaceId, currentWorkspaceId, dispatch]);

    return (
        <>
            {workspaceId && <DeepWorkProtectionListener workspaceId={workspaceId} />}
            {children}
        </>
    );
}


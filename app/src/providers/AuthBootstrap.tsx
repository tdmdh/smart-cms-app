'use client';

import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import {
    fetchCurrentUser,
    selectIsInitialized,
    selectIsLoading,
    selectIsAuthenticated,
    selectUser,
} from '@/src/store/slices/authSlice';
import { fetchAgencyRole, selectAgencyRole, selectRoleIsLoading } from '@/src/store/slices/roleSlice';
import { selectCurrentWorkspaceId, setCurrentWorkspaceId } from '@/src/store/slices/workspaceSlice';
import { getDefaultWorkspace, useWorkspaces } from '@/src/hooks/queries/workspace-management';

export function AuthBootstrap() {
    const dispatch = useAppDispatch();
    const isInitialized = useAppSelector(selectIsInitialized);
    const isLoading = useAppSelector(selectIsLoading);
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const user = useAppSelector(selectUser);

    const agencyRole = useAppSelector(selectAgencyRole);
    const roleIsLoading = useAppSelector(selectRoleIsLoading);
    const currentWorkspaceId = useAppSelector(selectCurrentWorkspaceId);
    const { data: workspaceData } = useWorkspaces();

    const hasRequestedUserRef = useRef(false);
    const lastRoleUserIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!isInitialized && !isLoading && !hasRequestedUserRef.current) {
            hasRequestedUserRef.current = true;
            dispatch(fetchCurrentUser());
        }
    }, [dispatch, isInitialized, isLoading]);

    useEffect(() => {
        if (!isAuthenticated || !user) {
            lastRoleUserIdRef.current = null;
            return;
        }

        if (roleIsLoading) {
            return;
        }

        if (lastRoleUserIdRef.current !== user.id && agencyRole === null) {
            lastRoleUserIdRef.current = user.id;
            dispatch(fetchAgencyRole());
        }
    }, [dispatch, isAuthenticated, user, roleIsLoading, agencyRole]);

    useEffect(() => {
        if (!isAuthenticated || !workspaceData?.workspaces) {
            return;
        }

        // Only set a default if we don't have a current workspace ID yet.
        // This prevents fighting with WorkspaceScopedLayout which syncs from the URL.
        if (!currentWorkspaceId) {
            const nextWorkspaceId = getDefaultWorkspace(workspaceData.workspaces, null);
            if (nextWorkspaceId) {
                dispatch(setCurrentWorkspaceId(nextWorkspaceId));
            }
        }
    }, [dispatch, isAuthenticated, workspaceData?.workspaces, currentWorkspaceId]);

    return null;
}

export default AuthBootstrap;

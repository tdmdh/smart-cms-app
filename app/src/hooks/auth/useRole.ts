import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import {
    fetchAgencyRole,
    fetchClientRole,
    clearRoles,
    setCurrentClientId,
    selectAgencyRole,
    selectClientRole,
    selectCurrentClientId,
    selectRoleIsLoading,
    selectRoleError,
    selectIsAgencyMember,
} from '@/src/store/slices/roleSlice';
import type { AgencyRole, ClientRole, Permission } from '@/src/config/permissions';
import {
    hasAgencyPermission,
    hasClientPermission,
    meetsMinimumAgencyRole,
    meetsMinimumClientRole,
} from '@/src/config/permissions';

interface UseRoleReturn {
    agencyRole: AgencyRole | null;
    clientRole: ClientRole | null;
    currentClientId: string | null;
    isAgencyMember: boolean;
    isLoading: boolean;
    error: string | null;

    hasPermission: (permission: Permission) => boolean;
    hasAgencyPermission: (permission: Permission) => boolean;
    hasClientPermission: (permission: Permission) => boolean;
    meetsAgencyRole: (requiredRole: AgencyRole) => boolean;
    meetsClientRole: (requiredRole: ClientRole) => boolean;

    canManageAgency: boolean;
    canManageClients: boolean;
    canAssignDevelopers: boolean;
    canManageMembers: boolean;
    canManageProjects: boolean;

    refreshAgencyRole: () => Promise<void>;
    loadClientRole: (clientId: string) => Promise<void>;
    clearAllRoles: () => void;
    setClientContext: (clientId: string | null) => void;
}

export function useRole(): UseRoleReturn {
    const dispatch = useAppDispatch();

    const agencyRole = useAppSelector(selectAgencyRole);
    const clientRole = useAppSelector(selectClientRole);
    const currentClientId = useAppSelector(selectCurrentClientId);
    const isLoading = useAppSelector(selectRoleIsLoading);
    const error = useAppSelector(selectRoleError);
    const isAgencyMember = useAppSelector(selectIsAgencyMember);

    const checkAgencyPermission = useCallback(
        (permission: Permission) => hasAgencyPermission(agencyRole, permission),
        [agencyRole]
    );

    const checkClientPermission = useCallback(
        (permission: Permission) => hasClientPermission(clientRole, permission),
        [clientRole]
    );

    const checkPermission = useCallback(
        (permission: Permission) =>
            checkAgencyPermission(permission) || checkClientPermission(permission),
        [checkAgencyPermission, checkClientPermission]
    );

    const meetsAgencyRole = useCallback(
        (requiredRole: AgencyRole) => meetsMinimumAgencyRole(agencyRole, requiredRole),
        [agencyRole]
    );

    const meetsClientRole = useCallback(
        (requiredRole: ClientRole) => meetsMinimumClientRole(clientRole, requiredRole),
        [clientRole]
    );

    const shortcuts = useMemo(
        () => ({
            canManageAgency: hasAgencyPermission(agencyRole, 'manage_agency'),
            canManageClients: hasAgencyPermission(agencyRole, 'manage_clients'),
            canAssignDevelopers: hasAgencyPermission(agencyRole, 'assign_developers'),
            canManageMembers:
                hasAgencyPermission(agencyRole, 'manage_members') ||
                hasClientPermission(clientRole, 'manage_members'),
            canManageProjects:
                hasAgencyPermission(agencyRole, 'manage_project') ||
                hasClientPermission(clientRole, 'manage_project'),
        }),
        [agencyRole, clientRole]
    );

    const refreshAgencyRole = useCallback(async () => {
        await dispatch(fetchAgencyRole());
    }, [dispatch]);

    const loadClientRole = useCallback(
        async (clientId: string) => {
            await dispatch(fetchClientRole(clientId));
        },
        [dispatch]
    );

    const clearAllRoles = useCallback(() => {
        dispatch(clearRoles());
    }, [dispatch]);

    const setClientContext = useCallback(
        (clientId: string | null) => {
            dispatch(setCurrentClientId(clientId));
        },
        [dispatch]
    );

    return {
        agencyRole,
        clientRole,
        currentClientId,
        isAgencyMember,
        isLoading,
        error,
        hasPermission: checkPermission,
        hasAgencyPermission: checkAgencyPermission,
        hasClientPermission: checkClientPermission,
        meetsAgencyRole,
        meetsClientRole,
        ...shortcuts,
        refreshAgencyRole,
        loadClientRole,
        clearAllRoles,
        setClientContext,
    };
}

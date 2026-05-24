'use client';

import { type ReactNode } from 'react';
import { useRole } from '@/src/hooks/auth/useRole';
import type { AgencyRole, ClientRole, Permission } from '@/src/config/permissions';

interface PermissionGateProps {
    children: ReactNode;
    /** Permission required to show the content */
    permission?: Permission;
    /** Agency permissions to check (any match will show content) */
    agencyPermissions?: Permission[];
    /** Client permissions to check (any match will show content) */
    clientPermissions?: Permission[];
    /** Minimum agency role required */
    agencyRole?: AgencyRole;
    /** Minimum client role required */
    clientRole?: ClientRole;
    /** If true, require ALL specified permissions instead of ANY */
    requireAll?: boolean;
    /** Content to show if permission check fails (optional) */
    fallback?: ReactNode;
}

/**
 * PermissionGate - Conditionally render UI elements based on permissions
 *
 * Use this for inline permission checking in components (buttons, links, etc.)
 *
 * @example
 * // Show button only if user can manage clients
 * <PermissionGate permission="manage_clients">
 *   <Button>Add Client</Button>
 * </PermissionGate>
 *
 * @example
 * // Show with fallback
 * <PermissionGate permission="manage_billing" fallback={<span>Upgrade required</span>}>
 *   <BillingSettings />
 * </PermissionGate>
 *
 * @example
 * // Multiple permissions (any match)
 * <PermissionGate agencyPermissions={['manage_clients', 'manage_agency']}>
 *   <AdminPanel />
 * </PermissionGate>
 */
export function PermissionGate({
    children,
    permission,
    agencyPermissions,
    clientPermissions,
    agencyRole,
    clientRole,
    requireAll = false,
    fallback = null,
}: PermissionGateProps): ReactNode {
    const {
        hasPermission,
        hasAgencyPermission,
        hasClientPermission,
        meetsAgencyRole,
        meetsClientRole,
    } = useRole();

    // Check single permission
    if (permission) {
        if (!hasPermission(permission)) {
            return fallback;
        }
    }

    // Check agency permissions
    if (agencyPermissions && agencyPermissions.length > 0) {
        const results = agencyPermissions.map(hasAgencyPermission);
        const hasAccess = requireAll ? results.every(Boolean) : results.some(Boolean);
        if (!hasAccess) {
            return fallback;
        }
    }

    // Check client permissions
    if (clientPermissions && clientPermissions.length > 0) {
        const results = clientPermissions.map(hasClientPermission);
        const hasAccess = requireAll ? results.every(Boolean) : results.some(Boolean);
        if (!hasAccess) {
            return fallback;
        }
    }

    // Check agency role
    if (agencyRole) {
        if (!meetsAgencyRole(agencyRole)) {
            return fallback;
        }
    }

    // Check client role
    if (clientRole) {
        if (!meetsClientRole(clientRole)) {
            return fallback;
        }
    }

    return children;
}

export default PermissionGate;

'use client';

import { type ReactNode } from 'react';
import { useRole } from '@/src/hooks/auth/useRole';
import type { AgencyRole, ClientRole, Permission } from '@/src/config/permissions';

interface RoleGuardProps {
    children: ReactNode;
    /** Required minimum role for agency context */
    requiredAgencyRole?: AgencyRole;
    /** Required minimum role for client context */
    requiredClientRole?: ClientRole;
    /** Alternative: check for specific permission */
    requiredPermission?: Permission;
    /** Component to render if user doesn't have access */
    fallback?: ReactNode;
    /** If true, show loading state while roles are being fetched */
    showLoading?: boolean;
    /** Custom loading component */
    loadingComponent?: ReactNode;
}

/**
 * RoleGuard - Protects content based on user roles or permissions
 *
 * Use this component to wrap routes or sections that require specific roles.
 *
 * @example
 * // Require admin agency role
 * <RoleGuard requiredAgencyRole="admin" fallback={<AccessDenied />}>
 *   <AdminSettings />
 * </RoleGuard>
 *
 * @example
 * // Require manage_clients permission
 * <RoleGuard requiredPermission="manage_clients">
 *   <ClientManagement />
 * </RoleGuard>
 */
export function RoleGuard({
    children,
    requiredAgencyRole,
    requiredClientRole,
    requiredPermission,
    fallback = null,
    showLoading = true,
    loadingComponent,
}: RoleGuardProps): ReactNode {
    const { meetsAgencyRole, meetsClientRole, hasPermission, isLoading } = useRole();

    // Show loading state while fetching roles
    if (isLoading && showLoading) {
        return loadingComponent ?? (
            <div className="role-guard-loading">
                <div className="spinner" />
            </div>
        );
    }

    // Check permission first if specified
    if (requiredPermission) {
        if (!hasPermission(requiredPermission)) {
            return fallback;
        }
    }

    // Check agency role if specified
    if (requiredAgencyRole) {
        if (!meetsAgencyRole(requiredAgencyRole)) {
            return fallback;
        }
    }

    // Check client role if specified
    if (requiredClientRole) {
        if (!meetsClientRole(requiredClientRole)) {
            return fallback;
        }
    }

    return children;
}

export default RoleGuard;

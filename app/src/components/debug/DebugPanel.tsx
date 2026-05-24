'use client';

import { useState, useMemo } from 'react';
import { useRole } from '@/src/hooks/auth/useRole';
import { useAppDispatch } from '@/src/store/hooks';
import { setAgencyRoleOverride, setClientRoleOverride } from '@/src/store/slices/roleSlice';
import {
    AgencyRolePermissions,
    ClientRolePermissions,
    AGENCY_ROLE_HIERARCHY,
    CLIENT_ROLE_HIERARCHY,
    getAgencyRoleDisplayName,
    getClientRoleDisplayName,
    type AgencyRole,
    type ClientRole,
    type Permission,
} from '@/src/config/permissions';
import { Badge } from '@/src/components/shared/ui';
import '@/src/styles/components/_debug-panel.scss';

interface DebugPanelProps {
    /** Position of the panel */
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

/**
 * DebugPanel - Development-only panel for viewing and testing roles/permissions
 *
 * This panel is only rendered in development mode (NODE_ENV !== 'production')
 */
export function DebugPanel({ position = 'bottom-right' }: DebugPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState<'roles' | 'permissions'>('roles');
    const dispatch = useAppDispatch();

    const {
        agencyRole,
        clientRole,
        isAgencyMember,
        isLoading,
        hasPermission,
        canManageAgency,
        canManageClients,
        canAssignDevelopers,
        canManageMembers,
        canManageProjects,
    } = useRole();

    // Get all permissions for current roles
    const currentPermissions = useMemo(() => {
        const permissions = new Set<Permission>();

        if (agencyRole && AgencyRolePermissions[agencyRole]) {
            AgencyRolePermissions[agencyRole].forEach((p) => permissions.add(p));
        }

        if (clientRole && ClientRolePermissions[clientRole]) {
            ClientRolePermissions[clientRole].forEach((p) => permissions.add(p));
        }

        return Array.from(permissions).sort();
    }, [agencyRole, clientRole]);

    // All possible permissions for display
    const allPermissions: Permission[] = [
        'view_projects',
        'manage_project',
        'view_tasks',
        'manage_tasks',
        'comment_tasks',
        'upload_files',
        'manage_billing',
        'manage_members',
        'manage_agency',
        'manage_clients',
        'assign_developers',
    ];

    // Only render in development
    if (process.env.NODE_ENV === 'production') {
        return null;
    }

    const positionClasses = {
        'bottom-right': 'debug-panel--bottom-right',
        'bottom-left': 'debug-panel--bottom-left',
        'top-right': 'debug-panel--top-right',
        'top-left': 'debug-panel--top-left',
    };

    // Override role in Redux (for testing only)
    const handleOverrideAgencyRole = (role: AgencyRole | null) => {
        dispatch(setAgencyRoleOverride(role));
    };

    return (
        <div className={`debug-panel ${positionClasses[position]} ${isExpanded ? 'is-expanded' : ''}`}>
            <button
                className="debug-panel__toggle"
                onClick={() => setIsExpanded(!isExpanded)}
                title="Toggle Debug Panel"
            >
                🔧
            </button>

            {isExpanded && (
                <div className="debug-panel__content">
                    <div className="debug-panel__header">
                        <h3>Role Debug Panel</h3>
                        <Badge size="xs" variant="warning" className="debug-panel__badge">DEV</Badge>
                    </div>

                    <div className="debug-panel__tabs">
                        <button
                            className={`debug-panel__tab ${activeTab === 'roles' ? 'is-active' : ''}`}
                            onClick={() => setActiveTab('roles')}
                        >
                            Roles
                        </button>
                        <button
                            className={`debug-panel__tab ${activeTab === 'permissions' ? 'is-active' : ''}`}
                            onClick={() => setActiveTab('permissions')}
                        >
                            Permissions
                        </button>
                    </div>

                    {activeTab === 'roles' && (
                        <div className="debug-panel__section">
                            <div className="debug-panel__row">
                                <span className="debug-panel__label">Loading:</span>
                                <span className={`debug-panel__value ${isLoading ? 'is-loading' : ''}`}>
                                    {isLoading ? 'Yes' : 'No'}
                                </span>
                            </div>

                            <div className="debug-panel__row">
                                <span className="debug-panel__label">Agency Member:</span>
                                <span className={`debug-panel__value ${isAgencyMember ? 'is-true' : 'is-false'}`}>
                                    {isAgencyMember ? 'Yes' : 'No'}
                                </span>
                            </div>

                            <div className="debug-panel__row">
                                <span className="debug-panel__label">Agency Role:</span>
                                <span className="debug-panel__value debug-panel__value--role">
                                    {agencyRole ? getAgencyRoleDisplayName(agencyRole) : '—'}
                                </span>
                            </div>

                            <div className="debug-panel__row">
                                <span className="debug-panel__label">Client Role:</span>
                                <span className="debug-panel__value debug-panel__value--role">
                                    {clientRole ? getClientRoleDisplayName(clientRole) : '—'}
                                </span>
                            </div>

                            <div className="debug-panel__divider" />

                            <div className="debug-panel__subtitle">Override Agency Role</div>
                            <div className="debug-panel__role-buttons">
                                {AGENCY_ROLE_HIERARCHY.map((role) => (
                                    <button
                                        key={role}
                                        className={`debug-panel__role-btn ${agencyRole === role ? 'is-active' : ''}`}
                                        onClick={() => handleOverrideAgencyRole(role)}
                                    >
                                        {getAgencyRoleDisplayName(role)}
                                    </button>
                                ))}
                                <button
                                    className={`debug-panel__role-btn debug-panel__role-btn--clear ${!agencyRole ? 'is-active' : ''}`}
                                    onClick={() => handleOverrideAgencyRole(null)}
                                >
                                    None
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'permissions' && (
                        <div className="debug-panel__section">
                            <div className="debug-panel__subtitle">Quick Checks</div>
                            <div className="debug-panel__permissions-quick">
                                <div className={`debug-panel__perm-item ${canManageAgency ? 'is-granted' : ''}`}>
                                    Manage Agency
                                </div>
                                <div className={`debug-panel__perm-item ${canManageClients ? 'is-granted' : ''}`}>
                                    Manage Clients
                                </div>
                                <div className={`debug-panel__perm-item ${canAssignDevelopers ? 'is-granted' : ''}`}>
                                    Assign Devs
                                </div>
                                <div className={`debug-panel__perm-item ${canManageMembers ? 'is-granted' : ''}`}>
                                    Manage Members
                                </div>
                                <div className={`debug-panel__perm-item ${canManageProjects ? 'is-granted' : ''}`}>
                                    Manage Projects
                                </div>
                            </div>

                            <div className="debug-panel__divider" />

                            <div className="debug-panel__subtitle">All Permissions</div>
                            <div className="debug-panel__permissions-list">
                                {allPermissions.map((perm) => (
                                    <div
                                        key={perm}
                                        className={`debug-panel__perm-row ${hasPermission(perm) ? 'is-granted' : ''}`}
                                    >
                                        <span className="debug-panel__perm-indicator">
                                            {hasPermission(perm) ? '✓' : '✗'}
                                        </span>
                                        <span className="debug-panel__perm-name">{perm}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default DebugPanel;

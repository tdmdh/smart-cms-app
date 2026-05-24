export type AgencyRole = 'owner' | 'admin' | 'developer' | 'viewer';
export type ClientRole = 'admin' | 'member' | 'viewer';
export type Permission =
    | 'view_projects'
    | 'manage_project'
    | 'view_tasks'
    | 'manage_tasks'
    | 'comment_tasks'
    | 'upload_files'
    | 'manage_billing'
    | 'manage_members'
    | 'manage_agency'
    | 'manage_clients'
    | 'assign_developers';
export const AgencyRolePermissions: Record<AgencyRole, Permission[]> = {
    owner: [
        'manage_agency', 'manage_clients', 'assign_developers',
        'view_projects', 'manage_project', 'view_tasks', 'manage_tasks',
        'comment_tasks', 'upload_files', 'manage_billing', 'manage_members',
    ],
    admin: [
        'manage_clients', 'assign_developers',
        'view_projects', 'manage_project', 'view_tasks', 'manage_tasks',
        'comment_tasks', 'upload_files', 'manage_members',
    ],
    developer: [
        'view_projects', 'manage_project', 'view_tasks', 'manage_tasks',
        'comment_tasks', 'upload_files',
    ],
    viewer: [
        'view_projects', 'view_tasks',
    ],
};

export const ClientRolePermissions: Record<ClientRole, Permission[]> = {
    admin: [
        'view_projects', 'manage_project',
        'view_tasks', 'manage_tasks', 'comment_tasks',
        'upload_files', 'manage_billing', 'manage_members',
    ],
    member: [
        'view_projects', 'view_tasks', 'manage_tasks',
        'comment_tasks', 'upload_files',
    ],
    viewer: [
        'view_projects', 'view_tasks',
    ],
};

export const AGENCY_ROLE_HIERARCHY: AgencyRole[] = ['viewer', 'developer', 'admin', 'owner'];
export const CLIENT_ROLE_HIERARCHY: ClientRole[] = ['viewer', 'member', 'admin'];
export function hasAgencyPermission(role: AgencyRole | null, permission: Permission): boolean {
    if (!role) return false;
    return AgencyRolePermissions[role]?.includes(permission) ?? false;
}

export function hasClientPermission(role: ClientRole | null, permission: Permission): boolean {
    if (!role) return false;
    return ClientRolePermissions[role]?.includes(permission) ?? false;
}
export function meetsMinimumAgencyRole(role: AgencyRole | null, requiredRole: AgencyRole): boolean {
    if (!role) return false;
    const roleIndex = AGENCY_ROLE_HIERARCHY.indexOf(role);
    const requiredIndex = AGENCY_ROLE_HIERARCHY.indexOf(requiredRole);
    return roleIndex >= requiredIndex;
}

export function meetsMinimumClientRole(role: ClientRole | null, requiredRole: ClientRole): boolean {
    if (!role) return false;
    const roleIndex = CLIENT_ROLE_HIERARCHY.indexOf(role);
    const requiredIndex = CLIENT_ROLE_HIERARCHY.indexOf(requiredRole);
    return roleIndex >= requiredIndex;
}

export function getAgencyRoleDisplayName(role: AgencyRole): string {
    const names: Record<AgencyRole, string> = {
        owner: 'Owner',
        admin: 'Admin',
        developer: 'Developer',
        viewer: 'Viewer',
    };
    return names[role];
}

export function getClientRoleDisplayName(role: ClientRole): string {
    const names: Record<ClientRole, string> = {
        admin: 'Admin',
        member: 'Member',
        viewer: 'Viewer',
    };
    return names[role];
}

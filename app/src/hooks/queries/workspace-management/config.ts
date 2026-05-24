import { getBackendApiUrl } from '@/src/api/config';

export interface Workspace {
    id: string;
    name: string;
    slug: string;
    description?: string;
    created_by?: string;
    created_at?: string;
    updated_at?: string;
}

export interface WorkspaceMember {
    id: number;
    workspace_id: string;
    user_id: string;
    role: 'owner' | 'admin' | 'member' | 'viewer';
    username?: string;
    name?: string;
    email?: string;
    joined_at?: string;
}

export interface PaginationResponse {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
}

export interface ListWorkspacesResponse {
    workspaces: Workspace[];
    pagination?: PaginationResponse;
}

export interface WorkspaceResponse {
    workspace: Workspace;
}

export interface MembersResponse {
    members: WorkspaceMember[];
}

export interface WorkspaceRoleResponse {
    role: WorkspaceMember['role'];
}

export interface MessageResponse {
    message: string;
}

export interface WorkspaceInvitation {
    id: string;
    workspace_id: string;
    workspace_name?: string;
    email: string;
    role: 'admin' | 'member' | 'viewer';
    status: 'pending' | 'accepted' | 'revoked' | 'expired';
    expires_at: string;
    created_by?: string;
    created_at: string;
    token?: string;
}

export interface InvitationsResponse {
    invitations: WorkspaceInvitation[];
    total: number;
}

export interface InvitationResponse {
    invitation: WorkspaceInvitation;
}

class BaseAPI {
    protected async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
        const url = `${getBackendApiUrl()}${endpoint}`;

        const res = await fetch(url, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            ...options,
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || error.message || `Request failed: ${res.status}`);
        }

        const text = await res.text();
        return text ? JSON.parse(text) : (undefined as unknown as T);
    }

    protected fetchGet<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    protected fetchPost<T, B>(endpoint: string, body: B): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    protected fetchPut<T, B>(endpoint: string, body: B): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body),
        });
    }

    protected fetchDelete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }
}

class WorkspaceAPI extends BaseAPI {
    list(page = 1, pageSize = 20): Promise<ListWorkspacesResponse> {
        return this.fetchGet(`/workspaces?page=${page}&page_size=${pageSize}`);
    }

    get(workspaceId: string): Promise<WorkspaceResponse> {
        return this.fetchGet(`/workspaces/${workspaceId}`);
    }

    create(data: { name: string; description?: string }): Promise<WorkspaceResponse> {
        return this.fetchPost('/workspaces', data);
    }

    update(workspaceId: string, data: { name?: string; description?: string }): Promise<WorkspaceResponse> {
        return this.fetchPut(`/workspaces/${workspaceId}`, data);
    }

    delete(workspaceId: string): Promise<MessageResponse> {
        return this.fetchDelete(`/workspaces/${workspaceId}`);
    }

    members(workspaceId: string): Promise<MembersResponse> {
        return this.fetchGet(`/workspaces/${workspaceId}/members`);
    }

    addMember(workspaceId: string, data: { user_id: string; role: string }): Promise<{ member: WorkspaceMember }> {
        return this.fetchPost(`/workspaces/${workspaceId}/members`, data);
    }

    updateMemberRole(workspaceId: string, userId: string, data: { role: string }): Promise<{ member: WorkspaceMember }> {
        return this.fetchPut(`/workspaces/${workspaceId}/members/${userId}`, data);
    }

    removeMember(workspaceId: string, userId: string): Promise<MessageResponse> {
        return this.fetchDelete(`/workspaces/${workspaceId}/members/${userId}`);
    }

    role(workspaceId: string): Promise<WorkspaceRoleResponse> {
        return this.fetchGet(`/workspaces/${workspaceId}/role`);
    }

    inviteWorkspaceMember(workspaceId: string, data: { email: string; role: string }): Promise<InvitationResponse> {
        return this.fetchPost(`/workspaces/${workspaceId}/invitations`, data);
    }

    listSentInvitations(workspaceId: string, limit = 50, offset = 0): Promise<InvitationsResponse> {
        return this.fetchGet(`/workspaces/${workspaceId}/invitations?limit=${limit}&offset=${offset}`);
    }

    listReceivedInvitations(): Promise<InvitationsResponse> {
        return this.fetchGet('/workspace-invitations/received');
    }

    acceptInvitation(token: string): Promise<{ member: WorkspaceMember }> {
        return this.fetchPost('/workspace-invitations/accept', { token });
    }

    revokeInvitation(invitationId: string): Promise<MessageResponse> {
        return this.fetchDelete(`/workspace-invitations/${invitationId}`);
    }

    resendInvitation(invitationId: string): Promise<InvitationResponse> {
        return this.fetchPost(`/workspace-invitations/${invitationId}/resend`, {});
    }
}

export const api = new WorkspaceAPI();

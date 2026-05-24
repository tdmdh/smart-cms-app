import { getBackendApiUrl } from '@/src/api/config';
import type {
    ClientResponse,
    CreateClientRequest,
    UpdateClientRequest,
    ListClientsResponse,
    AgencyMemberResponse,
    AddAgencyMemberRequest,
    UpdateAgencyMemberRoleRequest,
    ClientMemberResponse,
    AddClientMemberRequest,
    UpdateClientMemberRoleRequest,
    ClientInvitationResponse,
    InviteClientMemberRequest,
    AcceptInvitationRequest,
    AssignDeveloperRequest,
    UnassignDeveloperRequest,
} from '@/src/api/client/config';

export interface ClientOnboardingInvitationResponse {
    id: string;
    email: string;
    status: 'pending' | 'accepted' | 'expired';
    expires_at: string;
    accepted_at?: string;
    created_at: string;
}

export interface InviteClientOnboardingRequest {
    email: string;
}

export interface ValidateClientOnboardingTokenResponse {
    valid: boolean;
    email: string;
    expires_at: string;
}

export interface RegisterClientRequest {
    token: string;
    name: string;
    last_name: string;
    username: string;
    password: string;
    company_name: string;
    company_phone?: string;
    company_address?: string;
}

class BaseAPI {
    private getCurrentWorkspaceId(): string | null {
        if (typeof window === 'undefined') {
            return null;
        }

        // 1. Try to get workspace ID from the URL directly (source of truth for routes)
        const pathParts = window.location.pathname.split('/');
        const dashboardIdx = pathParts.indexOf('dashboard');
        if (dashboardIdx !== -1 && pathParts[dashboardIdx + 1]) {
            const idFromUrl = pathParts[dashboardIdx + 1];
            if (idFromUrl && idFromUrl !== 'pages' && idFromUrl !== 'settings') {
                return idFromUrl;
            }
        }

        // 2. Fallback to localStorage
        try {
            const persistedRoot = window.localStorage.getItem('persist:root');
            if (persistedRoot) {
                const root = JSON.parse(persistedRoot) as Record<string, string>;
                if (root.workspace) {
                    const workspaceState = JSON.parse(root.workspace) as { currentWorkspaceId?: string | null };
                    return workspaceState.currentWorkspaceId ?? null;
                }
            }
        } catch {}
        return null;
    }

    protected getWorkspaceId(): string | null {
        return this.getCurrentWorkspaceId();
    }

    protected scopedClientsBasePath(): string {
        const workspaceID = this.getWorkspaceId();
        if (workspaceID) {
            return `/workspaces/${workspaceID}/clients`;
        }
        return '/clients';
    }

    protected async request<T>(
        endpoint: string,
        options?: RequestInit
    ): Promise<T> {
        const url = `${getBackendApiUrl()}${endpoint}`;

        const workspaceID = this.getWorkspaceId();
        const existingHeaders = options?.headers instanceof Headers
            ? Object.fromEntries(options.headers.entries())
            : (options?.headers as Record<string, string> | undefined);
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(existingHeaders ?? {}),
        };
        if (workspaceID) {
            headers['X-Workspace-ID'] = workspaceID;
        }

        const res = await fetch(url, {
            credentials: 'include',
            headers,
            ...options,
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || `Request failed: ${res.status}`);
        }

        const text = await res.text();
        return text ? JSON.parse(text) : (undefined as unknown as T);
    }

    protected fetchGet<T>(url: string): Promise<T> {
        return this.request<T>(url, { method: 'GET' });
    }

    protected fetchPost<T, B>(url: string, body: B): Promise<T> {
        return this.request<T>(url, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    protected fetchPut<T, B>(url: string, body: B): Promise<T> {
        return this.request<T>(url, {
            method: 'PUT',
            body: JSON.stringify(body),
        });
    }

    protected fetchDelete<T>(url: string, body?: unknown): Promise<T> {
        return this.request<T>(url, {
            method: 'DELETE',
            body: body ? JSON.stringify(body) : undefined,
        });
    }
}

class ClientsAPI extends BaseAPI {
    list(limit = 20, offset = 0): Promise<ListClientsResponse> {
        return this.fetchGet(`${this.scopedClientsBasePath()}?limit=${limit}&offset=${offset}`);
    }

    get(id: string): Promise<ClientResponse> {
        return this.fetchGet(`${this.scopedClientsBasePath()}/${id}`);
    }

    create(data: CreateClientRequest): Promise<ClientResponse> {
        return this.fetchPost(this.scopedClientsBasePath(), data);
    }

    update(id: string, data: UpdateClientRequest): Promise<ClientResponse> {
        return this.fetchPut(`${this.scopedClientsBasePath()}/${id}`, data);
    }

    delete(id: string): Promise<void> {
        return this.fetchDelete(`${this.scopedClientsBasePath()}/${id}`);
    }
}

class ClientMembersAPI extends BaseAPI {
    list(clientId: string): Promise<{ members: ClientMemberResponse[] }> {
        return this.fetchGet(`${this.scopedClientsBasePath()}/${clientId}/members`);
    }

    add(clientId: string, data: AddClientMemberRequest): Promise<ClientMemberResponse> {
        return this.fetchPost(`${this.scopedClientsBasePath()}/${clientId}/members`, data);
    }

    updateRole(clientId: string, userId: string, data: UpdateClientMemberRoleRequest): Promise<void> {
        return this.fetchPut(`${this.scopedClientsBasePath()}/${clientId}/members/${userId}`, data);
    }

    remove(clientId: string, userId: string): Promise<void> {
        return this.fetchDelete(`${this.scopedClientsBasePath()}/${clientId}/members/${userId}`);
    }
}

class AgencyMembersAPI extends BaseAPI {
    list(): Promise<{ members: AgencyMemberResponse[] }> {
        return this.fetchGet('/agency/members');
    }

    get(userId: string): Promise<AgencyMemberResponse> {
        return this.fetchGet(`/agency/members/${userId}`);
    }

    add(data: AddAgencyMemberRequest): Promise<AgencyMemberResponse> {
        return this.fetchPost('/agency/members', data);

    }

    updateRole(userId: string, data: UpdateAgencyMemberRoleRequest): Promise<void> {
        return this.fetchPut(`/agency/members/${userId}`, data);
    }

    remove(userId: string): Promise<void> {
        return this.fetchDelete(`/agency/members/${userId}`);
    }
}

class InvitationsAPI extends BaseAPI {
    create(clientId: string, data: InviteClientMemberRequest): Promise<ClientInvitationResponse> {
        return this.fetchPost(`${this.scopedClientsBasePath()}/${clientId}/invitations`, data);
    }

    accept(data: AcceptInvitationRequest): Promise<ClientMemberResponse> {
        return this.fetchPost('/invitations/accept', data);
    }
}

class AssignmentsAPI extends BaseAPI {
    assign(data: AssignDeveloperRequest): Promise<void> {
        return this.fetchPost('/agency/assignments', data);
    }

    unassign(data: UnassignDeveloperRequest): Promise<void> {
        return this.fetchDelete('/agency/assignments', data);
    }

    getDeveloperClients(userId: string): Promise<{ clients: ClientResponse[] }> {
        return this.fetchGet(`/agency/developers/${userId}/clients`);
    }
}

class ClientOnboardingAPI extends BaseAPI {
    invite(data: InviteClientOnboardingRequest): Promise<ClientOnboardingInvitationResponse> {
        return this.fetchPost(`${this.scopedClientsBasePath()}/onboarding/invite`, data);
    }

    listInvitations(): Promise<{ invitations: ClientOnboardingInvitationResponse[] }> {
        return this.fetchGet(`${this.scopedClientsBasePath()}/onboarding/invitations`);
    }

    validateToken(token: string): Promise<ValidateClientOnboardingTokenResponse> {
        const url = `${getBackendApiUrl()}/client-onboarding/validate?token=${encodeURIComponent(token)}`;
        return fetch(url).then((res) => res.json());
    }

    registerClient(data: RegisterClientRequest): Promise<{ user: { id: string; email: string } }> {
        const url = `${getBackendApiUrl()}/auth/register/client`;
        return fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }).then((res) => {
            if (!res.ok) throw new Error('Registration failed');
            return res.json();
        });
    }
}

class ClientManagementAPI {
    readonly clients = new ClientsAPI();
    readonly clientMembers = new ClientMembersAPI();
    readonly agencyMembers = new AgencyMembersAPI();
    readonly invitations = new InvitationsAPI();
    readonly assignments = new AssignmentsAPI();
    readonly onboarding = new ClientOnboardingAPI();
}

export const api = new ClientManagementAPI();

export type {
    ClientResponse,
    CreateClientRequest,
    UpdateClientRequest,
    ListClientsResponse,
    AgencyMemberResponse,
    AddAgencyMemberRequest,
    UpdateAgencyMemberRoleRequest,
    ClientMemberResponse,
    AddClientMemberRequest,
    UpdateClientMemberRoleRequest,
    ClientInvitationResponse,
    InviteClientMemberRequest,
    AcceptInvitationRequest,
    AssignDeveloperRequest,
    UnassignDeveloperRequest,
};

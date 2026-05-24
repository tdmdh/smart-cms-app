import { Endpoint } from "../config";

// ============================================================================
// Types — manually defined since OpenAPI spec uses map[string]interface{}
// These match the proto ProviderItem and ConnectionItem messages
// ============================================================================

export interface IntegrationProvider {
    id: string;
    slug: string;
    name: string;
    type: string; // "cloud" | "devops" | "productivity"
    default_scopes: string[];
    icon_url: string;
    is_active: boolean;
}

export interface IntegrationConnection {
    id: string;
    provider_slug: string;
    provider_name: string;
    provider_icon_url: string;
    external_account_id: string;
    external_account_name: string;
    external_account_email: string;
    status: string; // "active" | "expired" | "revoked" | "error"
    scopes: string[];
    connected_at: string;
    last_used_at: string;
    is_organization: boolean;
}

export interface BeginConnectRequest {
    scopes?: string[];
    organization_id?: string;
    redirect_uri?: string;
}

export interface BeginConnectResponse {
    auth_url: string;
    state: string;
}

export interface ListProvidersResponse {
    providers: IntegrationProvider[];
}

export interface ListConnectionsResponse {
    connections: IntegrationConnection[];
}

export interface CallbackResponse {
    success: boolean;
    connection: IntegrationConnection;
}

export interface GitHubRepo {
    id: number;
    name: string;
    full_name: string;
    description: string;
    private: boolean;
    html_url: string;
    default_branch: string;
}

export interface GitHubBranch {
    name: string;
    sha: string;
}

export interface ListGitHubReposResponse {
    repos: GitHubRepo[];
}

export interface ListGitHubBranchesResponse {
    branches: GitHubBranch[];
}

export interface GitHubTreeEntry {
    name: string;
    path: string;
    type: string;
}

export interface ListGitHubTreeResponse {
    entries: GitHubTreeEntry[];
}

export interface GCPProject {
    project_id: string;
    name: string;
    project_number: string;
    state: string;
}

export interface ListGCPProjectsResponse {
    projects: GCPProject[];
}

export interface CloudRunService {
    name: string;
    uri: string;
    create_time: string;
    update_time: string;
}

export interface ListCloudRunServicesResponse {
    services: CloudRunService[];
}

// ============================================================================
// Endpoint configs — used by the ApiClient (server-side proxy)
// ============================================================================

export const integrations = {
    providers: (): Endpoint<void, ListProvidersResponse> => ({
        method: "GET",
        endpoint: "/integrations/providers",
        requiredAuth: true,
    }),

    connections: (
        organizationId?: string
    ): Endpoint<void, ListConnectionsResponse> => ({
        method: "GET",
        endpoint: organizationId
            ? `/integrations/connections?organization_id=${organizationId}`
            : "/integrations/connections",
        requiredAuth: true,
    }),

    connect: (
        provider: string
    ): Endpoint<BeginConnectRequest, BeginConnectResponse> => ({
        method: "POST",
        endpoint: `/integrations/connect/${provider}`,
        requiredAuth: true,
    }),

    callback: (
        provider: string
    ): Endpoint<void, CallbackResponse> => ({
        method: "GET",
        endpoint: `/integrations/callback/${provider}`,
        requiredAuth: true,
    }),

    disconnect: (
        connectionId: string
    ): Endpoint<void, { success: boolean }> => ({
        method: "DELETE",
        endpoint: `/integrations/${connectionId}`,
        requiredAuth: true,
    }),

    githubRepos: (): Endpoint<void, ListGitHubReposResponse> => ({
        method: "GET",
        endpoint: "/integrations/github/repos",
        requiredAuth: true,
    }),

    githubBranches: (
        owner: string,
        repo: string
    ): Endpoint<void, ListGitHubBranchesResponse> => ({
        method: "GET",
        endpoint: `/integrations/github/repos/${owner}/${repo}/branches`,
        requiredAuth: true,
    }),

    githubTree: (
        owner: string,
        repo: string,
        ref?: string,
        path?: string
    ): Endpoint<void, ListGitHubTreeResponse> => {
        const params = new URLSearchParams();
        if (ref) params.set("ref", ref);
        if (path) params.set("path", path);
        const query = params.toString();

        return {
            method: "GET",
            endpoint: `/integrations/github/repos/${owner}/${repo}/tree${query ? `?${query}` : ""}`,
            requiredAuth: true,
        };
    },

    gcpProjects: (): Endpoint<void, ListGCPProjectsResponse> => ({
        method: "GET",
        endpoint: "/integrations/gcp/projects",
        requiredAuth: true,
    }),
};


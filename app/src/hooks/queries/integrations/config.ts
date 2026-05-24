import type {
    IntegrationProvider,
    IntegrationConnection,
    BeginConnectRequest,
    BeginConnectResponse,
    ListProvidersResponse,
    ListConnectionsResponse,
    CallbackResponse,
    GitHubRepo,
    GitHubBranch,
    GitHubTreeEntry,
    ListGitHubReposResponse,
    ListGitHubBranchesResponse,
    ListGitHubTreeResponse,
    GCPProject,
    ListGCPProjectsResponse,
    ListCloudRunServicesResponse,
} from "@/src/api/integration/config";

// ============================================================================
// BaseAPI — mirrors the client-management pattern
// ============================================================================

class BaseAPI {
    protected async request<T>(
        url: string,
        options?: RequestInit
    ): Promise<T> {
        const res = await fetch(url, {
            credentials: "include",
            headers: { "Content-Type": "application/json" },
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
        return this.request<T>(url, { method: "GET" });
    }

    protected fetchPost<T, B>(url: string, body: B): Promise<T> {
        return this.request<T>(url, {
            method: "POST",
            body: JSON.stringify(body),
        });
    }

    protected fetchDelete<T>(url: string): Promise<T> {
        return this.request<T>(url, { method: "DELETE" });
    }
}

// ============================================================================
// IntegrationsAPI — wraps Next.js API route calls
// ============================================================================

class IntegrationsAPI extends BaseAPI {
    listProviders(): Promise<ListProvidersResponse> {
        return this.fetchGet("/api/integrations/providers");
    }

    listConnections(organizationId?: string): Promise<ListConnectionsResponse> {
        const params = organizationId
            ? `?organization_id=${organizationId}`
            : "";
        return this.fetchGet(`/api/integrations/connections${params}`);
    }

    beginConnect(
        provider: string,
        data: BeginConnectRequest
    ): Promise<BeginConnectResponse> {
        return this.fetchPost(`/api/integrations/connect/${provider}`, data);
    }

    handleCallback(
        provider: string,
        state: string,
        code: string
    ): Promise<CallbackResponse> {
        return this.fetchGet(
            `/api/integrations/callback/${provider}?state=${encodeURIComponent(state)}&code=${encodeURIComponent(code)}`
        );
    }

    disconnect(connectionId: string): Promise<{ success: boolean }> {
        return this.fetchDelete(
            `/api/integrations/disconnect/${connectionId}`
        );
    }

    listGitHubRepos(): Promise<ListGitHubReposResponse> {
        return this.fetchGet("/api/integrations/github/repos");
    }

    listGitHubBranches(owner: string, repo: string): Promise<ListGitHubBranchesResponse> {
        return this.fetchGet(`/api/integrations/github/repos/${owner}/${repo}/branches`);
    }

    listGitHubTree(owner: string, repo: string, ref?: string, path?: string): Promise<ListGitHubTreeResponse> {
        const params = new URLSearchParams();
        if (ref) params.set("ref", ref);
        if (path) params.set("path", path);
        const query = params.toString();
        return this.fetchGet(`/api/integrations/github/repos/${owner}/${repo}/tree${query ? `?${query}` : ""}`);
    }

    listGCPProjects(): Promise<ListGCPProjectsResponse> {
        return this.fetchGet("/api/integrations/gcp/projects");
    }

    listCloudRunServices(projectId: string, region: string): Promise<ListCloudRunServicesResponse> {
        return this.fetchGet(`/api/integrations/gcp/services?project_id=${projectId}&region=${region}`);
    }
}

export const integrationsApi = new IntegrationsAPI();

export type {
    IntegrationProvider,
    IntegrationConnection,
    BeginConnectRequest,
    BeginConnectResponse,
    ListProvidersResponse,
    ListConnectionsResponse,
    CallbackResponse,
    GitHubRepo,
    GitHubBranch,
    GitHubTreeEntry,
    ListGitHubReposResponse,
    ListGitHubBranchesResponse,
    ListGitHubTreeResponse,
    GCPProject,
    ListGCPProjectsResponse,
    ListCloudRunServicesResponse,
};

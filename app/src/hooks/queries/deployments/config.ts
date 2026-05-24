
import { getBackendApiUrl } from '@/src/api/config';
import { getActiveWorkspaceId } from '@/src/api/workspace-utils';
import type {
    ListTargetsResponse,
    ConfigResponse,
    ListConfigsResponse,
    EnvVarResponse,
    ListEnvVarsResponse,
    DeploymentResponse,
    ListDeploymentsResponse,
    DeploymentLogsResponse,
    DeleteResponse,
    CreateDeploymentConfigRequest,
    UpdateConfigRequest,
    SetEnvVarRequest,
    TriggerDeploymentRequest,
    ListVercelTeamsResponse,
    ListVercelProjectsResponse,
    VercelProjectResponse,
    CreateVercelProjectRequest,
    SelectVercelProjectRequest,
} from '@/src/api/deployments/config';

// --------------------------------------------------------------------------
// Base API Class - Direct Backend Calls
// --------------------------------------------------------------------------

class BaseAPI {
    protected async request<T>(
        endpoint: string,
        options?: RequestInit
    ): Promise<T> {
        const url = `${getBackendApiUrl()}${endpoint}`;

        const workspaceID = getActiveWorkspaceId();
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
            credentials: 'include', // Include HTTP-only cookies for auth
            headers,
            ...options,
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            if (res.status === 401 || res.status === 403) {
                throw new Error('You do not have access to this project or deployment.');
            }
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

// --------------------------------------------------------------------------
// Deployments API
// --------------------------------------------------------------------------

class DeploymentsAPI extends BaseAPI {
    // Targets
    listTargets(): Promise<ListTargetsResponse> {
        return this.fetchGet('/deployments/targets');
    }

    // Configs
    createConfig(data: CreateDeploymentConfigRequest): Promise<ConfigResponse> {
        return this.fetchPost('/deployments/config', data);
    }

    getConfig(configId: string): Promise<ConfigResponse> {
        return this.fetchGet(`/deployments/config/${configId}`);
    }

    listConfigs(projectId: string): Promise<ListConfigsResponse> {
        return this.fetchGet(`/projects/${projectId}/deployments/config`);
    }

    updateConfig(configId: string, data: UpdateConfigRequest): Promise<ConfigResponse> {
        return this.fetchPut(`/deployments/config/${configId}`, data);
    }

    deleteConfig(configId: string, deleteFromProvider: boolean = false): Promise<DeleteResponse> {
        const query = deleteFromProvider ? '?delete_from_provider=true' : '';
        return this.fetchDelete(`/deployments/config/${configId}${query}`);
    }

    // Env Vars
    listEnvVars(configId: string): Promise<ListEnvVarsResponse> {
        return this.fetchGet(`/deployments/config/${configId}/env`);
    }

    setEnvVar(configId: string, data: SetEnvVarRequest): Promise<EnvVarResponse> {
        return this.fetchPost(`/deployments/config/${configId}/env`, data);
    }

    deleteEnvVar(configId: string, envVarId: string): Promise<DeleteResponse> {
        return this.fetchDelete(`/deployments/config/${configId}/env/${envVarId}`);
    }

    // Deployments
    triggerDeployment(configId: string, data: TriggerDeploymentRequest): Promise<DeploymentResponse> {
        return this.fetchPost(`/deployments/config/${configId}/deploy`, data);
    }

    getDeployment(deploymentId: string): Promise<DeploymentResponse> {
        return this.fetchGet(`/deployments/${deploymentId}`);
    }

    listDeployments(projectId: string, params?: { page?: number; page_size?: number }): Promise<ListDeploymentsResponse> {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.append('page', params.page.toString());
        if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
        const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
        return this.fetchGet(`/projects/${projectId}/deployments${query}`);
    }

    getDeploymentLogs(deploymentId: string): Promise<DeploymentLogsResponse> {
        return this.fetchGet(`/deployments/${deploymentId}/logs`);
    }

    cancelDeployment(deploymentId: string): Promise<DeploymentResponse> {
        return this.fetchPost(`/deployments/${deploymentId}/cancel`, {});
    }

    rollbackDeployment(deploymentId: string): Promise<DeploymentResponse> {
        return this.fetchPost(`/deployments/${deploymentId}/rollback`, {});
    }

    listVercelProjects(configId: string, teamId?: string): Promise<ListVercelProjectsResponse> {
        const query = teamId ? `?team_id=${encodeURIComponent(teamId)}` : '';
        return this.fetchGet(`/deployments/config/${configId}/vercel/projects${query}`);
    }

    listVercelTeams(configId: string): Promise<ListVercelTeamsResponse> {
        return this.fetchGet(`/deployments/config/${configId}/vercel/teams`);
    }

    createVercelProject(configId: string, data: CreateVercelProjectRequest): Promise<VercelProjectResponse> {
        return this.fetchPost(`/deployments/config/${configId}/vercel/projects`, data);
    }

    selectVercelProject(configId: string, data: SelectVercelProjectRequest): Promise<DeleteResponse> {
        return this.fetchPost(`/deployments/config/${configId}/vercel/select`, data);
    }
}

export const api = new DeploymentsAPI();

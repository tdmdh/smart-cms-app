import { getBackendApiUrl } from '@/src/api/config';
import { getActiveWorkspaceId } from '@/src/api/workspace-utils';

export interface MemberCLData {
    user_id: string;
    username: string;
    total_cw: number;
    threshold: number;
    deep_work_protection: boolean;
}

export interface CognitiveLoadResponse {
    members: MemberCLData[];
}

export interface FluidScopeResponse {
    id?: string;
    user_id?: string;
    workspace_id?: string;
    body?: string;
    updated_at?: string;
}

export interface ThresholdResponse {
    threshold: number;
}

export interface EnqueueResponse {
    status: string;
    task_id?: string;
}

export interface TriageResponse {
    status: string;
}

class BaseAPI {
    protected async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
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
        const res = await fetch(url, { credentials: 'include', headers, ...options });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error((error as { error?: string; message?: string }).error || (error as { message?: string }).message || `Request failed: ${res.status}`);
        }
        const text = await res.text();
        return text ? (JSON.parse(text) as T) : (undefined as unknown as T);
    }
}

class CognitiveLoadAPI extends BaseAPI {
    getCognitiveLoad(workspaceId: string): Promise<CognitiveLoadResponse> {
        return this.request<CognitiveLoadResponse>(`/workspaces/${workspaceId}/cognitive-load`);
    }

    getFluidScope(workspaceId: string): Promise<FluidScopeResponse> {
        return this.request<FluidScopeResponse>(`/workspaces/${workspaceId}/fluid-scope`);
    }

    updateFluidScope(workspaceId: string, body: string): Promise<FluidScopeResponse> {
        return this.request<FluidScopeResponse>(`/workspaces/${workspaceId}/fluid-scope`, {
            method: 'PUT',
            body: JSON.stringify({ body }),
        });
    }

    getThreshold(workspaceId: string): Promise<ThresholdResponse> {
        return this.request<ThresholdResponse>(`/workspaces/${workspaceId}/cognitive-threshold`);
    }

    setThreshold(workspaceId: string, threshold: number): Promise<ThresholdResponse> {
        return this.request<ThresholdResponse>(`/workspaces/${workspaceId}/cognitive-threshold`, {
            method: 'PUT',
            body: JSON.stringify({ threshold }),
        });
    }

    enqueueILCalculation(taskId: string, workspaceId: string, title?: string, description?: string): Promise<EnqueueResponse> {
        return this.request<EnqueueResponse>(`/tasks/${taskId}/calculate-intrinsic-load`, {
            method: 'POST',
            body: JSON.stringify({ workspace_id: workspaceId, title: title ?? '', description: description ?? '' }),
        });
    }

    submitTriageRequest(workspaceId: string, requestText: string): Promise<TriageResponse> {
        return this.request<TriageResponse>(`/workspaces/${workspaceId}/triage-request`, {
            method: 'POST',
            body: JSON.stringify({ request_text: requestText }),
        });
    }
}

export const cognitiveLoadApi = new CognitiveLoadAPI();

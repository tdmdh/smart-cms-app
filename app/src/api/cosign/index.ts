import { getBackendApiUrl } from '@/src/api/config';
import { getActiveWorkspaceId } from '@/src/api/workspace-utils';

export type CheckpointResult = 'pass' | 'fail' | 'unknown';
export type CoSignOutputType = 'doc' | 'doc_upload' | 'triage' | 'assignment';
export type CoSignStatus = 'pending' | 'approved' | 'auto_approved' | 'rejected';

export interface Checkpoint {
    id: string;
    label: string;
}

export interface CoSignRequest {
    id: string;
    workspace_id: string;
    project_id?: string;
    output_type: CoSignOutputType;
    payload_json: string;
    confidence_score: number;
    rationale?: string;
    checkpoints_json: string;
    checkpoint_results_json: string;
    status: CoSignStatus;
    created_by?: string;
    reviewer_id?: string;
    created_at: string;
    resolved_at?: string;
}

export interface ListCoSignRequestsResponse {
    requests: CoSignRequest[];
    has_more: boolean;
}

export interface ListCoSignFilters {
    status?: string;
    output_type?: string;
    limit?: number;
    before?: string;
}

class BaseAPI {
    protected async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
        const url = `${getBackendApiUrl()}${endpoint}`;
        const workspaceID = getActiveWorkspaceId();
        const existing = options?.headers instanceof Headers
            ? Object.fromEntries(options.headers.entries())
            : (options?.headers as Record<string, string> | undefined);
        const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(existing ?? {}) };
        if (workspaceID) headers['X-Workspace-ID'] = workspaceID;
        const res = await fetch(url, { credentials: 'include', headers, ...options });
        if (!res.ok) {
            const err = await res.json().catch(() => ({})) as { error?: string; message?: string };
            throw new Error(err.error ?? err.message ?? `Request failed: ${res.status}`);
        }
        const text = await res.text();
        return text ? (JSON.parse(text) as T) : (undefined as unknown as T);
    }
}

class CoSignAPI extends BaseAPI {
    list(workspaceId: string, filters: ListCoSignFilters = {}): Promise<ListCoSignRequestsResponse> {
        const params = new URLSearchParams();
        if (filters.status) params.set('status', filters.status);
        if (filters.output_type) params.set('output_type', filters.output_type);
        if (filters.limit) params.set('limit', String(filters.limit));
        if (filters.before) params.set('before', filters.before);
        const qs = params.toString();
        return this.request<ListCoSignRequestsResponse>(
            `/workspaces/${workspaceId}/cosign${qs ? `?${qs}` : ''}`
        );
    }

    get(workspaceId: string, id: string): Promise<CoSignRequest> {
        return this.request<CoSignRequest>(`/workspaces/${workspaceId}/cosign/${id}`);
    }

    getPendingCount(workspaceId: string): Promise<{ count: number }> {
        return this.request<{ count: number }>(`/workspaces/${workspaceId}/cosign/pending-count`);
    }

    approve(workspaceId: string, id: string): Promise<CoSignRequest> {
        return this.request<CoSignRequest>(`/workspaces/${workspaceId}/cosign/${id}/approve`, { method: 'POST' });
    }

    reject(workspaceId: string, id: string, reason: string): Promise<CoSignRequest> {
        return this.request<CoSignRequest>(`/workspaces/${workspaceId}/cosign/${id}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        });
    }
}

export const cosignApi = new CoSignAPI();

// Helpers for parsing the JSON string fields from the proto response
export function parsePayload(req: CoSignRequest): Record<string, unknown> {
    try { return JSON.parse(req.payload_json) as Record<string, unknown>; } catch { return {}; }
}

export function parseCheckpoints(req: CoSignRequest): Checkpoint[] {
    try {
        const parsed = JSON.parse(req.checkpoints_json);
        return Array.isArray(parsed) ? (parsed as Checkpoint[]) : [];
    } catch { return []; }
}

export function parseCheckpointResults(req: CoSignRequest): Record<string, CheckpointResult> {
    try {
        return JSON.parse(req.checkpoint_results_json) as Record<string, CheckpointResult>;
    } catch { return {}; }
}

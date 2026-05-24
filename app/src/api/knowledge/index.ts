import { getBackendApiUrl } from '@/src/api/config';
import { getActiveWorkspaceId } from '@/src/api/workspace-utils';

export interface KnowledgeDoc {
    id: string;
    project_id: string;
    doc_type: 'standard' | 'living';
    source_type: 'git' | 'task' | 'manual' | 'upload';
    source_ref: string;
    title: string;
    body: string;
    status: 'draft' | 'published' | 'rejected' | 'cosign_rejected';
    created_by: string;
    created_at: string;
    updated_at: string;
    confidence_score: number;
    rationale: string;
    archetype_id?: string | null;
}

export interface ListDocsResponse {
    docs: KnowledgeDoc[];
    next_cursor: string;
}

export interface SearchDocsResult {
    doc: KnowledgeDoc;
    score: number;
}

export interface SearchDocsResponse {
    results: SearchDocsResult[];
}

export interface UploadResponse {
    status: string;
    source_ref: string;
}

export interface ListDocsFilters {
    source_type?: string;
    status?: string;
    since?: string;   // RFC3339 — docs updated after this time (IDB sync)
    before?: string;  // RFC3339 — docs updated before this time (backward pagination)
    limit?: number;
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

class KnowledgeAPI extends BaseAPI {
    list(projectId: string, filters: ListDocsFilters = {}): Promise<ListDocsResponse> {
        const params = new URLSearchParams();
        if (filters.source_type) params.set('source_type', filters.source_type);
        if (filters.status) params.set('status', filters.status);
        if (filters.since) params.set('since', filters.since);
        if (filters.before) params.set('before', filters.before);
        if (filters.limit) params.set('limit', String(filters.limit));
        const qs = params.toString();
        return this.request<ListDocsResponse>(`/projects/${projectId}/knowledge${qs ? `?${qs}` : ''}`);
    }

    get(projectId: string, id: string): Promise<KnowledgeDoc> {
        return this.request<KnowledgeDoc>(`/projects/${projectId}/knowledge/${id}`);
    }

    create(projectId: string, body: { source_type: string; source_ref: string; title: string; body: string }): Promise<KnowledgeDoc> {
        return this.request<KnowledgeDoc>(`/projects/${projectId}/knowledge`, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    update(projectId: string, id: string, body: { title: string; body: string }): Promise<KnowledgeDoc> {
        return this.request<KnowledgeDoc>(`/projects/${projectId}/knowledge/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
        });
    }

    publish(projectId: string, id: string): Promise<KnowledgeDoc> {
        return this.request<KnowledgeDoc>(`/projects/${projectId}/knowledge/${id}/publish`, { method: 'POST' });
    }

    reject(projectId: string, id: string, reason?: string): Promise<KnowledgeDoc> {
        return this.request<KnowledgeDoc>(`/projects/${projectId}/knowledge/${id}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason: reason ?? '' }),
        });
    }

    search(projectId: string, query: string, topK = 10): Promise<SearchDocsResponse> {
        const params = new URLSearchParams({ query, top_k: String(topK) });
        return this.request<SearchDocsResponse>(`/projects/${projectId}/knowledge/search?${params}`);
    }

    getLivingDoc(projectId: string): Promise<KnowledgeDoc | null> {
        return this.request<KnowledgeDoc | null>(`/projects/${projectId}/knowledge/living`).catch(() => null);
    }

    upload(projectId: string, file: File, archetypeId?: string): Promise<UploadResponse> {
        const form = new FormData();
        form.append('file', file);
        if (archetypeId) form.append('archetype_id', archetypeId);
        const workspaceID = getActiveWorkspaceId();
        const headers: Record<string, string> = {};
        if (workspaceID) headers['X-Workspace-ID'] = workspaceID;
        return fetch(`${getBackendApiUrl()}/projects/${projectId}/knowledge/upload`, {
            method: 'POST',
            credentials: 'include',
            headers,
            body: form,
        }).then(async (res) => {
            if (!res.ok) {
                const err = await res.json().catch(() => ({})) as { error?: string };
                throw new Error(err.error ?? `Upload failed: ${res.status}`);
            }
            return res.json() as Promise<UploadResponse>;
        });
    }
}

export const knowledgeApi = new KnowledgeAPI();

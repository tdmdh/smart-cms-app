import { getBackendApiUrl } from '@/src/api/config';
import { getActiveWorkspaceId } from '@/src/api/workspace-utils';
import type { KnowledgeDoc } from '@/src/api/knowledge';

export interface DocumentArchetype {
    id: string;
    project_id: string;
    name: string;
    description: string;
    prompt_template: string;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface ListArchetypesResponse {
    archetypes: DocumentArchetype[];
}

export interface CreateArchetypeBody {
    name: string;
    description: string;
}

export interface UpdateArchetypeBody {
    name?: string;
    description?: string;
}

class ArchetypeAPI {
    private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
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

    list(projectId: string): Promise<ListArchetypesResponse> {
        return this.request<ListArchetypesResponse>(`/projects/${projectId}/knowledge/archetypes`);
    }

    get(projectId: string, archetypeId: string): Promise<DocumentArchetype> {
        return this.request<DocumentArchetype>(`/projects/${projectId}/knowledge/archetypes/${archetypeId}`);
    }

    create(projectId: string, body: CreateArchetypeBody): Promise<DocumentArchetype> {
        return this.request<DocumentArchetype>(`/projects/${projectId}/knowledge/archetypes`, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    update(projectId: string, archetypeId: string, body: UpdateArchetypeBody): Promise<DocumentArchetype> {
        return this.request<DocumentArchetype>(`/projects/${projectId}/knowledge/archetypes/${archetypeId}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
        });
    }

    delete(projectId: string, archetypeId: string): Promise<void> {
        return this.request<void>(`/projects/${projectId}/knowledge/archetypes/${archetypeId}`, {
            method: 'DELETE',
        });
    }

    getLivingDoc(projectId: string, archetypeId: string): Promise<KnowledgeDoc | null> {
        return this.request<KnowledgeDoc | null>(
            `/projects/${projectId}/knowledge/archetypes/${archetypeId}/living`,
        ).catch(() => null);
    }
}

export const archetypeApi = new ArchetypeAPI();

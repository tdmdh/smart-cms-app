// ==========================================================================
// ASSET MANAGEMENT API - DIRECT BACKEND CLIENT
// ==========================================================================

import { getBackendApiUrl } from '@/src/api/config';
import { getActiveWorkspaceId } from '@/src/api/workspace-utils';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export interface Asset {
    id: string;
    project_id: string;
    folder_id?: string;
    name: string;
    original_filename: string;
    storage_path: string;
    mime_type: string;
    size_bytes: number;
    asset_type: 'image' | 'video' | 'document' | 'audio' | 'other';
    thumbnail_url?: string;
    url?: string; // Public URL for file access/download
    tags?: string[];
    metadata?: Record<string, string>;
    current_version_id?: string;
    entity_type?: string;
    entity_id?: string;
    created_by: string;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
}

export interface Folder {
    id: string;
    project_id: string;
    parent_id?: string;
    name: string;
    path: string;
    asset_count: number;
    created_at: string;
}

export interface AssetVersion {
    id: string;
    asset_id: string;
    version_number: number;
    storage_path: string;
    size_bytes: number;
    change_note?: string;
    created_by: string;
    created_at: string;
}

export interface ShareLink {
    id: string;
    token: string;
    url: string;
    expires_at?: string;
    max_downloads?: number;
    download_count: number;
}

// Request types
export interface UpdateAssetRequest {
    name?: string;
    tags?: string[];
    metadata?: Record<string, string>;
    folder_id?: string;
}

export interface CreateFolderRequest {
    name: string;
    parent_id?: string;
}

export interface CreateShareLinkRequest {
    expires_in_hours?: number;
    max_downloads?: number;
    password?: string;
}

export interface ListAssetsParams {
    folder_id?: string;
    page?: number;
    page_size?: number;
}

export interface SearchAssetsParams {
    q?: string;
    tags?: string;
    entity_type?: string;
    entity_id?: string;
    folder_id?: string;
    asset_type?: string;
    page?: number;
    page_size?: number;
}

// Response types
export interface AssetResponse {
    asset: Asset;
    download_url?: string;
}

export interface AssetListResponse {
    assets: Asset[];
    total: number;
    page: number;
    page_size: number;
}

export interface FolderResponse {
    folder: Folder;
}

export interface FolderListResponse {
    folders: Folder[];
}

export interface VersionListResponse {
    versions: AssetVersion[];
}

export interface ShareLinkResponse {
    share_link: ShareLink;
}

export interface MessageResponse {
    success?: boolean;
    message?: string;
}

// --------------------------------------------------------------------------
// Base API Class
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
            credentials: 'include',
            headers,
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

    protected async uploadFormData<T>(endpoint: string, formData: FormData): Promise<T> {
        const url = `${getBackendApiUrl()}${endpoint}`;

        const headers: Record<string, string> = {};
        const workspaceID = getActiveWorkspaceId();
        if (workspaceID) {
            headers['X-Workspace-ID'] = workspaceID;
        }

        const res = await fetch(url, {
            method: 'POST',
            credentials: 'include',
            headers,
            body: formData, // No Content-Type header - browser sets it with boundary
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || error.message || `Upload failed: ${res.status}`);
        }

        return res.json();
    }
}

// --------------------------------------------------------------------------
// Assets API
// --------------------------------------------------------------------------

class AssetsAPI extends BaseAPI {
    get(id: string): Promise<AssetResponse> {
        return this.fetchGet(`/assets/${id}`);
    }

    update(id: string, data: UpdateAssetRequest): Promise<AssetResponse> {
        return this.fetchPut(`/assets/${id}`, data);
    }

    delete(id: string, permanent = false): Promise<MessageResponse> {
        return this.fetchDelete(`/assets/${id}${permanent ? '?permanent=true' : ''}`);
    }

    list(projectId: string, params?: ListAssetsParams): Promise<AssetListResponse> {
        const cleanParams = params ? Object.fromEntries(
            Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
        ) : undefined;
        const query = cleanParams && Object.keys(cleanParams).length > 0
            ? `?${new URLSearchParams(cleanParams as Record<string, string>).toString()}`
            : '';
        return this.fetchGet(`/projects/${projectId}/assets${query}`);
    }

    search(projectId: string, params?: SearchAssetsParams): Promise<AssetListResponse> {
        const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
        return this.fetchGet(`/projects/${projectId}/assets/search${query}`);
    }

    upload(projectId: string, file: File, options?: {
        name?: string;
        folder_id?: string;
        tags?: string[];
        entity_type?: string;
        entity_id?: string;
    }): Promise<AssetResponse> {
        const formData = new FormData();
        formData.append('file', file);
        if (options?.name) formData.append('name', options.name);
        if (options?.folder_id) formData.append('folder_id', options.folder_id);
        if (options?.tags) formData.append('tags', options.tags.join(','));
        if (options?.entity_type) formData.append('entity_type', options.entity_type);
        if (options?.entity_id) formData.append('entity_id', options.entity_id);

        return this.uploadFormData(`/projects/${projectId}/assets`, formData);
    }

    // Versions
    listVersions(assetId: string): Promise<VersionListResponse> {
        return this.fetchGet(`/assets/${assetId}/versions`);
    }

    uploadVersion(assetId: string, file: File, note?: string): Promise<{ version: AssetVersion }> {
        const formData = new FormData();
        formData.append('file', file);
        if (note) formData.append('note', note);

        return this.uploadFormData(`/assets/${assetId}/versions`, formData);
    }

    restoreVersion(assetId: string, versionId: string): Promise<AssetResponse> {
        return this.fetchPost(`/assets/${assetId}/restore/${versionId}`, {});
    }

    // Share links
    createShareLink(assetId: string, data: CreateShareLinkRequest): Promise<ShareLinkResponse> {
        return this.fetchPost(`/assets/${assetId}/share`, data);
    }

    getSharedAsset(token: string, password?: string): Promise<AssetResponse> {
        const query = password ? `?password=${encodeURIComponent(password)}` : '';
        return this.fetchGet(`/shared/${token}${query}`);
    }

    // Task attachments
    listTaskAttachments(taskId: string): Promise<{ attachments: Asset[] }> {
        return this.fetchGet(`/tasks/${taskId}/attachments`);
    }
}

// --------------------------------------------------------------------------
// Folders API
// --------------------------------------------------------------------------

class FoldersAPI extends BaseAPI {
    list(projectId: string, parentId?: string): Promise<FolderListResponse> {
        const query = parentId ? `?parent_id=${parentId}` : '';
        return this.fetchGet(`/projects/${projectId}/folders${query}`);
    }

    create(projectId: string, data: CreateFolderRequest): Promise<FolderResponse> {
        return this.fetchPost(`/projects/${projectId}/folders`, data);
    }
}

// --------------------------------------------------------------------------
// Combined API Export
// --------------------------------------------------------------------------

class AssetManagementAPI {
    readonly assets = new AssetsAPI();
    readonly folders = new FoldersAPI();
}

export const api = new AssetManagementAPI();

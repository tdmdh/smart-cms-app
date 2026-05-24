import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    api,
    type Asset,
    type UpdateAssetRequest,
    type ListAssetsParams,
    type SearchAssetsParams,
    type CreateShareLinkRequest,
} from './config';

// --------------------------------------------------------------------------
// Query Keys Factory
// --------------------------------------------------------------------------

export const assetKeys = {
    all: ['assets'] as const,
    lists: () => [...assetKeys.all, 'list'] as const,
    list: (projectId: string, params?: ListAssetsParams) => [...assetKeys.lists(), projectId, params] as const,
    search: (projectId: string, params?: SearchAssetsParams) => [...assetKeys.all, 'search', projectId, params] as const,
    details: () => [...assetKeys.all, 'detail'] as const,
    detail: (id: string) => [...assetKeys.details(), id] as const,
    versions: (assetId: string) => [...assetKeys.all, 'versions', assetId] as const,
    taskAttachments: (taskId: string) => [...assetKeys.all, 'task', taskId] as const,
};

export const folderKeys = {
    all: ['folders'] as const,
    lists: () => [...folderKeys.all, 'list'] as const,
    list: (projectId: string, parentId?: string) => [...folderKeys.lists(), projectId, parentId] as const,
};

interface QueryToggleOptions {
    enabled?: boolean;
}

// --------------------------------------------------------------------------
// Asset Queries
// --------------------------------------------------------------------------

export function useAssets(projectId: string, params?: ListAssetsParams, options?: QueryToggleOptions) {
    const enabled = options?.enabled ?? true;

    return useQuery({
        queryKey: assetKeys.list(projectId, params),
        queryFn: () => api.assets.list(projectId, params),
        enabled: !!projectId && enabled,
    });
}

export function useAssetSearch(projectId: string, params?: SearchAssetsParams) {
    return useQuery({
        queryKey: assetKeys.search(projectId, params),
        queryFn: () => api.assets.search(projectId, params),
        enabled: !!projectId,
    });
}

export function useAsset(id: string) {
    return useQuery({
        queryKey: assetKeys.detail(id),
        queryFn: () => api.assets.get(id),
        enabled: !!id,
    });
}

export function useAssetVersions(assetId: string) {
    return useQuery({
        queryKey: assetKeys.versions(assetId),
        queryFn: () => api.assets.listVersions(assetId),
        enabled: !!assetId,
    });
}

export function useTaskAttachments(taskId: string) {
    return useQuery({
        queryKey: assetKeys.taskAttachments(taskId),
        queryFn: () => api.assets.listTaskAttachments(taskId),
        enabled: !!taskId,
    });
}

// --------------------------------------------------------------------------
// Folder Queries
// --------------------------------------------------------------------------

export function useFolders(projectId: string, parentId?: string, options?: QueryToggleOptions) {
    const enabled = options?.enabled ?? true;

    return useQuery({
        queryKey: folderKeys.list(projectId, parentId),
        queryFn: () => api.folders.list(projectId, parentId),
        enabled: !!projectId && enabled,
    });
}

// --------------------------------------------------------------------------
// Asset Mutations
// --------------------------------------------------------------------------

export function useUploadAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            projectId,
            file,
            options,
        }: {
            projectId: string;
            file: File;
            options?: {
                name?: string;
                folder_id?: string;
                tags?: string[];
                entity_type?: string;
                entity_id?: string;
            };
        }) => api.assets.upload(projectId, file, options),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
            queryClient.invalidateQueries({ queryKey: folderKeys.list(variables.projectId) });
        },
    });
}

export function useUpdateAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateAssetRequest }) =>
            api.assets.update(id, data),
        onSuccess: (data, variables) => {
            queryClient.setQueryData(assetKeys.detail(variables.id), data);
            queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
        },
    });
}

export function useDeleteAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, permanent = false }: { id: string; permanent?: boolean }) =>
            api.assets.delete(id, permanent),
        onSuccess: (_, variables) => {
            queryClient.removeQueries({ queryKey: assetKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
        },
    });
}

export function useUploadVersion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            assetId,
            file,
            note,
        }: {
            assetId: string;
            file: File;
            note?: string;
        }) => api.assets.uploadVersion(assetId, file, note),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: assetKeys.versions(variables.assetId) });
            queryClient.invalidateQueries({ queryKey: assetKeys.detail(variables.assetId) });
        },
    });
}

export function useRestoreVersion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ assetId, versionId }: { assetId: string; versionId: string }) =>
            api.assets.restoreVersion(assetId, versionId),
        onSuccess: (data, variables) => {
            queryClient.setQueryData(assetKeys.detail(variables.assetId), data);
            queryClient.invalidateQueries({ queryKey: assetKeys.versions(variables.assetId) });
        },
    });
}

export function useCreateShareLink() {
    return useMutation({
        mutationFn: ({ assetId, data }: { assetId: string; data: CreateShareLinkRequest }) =>
            api.assets.createShareLink(assetId, data),
    });
}

// --------------------------------------------------------------------------
// Folder Mutations
// --------------------------------------------------------------------------

export function useCreateFolder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            projectId,
            name,
            parentId,
        }: {
            projectId: string;
            name: string;
            parentId?: string;
        }) => api.folders.create(projectId, { name, parent_id: parentId }),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: folderKeys.list(variables.projectId) });
        },
    });
}

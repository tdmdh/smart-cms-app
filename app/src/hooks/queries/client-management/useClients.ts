import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ClientResponse, CreateClientRequest, UpdateClientRequest, ListClientsResponse } from './config';
import { useWorkspaceId } from '@/src/hooks/useWorkspaceId';

export const clientsKeys = {
    all: (workspaceId: string | null) => ['clients', workspaceId] as const,
    lists: (workspaceId: string | null) => [...clientsKeys.all(workspaceId), 'list'] as const,
    list: (workspaceId: string | null, filters?: { limit?: number; offset?: number }) => [...clientsKeys.lists(workspaceId), filters] as const,
    details: (workspaceId: string | null) => [...clientsKeys.all(workspaceId), 'detail'] as const,
    detail: (workspaceId: string | null, id: string) => [...clientsKeys.details(workspaceId), id] as const,
};

export function useClients(limit = 20, offset = 0) {
    const workspaceId = useWorkspaceId();
    return useQuery({
        queryKey: clientsKeys.list(workspaceId, { limit, offset }),
        queryFn: () => api.clients.list(limit, offset),
        enabled: !!workspaceId,
    });
}

export function useClient(id: string) {
    const workspaceId = useWorkspaceId();
    return useQuery({
        queryKey: clientsKeys.detail(workspaceId, id),
        queryFn: () => api.clients.get(id),
        enabled: !!id && !!workspaceId,
    });
}

export function useCreateClient() {
    const queryClient = useQueryClient();
    const workspaceId = useWorkspaceId();

    return useMutation({
        mutationFn: (data: CreateClientRequest) => api.clients.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: clientsKeys.lists(workspaceId) });
        },
    });
}

export function useUpdateClient() {
    const queryClient = useQueryClient();
    const workspaceId = useWorkspaceId();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateClientRequest }) =>
            api.clients.update(id, data),
        onSuccess: (data, variables) => {
            queryClient.setQueryData(clientsKeys.detail(workspaceId, variables.id), data);
            queryClient.invalidateQueries({ queryKey: clientsKeys.lists(workspaceId) });
        },
    });
}

export function useDeleteClient() {
    const queryClient = useQueryClient();
    const workspaceId = useWorkspaceId();

    return useMutation({
        mutationFn: (id: string) => api.clients.delete(id),
        onSuccess: (_, deletedId) => {
            queryClient.removeQueries({ queryKey: clientsKeys.detail(workspaceId, deletedId) });
            queryClient.invalidateQueries({ queryKey: clientsKeys.lists(workspaceId) });
        },
    });
}

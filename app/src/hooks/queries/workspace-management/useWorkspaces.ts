import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type Workspace, type WorkspaceInvitation } from './config';

export const workspacesKeys = {
    all: ['workspaces'] as const,
    lists: () => [...workspacesKeys.all, 'list'] as const,
    list: (page = 1, pageSize = 20) => [...workspacesKeys.lists(), { page, pageSize }] as const,
    details: () => [...workspacesKeys.all, 'detail'] as const,
    detail: (id: string) => [...workspacesKeys.details(), id] as const,
    role: (id: string) => [...workspacesKeys.all, 'role', id] as const,
    members: (id: string) => [...workspacesKeys.all, 'members', id] as const,
    sentInvitations: (id: string) => [...workspacesKeys.all, 'invitations', 'sent', id] as const,
    receivedInvitations: () => [...workspacesKeys.all, 'invitations', 'received'] as const,
};

interface UseWorkspacesOptions {
    enabled?: boolean;
    staleTime?: number;
}

export function useWorkspaces(page = 1, pageSize = 20, options: UseWorkspacesOptions = {}) {
    const { enabled = true, staleTime } = options;

    return useQuery({
        queryKey: workspacesKeys.list(page, pageSize),
        queryFn: () => api.list(page, pageSize),
        enabled,
        ...(typeof staleTime === 'number' ? { staleTime } : {}),
    });
}

export function useWorkspace(id: string | null) {
    return useQuery({
        queryKey: workspacesKeys.detail(id || ''),
        queryFn: () => api.get(id || ''),
        enabled: !!id,
    });
}

export function useWorkspaceRole(id: string | null) {
    return useQuery({
        queryKey: workspacesKeys.role(id || ''),
        queryFn: () => api.role(id || ''),
        enabled: !!id,
    });
}

export function useWorkspaceMembers(id: string | null) {
    return useQuery({
        queryKey: workspacesKeys.members(id || ''),
        queryFn: () => api.members(id || ''),
        enabled: !!id,
    });
}

export function useCreateWorkspace() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { name: string; description?: string }) => api.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: workspacesKeys.lists() });
        },
    });
}

export function useUpdateWorkspace() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string } }) =>
            api.update(id, data),
        onSuccess: (result, variables) => {
            queryClient.setQueryData(workspacesKeys.detail(variables.id), result);
            queryClient.invalidateQueries({ queryKey: workspacesKeys.lists() });
        },
    });
}

export function useDeleteWorkspace() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete(id),
        onSuccess: (_, id) => {
            queryClient.removeQueries({ queryKey: workspacesKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: workspacesKeys.lists() });
        },
    });
}

export function useAddWorkspaceMember() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ workspaceId, data }: { workspaceId: string; data: { user_id: string; role: string } }) =>
            api.addMember(workspaceId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: workspacesKeys.members(variables.workspaceId) });
        },
    });
}

export function useUpdateWorkspaceMemberRole() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ workspaceId, userId, data }: { workspaceId: string; userId: string; data: { role: string } }) =>
            api.updateMemberRole(workspaceId, userId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: workspacesKeys.members(variables.workspaceId) });
        },
    });
}

export function useRemoveWorkspaceMember() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ workspaceId, userId }: { workspaceId: string; userId: string }) =>
            api.removeMember(workspaceId, userId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: workspacesKeys.members(variables.workspaceId) });
        },
    });
}

export function useSentInvitations(workspaceId: string | null) {
    return useQuery({
        queryKey: workspacesKeys.sentInvitations(workspaceId || ''),
        queryFn: () => api.listSentInvitations(workspaceId!),
        enabled: !!workspaceId,
    });
}

export function useReceivedInvitations() {
    return useQuery({
        queryKey: workspacesKeys.receivedInvitations(),
        queryFn: () => api.listReceivedInvitations(),
    });
}

export function useInviteWorkspaceMember() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ workspaceId, data }: { workspaceId: string; data: { email: string; role: string } }) =>
            api.inviteWorkspaceMember(workspaceId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: workspacesKeys.sentInvitations(variables.workspaceId) });
        },
    });
}

export function useAcceptInvitation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (token: string) => api.acceptInvitation(token),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: workspacesKeys.receivedInvitations() });
            queryClient.invalidateQueries({ queryKey: workspacesKeys.lists() });
        },
    });
}

export function useRevokeInvitation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ workspaceId, invitationId }: { workspaceId: string; invitationId: string }) =>
            api.revokeInvitation(invitationId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: workspacesKeys.sentInvitations(variables.workspaceId) });
        },
    });
}

export function useResendInvitation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ workspaceId, invitationId }: { workspaceId: string; invitationId: string }) =>
            api.resendInvitation(invitationId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: workspacesKeys.sentInvitations(variables.workspaceId) });
        },
    });
}

export type { WorkspaceInvitation };

export function getDefaultWorkspace(workspaces: Workspace[] | undefined, currentWorkspaceId: string | null): string | null {
    if (!workspaces || workspaces.length === 0) {
        return null;
    }

    if (currentWorkspaceId && workspaces.some((workspace) => workspace.id === currentWorkspaceId)) {
        return currentWorkspaceId;
    }

    return workspaces[0].id;
}

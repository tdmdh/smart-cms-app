import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, AddClientMemberRequest, UpdateClientMemberRoleRequest, InviteClientMemberRequest } from './config';

export const clientMembersKeys = {
    all: ['client-members'] as const,
    lists: () => [...clientMembersKeys.all, 'list'] as const,
    list: (clientId: string) => [...clientMembersKeys.lists(), clientId] as const,
};

export function useClientMembers(clientId: string) {
    return useQuery({
        queryKey: clientMembersKeys.list(clientId),
        queryFn: () => api.clientMembers.list(clientId),
        enabled: !!clientId,
    });
}

export function useAddClientMember() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ clientId, data }: { clientId: string; data: AddClientMemberRequest }) =>
            api.clientMembers.add(clientId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: clientMembersKeys.list(variables.clientId) });
        },
    });
}

export function useUpdateClientMemberRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ clientId, userId, data }: { clientId: string; userId: string; data: UpdateClientMemberRoleRequest }) =>
            api.clientMembers.updateRole(clientId, userId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: clientMembersKeys.list(variables.clientId) });
        },
    });
}

export function useRemoveClientMember() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ clientId, userId }: { clientId: string; userId: string }) =>
            api.clientMembers.remove(clientId, userId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: clientMembersKeys.list(variables.clientId) });
        },
    });
}

export function useInviteClientMember() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ clientId, data }: { clientId: string; data: InviteClientMemberRequest }) =>
            api.invitations.create(clientId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: clientMembersKeys.list(variables.clientId) });
        },
    });
}

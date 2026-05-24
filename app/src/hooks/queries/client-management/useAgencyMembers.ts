import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, AddAgencyMemberRequest, UpdateAgencyMemberRoleRequest } from './config';

export const agencyMembersKeys = {
    all: ['agency-members'] as const,
    lists: () => [...agencyMembersKeys.all, 'list'] as const,
    details: () => [...agencyMembersKeys.all, 'detail'] as const,
    detail: (userId: string) => [...agencyMembersKeys.details(), userId] as const,
};
export function useAgencyMembers() {
    return useQuery({
        queryKey: agencyMembersKeys.lists(),
        queryFn: () => api.agencyMembers.list(),
    });
}

export function useAgencyMember(userId: string) {
    return useQuery({
        queryKey: agencyMembersKeys.detail(userId),
        queryFn: () => api.agencyMembers.get(userId),
        enabled: !!userId,
    });
}

export function useAddAgencyMember() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: AddAgencyMemberRequest) => api.agencyMembers.add(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: agencyMembersKeys.lists() });
        },
    });
}

export function useUpdateAgencyMemberRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, data }: { userId: string; data: UpdateAgencyMemberRoleRequest }) =>
            api.agencyMembers.updateRole(userId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: agencyMembersKeys.detail(variables.userId) });
            queryClient.invalidateQueries({ queryKey: agencyMembersKeys.lists() });
        },
    });
}

export function useRemoveAgencyMember() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId: string) => api.agencyMembers.remove(userId),
        onSuccess: (_, deletedUserId) => {
            queryClient.removeQueries({ queryKey: agencyMembersKeys.detail(deletedUserId) });
            queryClient.invalidateQueries({ queryKey: agencyMembersKeys.lists() });
        },
    });
}

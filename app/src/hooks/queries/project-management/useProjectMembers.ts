import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, AddMemberRequest, MemberResponse, MembersListResponse, MessageResponse } from './config';
import { useWorkspaceId } from '@/src/hooks/useWorkspaceId';

export const projectMembersKeys = {
    all: (workspaceId: string | null) => ['projectMembers', workspaceId] as const,
    lists: (workspaceId: string | null) => [...projectMembersKeys.all(workspaceId), 'list'] as const,
    list: (workspaceId: string | null, projectId: string) => [...projectMembersKeys.lists(workspaceId), projectId] as const,
};

interface QueryToggleOptions {
    enabled?: boolean;
}

export function useProjectMembers(projectId: string, options?: QueryToggleOptions) {
    const workspaceId = useWorkspaceId();
    const enabled = options?.enabled ?? true;

    return useQuery({
        queryKey: projectMembersKeys.list(workspaceId, projectId),
        queryFn: () => api.members.list(projectId),
        enabled: !!projectId && !!workspaceId && enabled,
    });
}

export function useAddProjectMember() {
    const queryClient = useQueryClient();
    const workspaceId = useWorkspaceId();

    return useMutation({
        mutationFn: ({ projectId, data }: { projectId: string; data: AddMemberRequest }) =>
            api.members.add(projectId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: projectMembersKeys.list(workspaceId, variables.projectId) });
        },
    });
}

export function useUpdateProjectMemberRole() {
    const queryClient = useQueryClient();
    const workspaceId = useWorkspaceId();

    return useMutation({
        mutationFn: ({ projectId, userId, data }: { projectId: string; userId: string; data: { role: string } }) =>
            api.members.updateRole(projectId, userId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: projectMembersKeys.list(workspaceId, variables.projectId) });
        },
    });
}

export function useRemoveProjectMember() {
    const queryClient = useQueryClient();
    const workspaceId = useWorkspaceId();

    return useMutation({
        mutationFn: ({ projectId, userId }: { projectId: string; userId: string }) =>
            api.members.remove(projectId, userId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: projectMembersKeys.list(workspaceId, variables.projectId) });
        },
    });
}

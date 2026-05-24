import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, CreateMilestoneRequest, UpdateMilestoneRequest, MilestoneResponse, MilestonesListResponse, MessageResponse } from './config';
import { useWorkspaceId } from '@/src/hooks/useWorkspaceId';

export const milestonesKeys = {
    all: (workspaceId: string | null) => ['milestones', workspaceId] as const,
    lists: (workspaceId: string | null) => [...milestonesKeys.all(workspaceId), 'list'] as const,
    list: (workspaceId: string | null, projectId: string) => [...milestonesKeys.lists(workspaceId), projectId] as const,
    details: (workspaceId: string | null) => [...milestonesKeys.all(workspaceId), 'detail'] as const,
    detail: (workspaceId: string | null, id: string) => [...milestonesKeys.details(workspaceId), id] as const,
    progress: (workspaceId: string | null, id: string) => [...milestonesKeys.all(workspaceId), 'progress', id] as const,
    dependencies: (workspaceId: string | null, id: string) => [...milestonesKeys.all(workspaceId), 'dependencies', id] as const,
    dependents: (workspaceId: string | null, id: string) => [...milestonesKeys.all(workspaceId), 'dependents', id] as const,
    dependencyGraph: (workspaceId: string | null, projectId: string) => [...milestonesKeys.all(workspaceId), 'dependency-graph', projectId] as const,
};

interface QueryToggleOptions {
    enabled?: boolean;
}

export function useMilestones(projectId: string, options?: QueryToggleOptions) {
    const workspaceId = useWorkspaceId();
    const enabled = options?.enabled ?? true;

    return useQuery({
        queryKey: milestonesKeys.list(workspaceId, projectId),
        queryFn: () => api.milestones.list(projectId),
        enabled: !!projectId && !!workspaceId && enabled,
    });
}

export function useMilestone(id: string) {
    const workspaceId = useWorkspaceId();
    return useQuery({
        queryKey: milestonesKeys.detail(workspaceId, id),
        queryFn: () => api.milestones.get(id),
        enabled: !!id && !!workspaceId,
    });
}

export function useCreateMilestone() {
    const queryClient = useQueryClient();
    const workspaceId = useWorkspaceId();

    return useMutation({
        mutationFn: ({ projectId, data }: { projectId: string; data: CreateMilestoneRequest }) =>
            api.milestones.create(projectId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: milestonesKeys.list(workspaceId, variables.projectId) });
        },
    });
}

export function useUpdateMilestone() {
    const queryClient = useQueryClient();
    const workspaceId = useWorkspaceId();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateMilestoneRequest }) =>
            api.milestones.update(id, data),
        onSuccess: (data, variables) => {
            queryClient.setQueryData(milestonesKeys.detail(workspaceId, variables.id), data);
            queryClient.invalidateQueries({ queryKey: milestonesKeys.lists(workspaceId) });
        },
    });
}

export function useDeleteMilestone() {
    const queryClient = useQueryClient();
    const workspaceId = useWorkspaceId();

    return useMutation({
        mutationFn: (id: string) => api.milestones.delete(id),
        onSuccess: (_, deletedId) => {
            queryClient.removeQueries({ queryKey: milestonesKeys.detail(workspaceId, deletedId) });
            queryClient.invalidateQueries({ queryKey: milestonesKeys.lists(workspaceId) });
        },
    });
}

export function useMilestoneProgress(id: string) {
    const workspaceId = useWorkspaceId();
    return useQuery({
        queryKey: milestonesKeys.progress(workspaceId, id),
        queryFn: () => api.milestones.progress(id),
        enabled: !!id && !!workspaceId,
    });
}

export function useMilestoneDependencies(id: string) {
    const workspaceId = useWorkspaceId();
    return useQuery({
        queryKey: milestonesKeys.dependencies(workspaceId, id),
        queryFn: () => api.milestones.dependencies(id),
        enabled: !!id && !!workspaceId,
    });
}

export function useMilestoneDependents(id: string) {
    const workspaceId = useWorkspaceId();
    return useQuery({
        queryKey: milestonesKeys.dependents(workspaceId, id),
        queryFn: () => api.milestones.dependents(id),
        enabled: !!id && !!workspaceId,
    });
}

export function useAddMilestoneDependency() {
    const queryClient = useQueryClient();
    const workspaceId = useWorkspaceId();

    return useMutation({
        mutationFn: ({ id, dependsOnId }: { id: string; dependsOnId: string }) =>
            api.milestones.addDependency(id, { depends_on_milestone_id: dependsOnId }),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: milestonesKeys.dependencies(workspaceId, variables.id) });
            queryClient.invalidateQueries({ queryKey: milestonesKeys.dependents(workspaceId, variables.dependsOnId) });
            queryClient.invalidateQueries({ queryKey: milestonesKeys.detail(workspaceId, variables.id) });
            queryClient.invalidateQueries({ queryKey: milestonesKeys.lists(workspaceId) });
        },
    });
}

export function useRemoveMilestoneDependency() {
    const queryClient = useQueryClient();
    const workspaceId = useWorkspaceId();

    return useMutation({
        mutationFn: ({ id, dependsOnId }: { id: string; dependsOnId: string }) =>
            api.milestones.removeDependency(id, dependsOnId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: milestonesKeys.dependencies(workspaceId, variables.id) });
            queryClient.invalidateQueries({ queryKey: milestonesKeys.dependents(workspaceId, variables.dependsOnId) });
            queryClient.invalidateQueries({ queryKey: milestonesKeys.detail(workspaceId, variables.id) });
            queryClient.invalidateQueries({ queryKey: milestonesKeys.lists(workspaceId) });
        },
    });
}

export function useOverrideMilestoneStatus() {
    const queryClient = useQueryClient();
    const workspaceId = useWorkspaceId();

    return useMutation({
        mutationFn: ({ id, status, reason }: { id: string; status: string; reason: string }) =>
            api.milestones.overrideStatus(id, { status, reason }),
        onSuccess: (data, variables) => {
            queryClient.setQueryData(milestonesKeys.detail(workspaceId, variables.id), data);
            queryClient.invalidateQueries({ queryKey: milestonesKeys.lists(workspaceId) });
        },
    });
}

export function useMilestoneDependencyGraph(projectId: string) {
    const workspaceId = useWorkspaceId();
    return useQuery({
        queryKey: milestonesKeys.dependencyGraph(workspaceId, projectId),
        queryFn: () => api.milestones.dependencyGraph(projectId),
        enabled: !!projectId && !!workspaceId,
    });
}

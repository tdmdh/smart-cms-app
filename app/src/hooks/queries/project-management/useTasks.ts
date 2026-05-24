import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, CreateTaskRequest, TaskResponse, TasksListResponse, BulkUpdateResponse, MessageResponse } from './config';
import { projectsKeys } from './useProjects';
import { milestonesKeys } from './useMilestones';
import { useWorkspaceId } from '@/src/hooks/useWorkspaceId';

export const tasksKeys = {
    all: (workspaceId: string | null) => ['tasks', workspaceId] as const,
    lists: (workspaceId: string | null) => [...tasksKeys.all(workspaceId), 'list'] as const,
    list: (workspaceId: string | null, projectId: string, filters?: { milestone_id?: string; assignee_id?: string; status?: string; page?: number; page_size?: number }) =>
        [...tasksKeys.lists(workspaceId), projectId, filters] as const,
    userTasks: (workspaceId: string | null, filters?: { status?: string; priority?: string; page?: number; page_size?: number }) =>
        [...tasksKeys.all(workspaceId), 'userTasks', filters] as const,
    details: (workspaceId: string | null) => [...tasksKeys.all(workspaceId), 'detail'] as const,
    detail: (workspaceId: string | null, id: string) => [...tasksKeys.details(workspaceId), id] as const,
    subtasks: (workspaceId: string | null, parentTaskId: string) => [...tasksKeys.all(workspaceId), 'subtasks', parentTaskId] as const,
};

interface QueryToggleOptions {
    enabled?: boolean;
}

export function useTasks(
    projectId: string,
    params?: { milestone_id?: string; assignee_id?: string; status?: string; page?: number; page_size?: number },
    options?: QueryToggleOptions
) {
    const workspaceId = useWorkspaceId();
    const enabled = options?.enabled ?? true;

    return useQuery({
        queryKey: tasksKeys.list(workspaceId, projectId, params),
        queryFn: () => api.tasks.list(projectId, params),
        enabled: !!projectId && !!workspaceId && enabled,
    });
}

export function useUserTasks(params?: { status?: string; priority?: string; page?: number; page_size?: number }) {
    const workspaceId = useWorkspaceId();
    return useQuery({
        queryKey: tasksKeys.userTasks(workspaceId, params),
        queryFn: () => api.tasks.userList(params),
        enabled: !!workspaceId,
    });
}

export function useTask(id: string) {
    const workspaceId = useWorkspaceId();
    return useQuery({
        queryKey: tasksKeys.detail(workspaceId, id),
        queryFn: () => api.tasks.get(id),
        enabled: !!id && !!workspaceId,
    });
}

export function useSubtasks(parentTaskId: string) {
    const workspaceId = useWorkspaceId();
    return useQuery({
        queryKey: tasksKeys.subtasks(workspaceId, parentTaskId),
        queryFn: () => api.tasks.listSubtasks(parentTaskId),
        enabled: !!parentTaskId && !!workspaceId,
    });
}

export function useCreateTask() {
    const queryClient = useQueryClient();
    const workspaceId = useWorkspaceId();

    return useMutation({
        mutationFn: ({ projectId, data }: { projectId: string; data: CreateTaskRequest }) =>
            api.tasks.create(projectId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: tasksKeys.lists(workspaceId) });
            queryClient.invalidateQueries({ queryKey: projectsKeys.dashboard(workspaceId, variables.projectId) });
            queryClient.invalidateQueries({ queryKey: [...projectsKeys.all(workspaceId), 'kanban', variables.projectId] });
            queryClient.invalidateQueries({ queryKey: milestonesKeys.all(workspaceId) });
        },
    });
}

export function useUpdateTask() {
    const queryClient = useQueryClient();
    const workspaceId = useWorkspaceId();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateTaskRequest> }) =>
            api.tasks.update(id, data),
        onSuccess: (data, variables) => {
            queryClient.setQueryData(tasksKeys.detail(workspaceId, variables.id), data);
            queryClient.invalidateQueries({ queryKey: tasksKeys.lists(workspaceId) });
            queryClient.invalidateQueries({ queryKey: [...projectsKeys.all(workspaceId), 'kanban'] });
            queryClient.invalidateQueries({ queryKey: milestonesKeys.all(workspaceId) });
        },
    });
}

export function useDeleteTask() {
    const queryClient = useQueryClient();
    const workspaceId = useWorkspaceId();

    return useMutation({
        mutationFn: (id: string) => api.tasks.delete(id),
        onSuccess: (_, deletedId) => {
            queryClient.removeQueries({ queryKey: tasksKeys.detail(workspaceId, deletedId) });
            queryClient.invalidateQueries({ queryKey: tasksKeys.lists(workspaceId) });
            queryClient.invalidateQueries({ queryKey: [...projectsKeys.all(workspaceId), 'kanban'] });
            queryClient.invalidateQueries({ queryKey: milestonesKeys.all(workspaceId) });
        },
    });
}

export function useMoveTask() {
    const queryClient = useQueryClient();
    const workspaceId = useWorkspaceId();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { new_status: string; new_position?: number; new_column_id?: string } }) =>
            api.tasks.move(id, data as { new_status: string; new_position?: number }),
        onMutate: async ({ id, data }) => {
            await queryClient.cancelQueries({ queryKey: tasksKeys.all(workspaceId) });
            const previousTask = queryClient.getQueryData(tasksKeys.detail(workspaceId, id));
            if (previousTask) {
                queryClient.setQueryData(tasksKeys.detail(workspaceId, id), (old: TaskResponse | undefined) =>
                    old ? { ...old, task: { ...(old.task as any), status: data.new_status } } : old
                );
            }
            return { previousTask };
        },
        onError: (err, variables, context) => {
            if (context?.previousTask) {
                queryClient.setQueryData(tasksKeys.detail(workspaceId, variables.id), context.previousTask);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: tasksKeys.all(workspaceId) });
            queryClient.invalidateQueries({ queryKey: projectsKeys.all(workspaceId) });
            queryClient.invalidateQueries({ queryKey: milestonesKeys.all(workspaceId) });
        },
    });
}

export function useBulkUpdateTaskStatus() {
    const queryClient = useQueryClient();
    const workspaceId = useWorkspaceId();

    return useMutation({
        mutationFn: (data: { task_ids: string[]; new_status: string }) =>
            api.tasks.bulkUpdateStatus(data),
        onMutate: async ({ task_ids, new_status }) => {
            await queryClient.cancelQueries({ queryKey: tasksKeys.all(workspaceId) });
            const previousTasks: Record<string, unknown> = {};
            task_ids.forEach(id => {
                previousTasks[id] = queryClient.getQueryData(tasksKeys.detail(workspaceId, id));
                queryClient.setQueryData(tasksKeys.detail(workspaceId, id), (old: TaskResponse | undefined) =>
                    old ? { ...old, task: { ...(old.task as any), status: new_status } } : old
                );
            });
            return { previousTasks };
        },
        onError: (err, variables, context) => {
            if (context?.previousTasks) {
                variables.task_ids.forEach(id => {
                    if (context.previousTasks[id]) {
                        queryClient.setQueryData(tasksKeys.detail(workspaceId, id), context.previousTasks[id]);
                    }
                });
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: tasksKeys.all(workspaceId) });
            queryClient.invalidateQueries({ queryKey: milestonesKeys.all(workspaceId) });
        },
    });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, TimeEntryResponse, TimeEntriesListResponse, MessageResponse } from './config';

export const timeEntriesKeys = {
    all: ['timeEntries'] as const,
    lists: () => [...timeEntriesKeys.all, 'list'] as const,
    list: (taskId: string, filters?: { user_id?: string; from_date?: string; to_date?: string; page?: number; page_size?: number }) =>
        [...timeEntriesKeys.lists(), taskId, filters] as const,
};

export function useTimeEntries(taskId: string, params?: { user_id?: string; from_date?: string; to_date?: string; page?: number; page_size?: number }) {
    return useQuery({
        queryKey: timeEntriesKeys.list(taskId, params),
        queryFn: () => api.timeEntries.list(taskId, params),
        enabled: !!taskId,
    });
}

export function useLogTime() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ taskId, data }: { taskId: string; data: { description?: string; hours: number; logged_date: string } }) =>
            api.timeEntries.log(taskId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: timeEntriesKeys.list(variables.taskId) });
        },
    });
}

export function useUpdateTimeEntry() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, taskId, data }: { id: string; taskId: string; data: { description?: string; hours?: number; logged_date?: string } }) =>
            api.timeEntries.update(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: timeEntriesKeys.list(variables.taskId) });
        },
    });
}

export function useDeleteTimeEntry() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, taskId }: { id: string; taskId: string }) =>
            api.timeEntries.delete(id),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: timeEntriesKeys.list(variables.taskId) });
        },
    });
}

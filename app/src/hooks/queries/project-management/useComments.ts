import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, CommentResponse, CommentsListResponse, MessageResponse } from './config';

export const commentsKeys = {
    all: ['comments'] as const,
    lists: () => [...commentsKeys.all, 'list'] as const,
    list: (taskId: string, filters?: { page?: number; page_size?: number }) => [...commentsKeys.lists(), taskId, filters] as const,
};

export function useComments(taskId: string, params?: { page?: number; page_size?: number }) {
    return useQuery({
        queryKey: commentsKeys.list(taskId, params),
        queryFn: () => api.comments.list(taskId, params),
        enabled: !!taskId,
    });
}

export function useCreateComment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ taskId, data }: { taskId: string; data: { content: string } }) =>
            api.comments.create(taskId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: commentsKeys.list(variables.taskId) });
        },
    });
}

export function useUpdateComment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, taskId, data }: { id: string; taskId: string; data: { content: string } }) =>
            api.comments.update(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: commentsKeys.list(variables.taskId) });
        },
    });
}

export function useDeleteComment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, taskId }: { id: string; taskId: string }) =>
            api.comments.delete(id),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: commentsKeys.list(variables.taskId) });
        },
    });
}

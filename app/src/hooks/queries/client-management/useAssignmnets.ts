import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, AssignDeveloperRequest, UnassignDeveloperRequest } from './config';

export const assignmentsKeys = {
    all: ['assignments'] as const,
    developerClients: (userId: string) => [...assignmentsKeys.all, 'developer', userId] as const,
};

export function useDeveloperClients(userId: string) {
    return useQuery({
        queryKey: assignmentsKeys.developerClients(userId),
        queryFn: () => api.assignments.getDeveloperClients(userId),
        enabled: !!userId,
    });
}

export function useAssignDeveloper() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: AssignDeveloperRequest) => api.assignments.assign(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: assignmentsKeys.developerClients(variables.developer_id)
            });
        },
    });
}

export function useUnassignDeveloper() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: UnassignDeveloperRequest) => api.assignments.unassign(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: assignmentsKeys.developerClients(variables.developer_id)
            });
        },
    });
}

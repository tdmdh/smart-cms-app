import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, CreateProjectRequest, UpdateProjectRequest, ProjectResponse, ProjectListResponse, DashboardResponse, KanbanResponse, MessageResponse } from './config';
import type { CreateKanbanColumnRequest, UpdateKanbanColumnRequest } from './config';
import type { KanbanColumn } from '@/src/api/project/config';
import { useWorkspaceId } from '@/src/hooks/useWorkspaceId';

export const projectsKeys = {
    all: (workspaceId: string | null) => ['projects', workspaceId] as const,
    lists: (workspaceId: string | null) => [...projectsKeys.all(workspaceId), 'list'] as const,
    list: (workspaceId: string | null, filters?: { client_id?: string; status?: string; page?: number; page_size?: number }) =>
        [...projectsKeys.lists(workspaceId), filters] as const,
    details: (workspaceId: string | null) => [...projectsKeys.all(workspaceId), 'detail'] as const,
    detail: (workspaceId: string | null, id: string) => [...projectsKeys.details(workspaceId), id] as const,
    dashboard: (workspaceId: string | null, id: string) => [...projectsKeys.all(workspaceId), 'dashboard', id] as const,
    kanban: (workspaceId: string | null, id: string, milestoneId?: string) =>
        [...projectsKeys.all(workspaceId), 'kanban', id, milestoneId] as const,
};

export function useProjects(params?: { client_id?: string; status?: string; page?: number; page_size?: number }) {
    const workspaceId = useWorkspaceId();
    return useQuery({
        queryKey: projectsKeys.list(workspaceId, params),
        queryFn: () => api.projects.list(params),
        enabled: !!workspaceId,
    });
}

export function useProject(id: string) {
    const workspaceId = useWorkspaceId();
    return useQuery({
        queryKey: projectsKeys.detail(workspaceId, id),
        queryFn: () => api.projects.get(id),
        enabled: !!id && !!workspaceId,
    });
}

export function useProjectDashboard(id: string) {
    const workspaceId = useWorkspaceId();
    return useQuery({
        queryKey: projectsKeys.dashboard(workspaceId, id),
        queryFn: () => api.projects.dashboard(id),
        enabled: !!id && !!workspaceId,
    });
}

export function useProjectKanban(id: string, milestoneId?: string) {
    const workspaceId = useWorkspaceId();
    return useQuery({
        queryKey: projectsKeys.kanban(workspaceId, id, milestoneId),
        queryFn: () => api.projects.kanban(id, milestoneId),
        enabled: !!id && !!workspaceId,
    });
}

export function useCreateProject() {
    const queryClient = useQueryClient();
    const workspaceId = useWorkspaceId();

    return useMutation({
        mutationFn: (data: CreateProjectRequest) => api.projects.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: projectsKeys.lists(workspaceId) });
        },
    });
}

export function useUpdateProject() {
    const queryClient = useQueryClient();
    const workspaceId = useWorkspaceId();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateProjectRequest }) =>
            api.projects.update(id, data),
        onSuccess: (data, variables) => {
            queryClient.setQueryData(projectsKeys.detail(workspaceId, variables.id), data);
            queryClient.invalidateQueries({ queryKey: projectsKeys.lists(workspaceId) });
        },
    });
}

export function useDeleteProject() {
    const queryClient = useQueryClient();
    const workspaceId = useWorkspaceId();

    return useMutation({
        mutationFn: (id: string) => api.projects.delete(id),
        onSuccess: (_, deletedId) => {
            queryClient.removeQueries({ queryKey: projectsKeys.detail(workspaceId, deletedId) });
            queryClient.invalidateQueries({ queryKey: projectsKeys.lists(workspaceId) });
        },
    });
}

// ============================================================================
// Kanban Column Hooks
// ============================================================================

export function useKanbanColumns(projectId: string) {
    const workspaceId = useWorkspaceId();
    return useQuery({
        queryKey: [...projectsKeys.all(workspaceId), 'kanban-columns', projectId] as const,
        queryFn: () => api.kanbanColumns.list(projectId),
        enabled: !!projectId && !!workspaceId,
        select: (data) => data.columns ?? [],
    });
}

export function useCreateKanbanColumn(projectId: string) {
    const queryClient = useQueryClient();
    const workspaceId = useWorkspaceId();
    return useMutation({
        mutationFn: (data: CreateKanbanColumnRequest) => api.kanbanColumns.create(projectId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...projectsKeys.all(workspaceId), 'kanban-columns', projectId] });
            queryClient.invalidateQueries({ queryKey: projectsKeys.kanban(workspaceId, projectId) });
        },
    });
}

export function useUpdateKanbanColumn(projectId: string, columnId: string) {
    const queryClient = useQueryClient();
    const workspaceId = useWorkspaceId();
    return useMutation({
        mutationFn: (data: UpdateKanbanColumnRequest) => api.kanbanColumns.update(projectId, columnId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...projectsKeys.all(workspaceId), 'kanban-columns', projectId] });
            queryClient.invalidateQueries({ queryKey: projectsKeys.kanban(workspaceId, projectId) });
        },
    });
}

export function useDeleteKanbanColumn(projectId: string) {
    const queryClient = useQueryClient();
    const workspaceId = useWorkspaceId();
    return useMutation({
        mutationFn: (columnId: string) => api.kanbanColumns.delete(projectId, columnId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...projectsKeys.all(workspaceId), 'kanban-columns', projectId] });
            queryClient.invalidateQueries({ queryKey: projectsKeys.kanban(workspaceId, projectId) });
        },
    });
}

export function useReorderKanbanColumns(projectId: string) {
    const queryClient = useQueryClient();
    const workspaceId = useWorkspaceId();
    return useMutation({
        mutationFn: (columnIds: string[]) => api.kanbanColumns.reorder(projectId, columnIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...projectsKeys.all(workspaceId), 'kanban-columns', projectId] });
        },
    });
}

export type { KanbanColumn, CreateKanbanColumnRequest, UpdateKanbanColumnRequest };

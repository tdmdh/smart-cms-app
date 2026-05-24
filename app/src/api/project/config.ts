import { Endpoint } from "../config";
import type { components } from "../types";

export type CreateProjectRequest = components["schemas"]["handlers.CreateProjectRequest"];
export type CreateMilestoneRequest = components["schemas"]["handlers.CreateMilestoneRequest"];
export type CreateTaskRequest = components["schemas"]["handlers.CreateTaskRequest"];
export type AddMemberRequest = components["schemas"]["handlers.AddMemberRequest"];
export type MessageResponse = components["schemas"]["handlers.MessageResponse"];
export type ErrorResponse = components["schemas"]["handlers.ErrorResponse"];

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
    status?: string;
}

export interface UpdateMilestoneRequest extends Partial<CreateMilestoneRequest> {
    sort_order?: number;
}

export interface ProjectResponse {
    project?: unknown;
}

export interface ProjectListResponse {
    projects?: unknown[];
    total?: number;
    page?: number;
    page_size?: number;
}

export interface MemberResponse {
    member?: unknown;
}

export interface MembersListResponse {
    members?: unknown[];
}

export interface MilestoneResponse {
    milestone?: unknown;
}

export interface MilestonesListResponse {
    milestones?: unknown[];
}

export interface TaskResponse {
    task?: unknown;
}

export interface TasksListResponse {
    tasks?: unknown[];
    pagination?: unknown;
}

export interface CommentResponse {
    comment?: unknown;
}

export interface CommentsListResponse {
    comments?: unknown[];
    pagination?: unknown;
}

export interface TimeEntryResponse {
    time_entry?: unknown;
}

export interface TimeEntriesListResponse {
    entries?: unknown[];
    total_hours?: number;
    pagination?: unknown;
}

export interface DashboardResponse {
    project?: unknown;
    total_tasks?: number;
    open_tasks?: number;
    in_progress_tasks?: number;
    review_tasks?: number;
    completed_tasks?: number;
    blocked_tasks?: number;
}

export interface KanbanColumn {
    id: string;
    project_id: string;
    name: string;
    description?: string;
    color: string;
    category: 'todo' | 'in_progress' | 'done';
    position: number;
    tasks?: unknown[];
}

export interface KanbanColumnListResponse {
    columns: KanbanColumn[];
}

export interface KanbanResponse {
    success?: boolean;
    columns?: KanbanColumn[];
}

export interface BulkUpdateResponse {
    updated_count?: number;
}

export const project = {
    list: (params?: { client_id?: string; status?: string; page?: number; page_size?: number }): Endpoint<void, ProjectListResponse> => {
        const searchParams = new URLSearchParams();
        if (params) {
            if (params.client_id) searchParams.set('client_id', params.client_id);
            if (params.status) searchParams.set('status', params.status);
            if (params.page !== undefined) searchParams.set('page', String(params.page));
            if (params.page_size !== undefined) searchParams.set('page_size', String(params.page_size));
        }
        const queryString = searchParams.toString();
        return {
            method: 'GET',
            endpoint: `/projects${queryString ? `?${queryString}` : ''}`,
            requiredAuth: true,
        };
    },
    create: (): Endpoint<CreateProjectRequest, ProjectResponse> => ({
        method: 'POST',
        endpoint: '/projects',
        requiredAuth: true,
    }),
    get: (id: string): Endpoint<void, ProjectResponse> => ({
        method: 'GET',
        endpoint: `/projects/${id}`,
        requiredAuth: true,
    }),
    update: (id: string): Endpoint<UpdateProjectRequest, ProjectResponse> => ({
        method: 'PUT',
        endpoint: `/projects/${id}`,
        requiredAuth: true,
    }),
    delete: (id: string): Endpoint<void, MessageResponse> => ({
        method: 'DELETE',
        endpoint: `/projects/${id}`,
        requiredAuth: true,
    }),
    dashboard: (id: string): Endpoint<void, DashboardResponse> => ({
        method: 'GET',
        endpoint: `/projects/${id}/dashboard`,
        requiredAuth: true,
    }),
    kanban: (id: string, milestoneId?: string): Endpoint<void, KanbanResponse> => ({
        method: 'GET',
        endpoint: `/projects/${id}/kanban${milestoneId ? `?milestone_id=${milestoneId}` : ''}`,
        requiredAuth: true,
    }),

    members: {
        list: (projectId: string): Endpoint<void, MembersListResponse> => ({
            method: 'GET',
            endpoint: `/projects/${projectId}/members`,
            requiredAuth: true,
        }),
        add: (projectId: string): Endpoint<AddMemberRequest, MemberResponse> => ({
            method: 'POST',
            endpoint: `/projects/${projectId}/members`,
            requiredAuth: true,
        }),
        updateRole: (projectId: string, userId: string): Endpoint<{ role: string }, MemberResponse> => ({
            method: 'PUT',
            endpoint: `/projects/${projectId}/members/${userId}`,
            requiredAuth: true,
        }),
        remove: (projectId: string, userId: string): Endpoint<void, MessageResponse> => ({
            method: 'DELETE',
            endpoint: `/projects/${projectId}/members/${userId}`,
            requiredAuth: true,
        }),
    },

    milestones: {
        list: (projectId: string): Endpoint<void, MilestonesListResponse> => ({
            method: 'GET',
            endpoint: `/projects/${projectId}/milestones`,
            requiredAuth: true,
        }),
        create: (projectId: string): Endpoint<CreateMilestoneRequest, MilestoneResponse> => ({
            method: 'POST',
            endpoint: `/projects/${projectId}/milestones`,
            requiredAuth: true,
        }),
        get: (milestoneId: string): Endpoint<void, MilestoneResponse> => ({
            method: 'GET',
            endpoint: `/milestones/${milestoneId}`,
            requiredAuth: true,
        }),
        update: (milestoneId: string): Endpoint<Partial<CreateMilestoneRequest>, MilestoneResponse> => ({
            method: 'PUT',
            endpoint: `/milestones/${milestoneId}`,
            requiredAuth: true,
        }),
        delete: (milestoneId: string): Endpoint<void, MessageResponse> => ({
            method: 'DELETE',
            endpoint: `/milestones/${milestoneId}`,
            requiredAuth: true,
        }),
        // New endpoints for milestone enhancements
        progress: (milestoneId: string): Endpoint<void, { progress?: unknown }> => ({
            method: 'GET',
            endpoint: `/milestones/${milestoneId}/progress`,
            requiredAuth: true,
        }),
        dependencies: (milestoneId: string): Endpoint<void, { dependencies?: unknown[] }> => ({
            method: 'GET',
            endpoint: `/milestones/${milestoneId}/dependencies`,
            requiredAuth: true,
        }),
        addDependency: (milestoneId: string): Endpoint<{ depends_on_milestone_id: string }, MessageResponse> => ({
            method: 'POST',
            endpoint: `/milestones/${milestoneId}/dependencies`,
            requiredAuth: true,
        }),
        removeDependency: (milestoneId: string, dependsOnId: string): Endpoint<void, MessageResponse> => ({
            method: 'DELETE',
            endpoint: `/milestones/${milestoneId}/dependencies/${dependsOnId}`,
            requiredAuth: true,
        }),
        dependents: (milestoneId: string): Endpoint<void, { dependents?: unknown[] }> => ({
            method: 'GET',
            endpoint: `/milestones/${milestoneId}/dependents`,
            requiredAuth: true,
        }),
        overrideStatus: (milestoneId: string): Endpoint<{ status: string; reason: string }, MilestoneResponse> => ({
            method: 'POST',
            endpoint: `/milestones/${milestoneId}/override-status`,
            requiredAuth: true,
        }),
        dependencyGraph: (projectId: string): Endpoint<void, { graph?: Record<string, string[]> }> => ({
            method: 'GET',
            endpoint: `/projects/${projectId}/milestones/dependency-graph`,
            requiredAuth: true,
        }),
    },


    tasks: {
        list: (projectId: string, params?: { milestone_id?: string; assignee_id?: string; status?: string; page?: number; page_size?: number }): Endpoint<void, TasksListResponse> => ({
            method: 'GET',
            endpoint: `/projects/${projectId}/tasks${params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : ''}`,
            requiredAuth: true,
        }),
        userList: (params?: { status?: string; priority?: string; page?: number; page_size?: number }): Endpoint<void, TasksListResponse> => {
            const searchParams = new URLSearchParams();
            if (params?.status) searchParams.set('status', params.status);
            if (params?.priority) searchParams.set('priority', params.priority);
            if (params?.page !== undefined) searchParams.set('page', String(params.page));
            if (params?.page_size !== undefined) searchParams.set('page_size', String(params.page_size));
            const queryString = searchParams.toString();
            return {
                method: 'GET',
                endpoint: `/tasks${queryString ? `?${queryString}` : ''}`,
                requiredAuth: true,
            };
        },

        create: (projectId: string): Endpoint<CreateTaskRequest, TaskResponse> => ({
            method: 'POST',
            endpoint: `/projects/${projectId}/tasks`,
            requiredAuth: true,
        }),
        get: (taskId: string): Endpoint<void, TaskResponse> => ({
            method: 'GET',
            endpoint: `/tasks/${taskId}`,
            requiredAuth: true,
        }),
        update: (taskId: string): Endpoint<Partial<CreateTaskRequest>, TaskResponse> => ({
            method: 'PUT',
            endpoint: `/tasks/${taskId}`,
            requiredAuth: true,
        }),
        delete: (taskId: string): Endpoint<void, MessageResponse> => ({
            method: 'DELETE',
            endpoint: `/tasks/${taskId}`,
            requiredAuth: true,
        }),
        move: (taskId: string): Endpoint<{ new_status: string; new_position?: number }, TaskResponse> => ({
            method: 'POST',
            endpoint: `/tasks/${taskId}/move`,
            requiredAuth: true,
        }),
        bulkUpdateStatus: (): Endpoint<{ task_ids: string[]; new_status: string }, BulkUpdateResponse> => ({
            method: 'POST',
            endpoint: '/tasks/bulk-status',
            requiredAuth: true,
        }),
        subtasks: (id: string): Endpoint<void, TasksListResponse> => ({
            method: 'GET',
            endpoint: `/tasks/${id}/subtasks`,
            requiredAuth: true,
        }),
    },

    comments: {
        list: (taskId: string, params?: { page?: number; page_size?: number }): Endpoint<void, CommentsListResponse> => ({
            method: 'GET',
            endpoint: `/tasks/${taskId}/comments${params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : ''}`,
            requiredAuth: true,
        }),
        create: (taskId: string): Endpoint<{ content: string }, CommentResponse> => ({
            method: 'POST',
            endpoint: `/tasks/${taskId}/comments`,
            requiredAuth: true,
        }),
        update: (commentId: string): Endpoint<{ content: string }, CommentResponse> => ({
            method: 'PUT',
            endpoint: `/comments/${commentId}`,
            requiredAuth: true,
        }),
        delete: (commentId: string): Endpoint<void, MessageResponse> => ({
            method: 'DELETE',
            endpoint: `/comments/${commentId}`,
            requiredAuth: true,
        }),
    },

    timeEntries: {
        list: (taskId: string, params?: { user_id?: string; from_date?: string; to_date?: string; page?: number; page_size?: number }): Endpoint<void, TimeEntriesListResponse> => ({
            method: 'GET',
            endpoint: `/tasks/${taskId}/time${params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : ''}`,
            requiredAuth: true,
        }),
        log: (taskId: string): Endpoint<{ description?: string; hours: number; logged_date: string }, TimeEntryResponse> => ({
            method: 'POST',
            endpoint: `/tasks/${taskId}/time`,
            requiredAuth: true,
        }),
        update: (entryId: string): Endpoint<{ description?: string; hours?: number; logged_date?: string }, TimeEntryResponse> => ({
            method: 'PUT',
            endpoint: `/time-entries/${entryId}`,
            requiredAuth: true,
        }),
        delete: (entryId: string): Endpoint<void, MessageResponse> => ({
            method: 'DELETE',
            endpoint: `/time-entries/${entryId}`,
            requiredAuth: true,
        }),
    },
};

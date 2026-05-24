// ==========================================================================
// PROJECT MANAGEMENT API - DIRECT BACKEND CLIENT
// ==========================================================================
// This client calls the Go backend directly instead of going through Next.js API routes

import { getBackendApiUrl } from '@/src/api/config';
import { getActiveWorkspaceId } from '@/src/api/workspace-utils';
import type {
    CreateProjectRequest,
    UpdateProjectRequest,
    CreateMilestoneRequest,
    UpdateMilestoneRequest,
    CreateTaskRequest,
    AddMemberRequest,
    ProjectResponse,
    ProjectListResponse,
    MemberResponse,
    MembersListResponse,
    MilestoneResponse,
    MilestonesListResponse,
    TaskResponse,
    TasksListResponse,
    CommentResponse,
    CommentsListResponse,
    TimeEntryResponse,
    TimeEntriesListResponse,
    DashboardResponse,
    KanbanResponse,
    BulkUpdateResponse,
    MessageResponse,
} from '@/src/api/project/config';



// --------------------------------------------------------------------------
// Base API Class - Direct Backend Calls
// --------------------------------------------------------------------------

class BaseAPI {
    protected async request<T>(
        endpoint: string,
        options?: RequestInit
    ): Promise<T> {
        const url = `${getBackendApiUrl()}${endpoint}`;

        const workspaceID = getActiveWorkspaceId();
        const existingHeaders = options?.headers instanceof Headers
            ? Object.fromEntries(options.headers.entries())
            : (options?.headers as Record<string, string> | undefined);
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(existingHeaders ?? {}),
        };
        if (workspaceID) {
            headers['X-Workspace-ID'] = workspaceID;
        }

        const res = await fetch(url, {
            credentials: 'include', // Include HTTP-only cookies for auth
            headers,
            ...options,
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || error.message || `Request failed: ${res.status}`);
        }

        const text = await res.text();
        return text ? JSON.parse(text) : (undefined as unknown as T);
    }

    protected fetchGet<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    protected fetchPost<T, B>(endpoint: string, body: B): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    protected fetchPut<T, B>(endpoint: string, body: B): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body),
        });
    }

    protected fetchDelete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }
}

// --------------------------------------------------------------------------
// Projects API
// --------------------------------------------------------------------------

class ProjectsAPI extends BaseAPI {
    list(params?: { client_id?: string; status?: string; page?: number; page_size?: number }): Promise<ProjectListResponse> {
        const workspaceId = getActiveWorkspaceId();
        const base = workspaceId ? `/workspaces/${workspaceId}/projects` : '/projects';
        const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
        return this.fetchGet(`${base}${query}`);
    }

    get(id: string): Promise<ProjectResponse> {
        return this.fetchGet(`/projects/${id}`);
    }

    create(data: CreateProjectRequest): Promise<ProjectResponse> {
        const workspaceId = getActiveWorkspaceId();
        const base = workspaceId ? `/workspaces/${workspaceId}/projects` : '/projects';
        return this.fetchPost(base, data);
    }

    update(id: string, data: Partial<CreateProjectRequest>): Promise<ProjectResponse> {
        return this.fetchPut(`/projects/${id}`, data);
    }

    delete(id: string): Promise<MessageResponse> {
        return this.fetchDelete(`/projects/${id}`);
    }

    dashboard(id: string): Promise<DashboardResponse> {
        return this.fetchGet(`/projects/${id}/dashboard`);
    }

    kanban(id: string, milestoneId?: string): Promise<KanbanResponse> {
        return this.fetchGet(`/projects/${id}/kanban${milestoneId ? `?milestone_id=${milestoneId}` : ''}`);
    }
}

// --------------------------------------------------------------------------
// Project Members API
// --------------------------------------------------------------------------

class ProjectMembersAPI extends BaseAPI {
    list(projectId: string): Promise<MembersListResponse> {
        return this.fetchGet(`/projects/${projectId}/members`);
    }

    add(projectId: string, data: AddMemberRequest): Promise<MemberResponse> {
        return this.fetchPost(`/projects/${projectId}/members`, data);
    }

    updateRole(projectId: string, userId: string, data: { role: string }): Promise<MemberResponse> {
        return this.fetchPut(`/projects/${projectId}/members/${userId}`, data);
    }

    remove(projectId: string, userId: string): Promise<MessageResponse> {
        return this.fetchDelete(`/projects/${projectId}/members/${userId}`);
    }
}

// --------------------------------------------------------------------------
// Milestones API
// --------------------------------------------------------------------------

class MilestonesAPI extends BaseAPI {
    list(projectId: string): Promise<MilestonesListResponse> {
        return this.fetchGet(`/projects/${projectId}/milestones`);
    }

    get(id: string): Promise<MilestoneResponse> {
        return this.fetchGet(`/milestones/${id}`);
    }

    create(projectId: string, data: CreateMilestoneRequest): Promise<MilestoneResponse> {
        return this.fetchPost(`/projects/${projectId}/milestones`, data);
    }

    update(id: string, data: Partial<CreateMilestoneRequest>): Promise<MilestoneResponse> {
        return this.fetchPut(`/milestones/${id}`, data);
    }

    delete(id: string): Promise<MessageResponse> {
        return this.fetchDelete(`/milestones/${id}`);
    }

    // Milestone progress and dependencies
    progress(id: string): Promise<{ progress?: unknown }> {
        return this.fetchGet(`/milestones/${id}/progress`);
    }

    dependencies(id: string): Promise<{ dependencies?: unknown[] }> {
        return this.fetchGet(`/milestones/${id}/dependencies`);
    }

    addDependency(id: string, data: { depends_on_milestone_id: string }): Promise<MessageResponse> {
        return this.fetchPost(`/milestones/${id}/dependencies`, data);
    }

    removeDependency(id: string, dependsOnId: string): Promise<MessageResponse> {
        return this.fetchDelete(`/milestones/${id}/dependencies/${dependsOnId}`);
    }

    dependents(id: string): Promise<{ dependents?: unknown[] }> {
        return this.fetchGet(`/milestones/${id}/dependents`);
    }

    overrideStatus(id: string, data: { status: string; reason: string }): Promise<MilestoneResponse> {
        return this.fetchPost(`/milestones/${id}/override-status`, data);
    }

    dependencyGraph(projectId: string): Promise<{ graph?: Record<string, string[]> }> {
        return this.fetchGet(`/projects/${projectId}/milestones/dependency-graph`);
    }
}

// --------------------------------------------------------------------------
// Tasks API
// --------------------------------------------------------------------------

class TasksAPI extends BaseAPI {
    list(projectId: string, params?: { milestone_id?: string; assignee_id?: string; status?: string; page?: number; page_size?: number }): Promise<TasksListResponse> {
        const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
        return this.fetchGet(`/projects/${projectId}/tasks${query}`);
    }

    userList(params?: { status?: string; priority?: string; page?: number; page_size?: number }): Promise<TasksListResponse> {
        const searchParams = new URLSearchParams();
        if (params?.status) searchParams.append('status', params.status);
        if (params?.priority) searchParams.append('priority', params.priority);
        if (params?.page) searchParams.append('page', params.page.toString());
        if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
        const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
        return this.fetchGet(`/tasks${query}`);
    }

    get(id: string): Promise<TaskResponse> {
        return this.fetchGet(`/tasks/${id}`);
    }

    create(projectId: string, data: CreateTaskRequest): Promise<TaskResponse> {
        return this.fetchPost(`/projects/${projectId}/tasks`, data);
    }

    update(id: string, data: Partial<CreateTaskRequest>): Promise<TaskResponse> {
        return this.fetchPut(`/tasks/${id}`, data);
    }

    delete(id: string): Promise<MessageResponse> {
        return this.fetchDelete(`/tasks/${id}`);
    }

    move(id: string, data: { new_status: string; new_position?: number }): Promise<TaskResponse> {
        return this.fetchPost(`/tasks/${id}/move`, data);
    }

    bulkUpdateStatus(data: { task_ids: string[]; new_status: string }): Promise<BulkUpdateResponse> {
        return this.fetchPost('/tasks/bulk-status', data);
    }

    listSubtasks(parentTaskId: string): Promise<TasksListResponse> {
        return this.fetchGet(`/tasks/${parentTaskId}/subtasks`);
    }
}

// --------------------------------------------------------------------------
// Comments API
// --------------------------------------------------------------------------

class CommentsAPI extends BaseAPI {
    list(taskId: string, params?: { page?: number; page_size?: number }): Promise<CommentsListResponse> {
        const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
        return this.fetchGet(`/tasks/${taskId}/comments${query}`);
    }

    create(taskId: string, data: { content: string }): Promise<CommentResponse> {
        return this.fetchPost(`/tasks/${taskId}/comments`, data);
    }

    update(id: string, data: { content: string }): Promise<CommentResponse> {
        return this.fetchPut(`/comments/${id}`, data);
    }

    delete(id: string): Promise<MessageResponse> {
        return this.fetchDelete(`/comments/${id}`);
    }
}

// --------------------------------------------------------------------------
// Time Entries API
// --------------------------------------------------------------------------

class TimeEntriesAPI extends BaseAPI {
    list(taskId: string, params?: { user_id?: string; from_date?: string; to_date?: string; page?: number; page_size?: number }): Promise<TimeEntriesListResponse> {
        const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
        return this.fetchGet(`/tasks/${taskId}/time${query}`);
    }

    log(taskId: string, data: { description?: string; hours: number; logged_date: string }): Promise<TimeEntryResponse> {
        return this.fetchPost(`/tasks/${taskId}/time`, data);
    }

    update(id: string, data: { description?: string; hours?: number; logged_date?: string }): Promise<TimeEntryResponse> {
        return this.fetchPut(`/time-entries/${id}`, data);
    }

    delete(id: string): Promise<MessageResponse> {
        return this.fetchDelete(`/time-entries/${id}`);
    }
}

// --------------------------------------------------------------------------
// Users API (for user lookup)
// --------------------------------------------------------------------------

export interface UserLookupResponse {
    user: {
        id: string;
        email?: string;
        username?: string;
        name?: string;
        last_name?: string;
    } | null;
}

class UsersAPI extends BaseAPI {
    lookup(identifier: string): Promise<UserLookupResponse> {
        return this.fetchGet(`/auth/users/lookup?identifier=${encodeURIComponent(identifier)}`);
    }
}

// --------------------------------------------------------------------------
// Kanban Columns API
// --------------------------------------------------------------------------

export interface CreateKanbanColumnRequest {
    name: string;
    description?: string;
    color: string;
    position?: number;
}

export interface UpdateKanbanColumnRequest {
    name?: string;
    description?: string;
    color?: string;
    position?: number;
}

class KanbanColumnsAPI extends BaseAPI {
    list(projectId: string): Promise<{ columns: import('@/src/api/project/config').KanbanColumn[] }> {
        return this.fetchGet(`/projects/${projectId}/kanban-columns`);
    }

    create(projectId: string, data: CreateKanbanColumnRequest): Promise<import('@/src/api/project/config').KanbanColumn> {
        return this.fetchPost(`/projects/${projectId}/kanban-columns`, data);
    }

    update(projectId: string, columnId: string, data: UpdateKanbanColumnRequest): Promise<import('@/src/api/project/config').KanbanColumn> {
        return this.fetchPut(`/projects/${projectId}/kanban-columns/${columnId}`, data);
    }

    delete(projectId: string, columnId: string): Promise<MessageResponse> {
        return this.fetchDelete(`/projects/${projectId}/kanban-columns/${columnId}`);
    }

    reorder(projectId: string, columnIds: string[]): Promise<{ columns: import('@/src/api/project/config').KanbanColumn[] }> {
        return this.fetchPut(`/projects/${projectId}/kanban-columns/reorder`, { column_ids: columnIds });
    }
}

// --------------------------------------------------------------------------
// Combined API Export
// --------------------------------------------------------------------------

class ProjectManagementAPI {
    readonly projects = new ProjectsAPI();
    readonly members = new ProjectMembersAPI();
    readonly milestones = new MilestonesAPI();
    readonly tasks = new TasksAPI();
    readonly comments = new CommentsAPI();
    readonly timeEntries = new TimeEntriesAPI();
    readonly users = new UsersAPI();
    readonly kanbanColumns = new KanbanColumnsAPI();
}

export const api = new ProjectManagementAPI();

export type {
    CreateProjectRequest,
    UpdateProjectRequest,
    CreateMilestoneRequest,
    UpdateMilestoneRequest,
    CreateTaskRequest,
    AddMemberRequest,
    ProjectResponse,
    ProjectListResponse,
    MemberResponse,
    MembersListResponse,
    MilestoneResponse,
    MilestonesListResponse,
    TaskResponse,
    TasksListResponse,
    CommentResponse,
    CommentsListResponse,
    TimeEntryResponse,
    TimeEntriesListResponse,
    DashboardResponse,
    KanbanResponse,
    BulkUpdateResponse,
    MessageResponse,
};

// Milestone Status Types
export type MilestoneStatus = 'planned' | 'active' | 'achieved' | 'blocked';

// Milestone Progress Statistics
export interface MilestoneProgress {
    required_total: number;
    required_completed: number;
    optional_total: number;
    optional_completed: number;
    percent_complete: number;
}

// Full Milestone Model with Enhanced Fields
export interface Milestone {
    id: string;
    project_id: string;
    name: string;
    description?: string;
    outcome_description?: string; // "Done means..." description
    status: MilestoneStatus;
    blocked_reason?: string;
    due_date?: string; // target_date on backend, kept as due_date for compatibility
    achieved_at?: string;
    completed_at?: string; // Legacy, use achieved_at
    sort_order: number;
    created_at: string;
    updated_at: string;
    total_tasks: number;
    completed_tasks: number;

    // Computed fields (may be populated by separate API calls)
    progress?: MilestoneProgress;
    dependencies?: MilestoneDependency[];
    dependents?: MilestoneDependency[];
}

// Milestone Dependency
export interface MilestoneDependency {
    id: string;
    milestone_id: string;
    depends_on_milestone_id: string;
    created_at: string;

    // Populated when fetching with full milestone info
    depends_on_milestone?: Milestone;
}

// Request Types
export interface CreateMilestoneRequest {
    name: string;
    description?: string;
    outcome_description?: string;
    due_date?: string;
}

export interface UpdateMilestoneRequest {
    name?: string;
    description?: string;
    outcome_description?: string;
    due_date?: string;
    sort_order?: number;
}

export interface AddMilestoneDependencyRequest {
    depends_on_milestone_id: string;
}

export interface OverrideMilestoneStatusRequest {
    status: MilestoneStatus;
    reason: string;
}

// Response Types
export interface MilestoneResponse {
    milestone?: Milestone;
    error?: string;
}

export interface MilestonesListResponse {
    milestones?: Milestone[];
    error?: string;
}

export interface MilestoneProgressResponse {
    progress?: MilestoneProgress;
    error?: string;
}

export interface MilestoneDependenciesResponse {
    dependencies?: Milestone[];
    error?: string;
}

export interface MilestoneDependentsResponse {
    dependents?: Milestone[];
    error?: string;
}

export interface DependencyGraphResponse {
    graph?: Record<string, string[]>;
    error?: string;
}

// Helper functions
export function getMilestoneStatusColor(status: MilestoneStatus): string {
    switch (status) {
        case 'planned': return 'gray';
        case 'active': return 'blue';
        case 'achieved': return 'green';
        case 'blocked': return 'red';
        default: return 'gray';
    }
}

export function getMilestoneStatusLabel(status: MilestoneStatus): string {
    switch (status) {
        case 'planned': return 'Planned';
        case 'active': return 'Active';
        case 'achieved': return 'Achieved';
        case 'blocked': return 'Blocked';
        default: return status;
    }
}

export function isOverdue(milestone: Milestone): boolean {
    if (!milestone.due_date || milestone.status === 'achieved') {
        return false;
    }
    return new Date(milestone.due_date) < new Date();
}

export function getProgressPercentage(milestone: Milestone): number {
    if (milestone.progress) {
        return milestone.progress.percent_complete;
    }
    if (milestone.total_tasks === 0) {
        return 0;
    }
    return (milestone.completed_tasks / milestone.total_tasks) * 100;
}

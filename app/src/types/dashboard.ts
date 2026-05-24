export interface DashboardClient {
    id: string;
    name: string;
    logo?: string;
    primary_email?: string;
    primary_phone?: string;
    address?: string;
    notes?: string;
    total_projects?: number;
    total_members?: number;
    created_at?: string;
}

export interface DashboardProject {
    id: string;
    name: string;
    client_id: string;
    status?: string;
    description?: string;
    created_at?: string;
}

export interface DashboardProjectDetail extends DashboardProject {
    priority?: string;
    start_date?: string;
    due_date?: string;
    budget_cents?: number;
    currency?: string;
}

export interface DashboardDeploymentConfig {
    id: string;
    project_id: string;
    name: string;
    slug: string;
    description: string;
    target_slug: string;
    target_name: string;
    target_icon_url: string;
    github_repo_owner: string;
    github_repo_name: string;
    github_branch: string;
    github_base_directory: string;
    build_command: string;
    output_directory: string;
    install_command: string;
    node_version: string;
    environment: string;
    auto_deploy_enabled: boolean;
    auto_deploy_branches: string[];
    is_active: boolean;
    last_deployed_at: string;
    created_at: string;
    cloudflare_project_name: string;
    cloudflare_account_id: string;
    vercel_project_id: string;
    vercel_team_id: string;
    // Cloud Run
    cloud_run_config_mode: string;
    cloud_run_project_id: string;
    cloud_run_region: string;
    cloud_run_service_name: string;
    cloud_run_ar_repo: string;
    cloud_run_dockerfile_path: string;
    cloud_run_port: number;
    cloud_run_cpu: string;
    cloud_run_memory: string;
    cloud_run_min_instances: number;
    cloud_run_max_instances: number;
}

export interface DashboardDeploymentRun {
    id: string;
    config_id: string;
    config_name: string;
    project_id: string;
    status: string;
    trigger_type: string;
    git_ref: string;
    git_sha: string;
    git_message: string;
    git_author: string;
    provider_url: string;
    queued_at: string;
    started_at: string;
    finished_at: string;
    duration_seconds: number;
    triggered_by_name: string;
    error_message: string;
}

export interface DashboardDeploymentLog {
    id: number;
    timestamp: string;
    level: string;
    phase: string;
    message: string;
}

export interface DashboardMember {
    user_id: string;
    name?: string;
    username?: string;
    email?: string;
    role: string;
    avatar_url?: string;
    joined_at?: string;
}

export interface DashboardTask {
    id: string;
    title: string;
    status?: string;
    priority?: string;
    due_date?: string;
    assignee_name?: string;
    updated_at?: string;
}

export interface DashboardMilestone {
    id: string;
    title: string;
    due_date?: string;
    status: string;
}

export interface DashboardProjectStats {
    total_tasks?: number;
    open_tasks?: number;
    in_progress_tasks?: number;
    review_tasks?: number;
    completed_tasks?: number;
    blocked_tasks?: number;
    total_estimated_hours?: number;
    total_actual_hours?: number;
    upcoming_milestones: DashboardMilestone[];
    overdue_tasks: DashboardTask[];
    recently_updated: DashboardTask[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const toOptionalString = (value: unknown): string | undefined =>
    typeof value === 'string' ? value : undefined;

const toOptionalNumber = (value: unknown): number | undefined =>
    typeof value === 'number' ? value : undefined;

export const toDashboardClient = (value: unknown): DashboardClient | undefined => {
    if (!isRecord(value)) {
        return undefined;
    }

    const id = toOptionalString(value.id);
    const name = toOptionalString(value.name);
    if (!id || !name) {
        return undefined;
    }

    return {
        id,
        name,
        logo: toOptionalString(value.logo),
        primary_email: toOptionalString(value.primary_email),
        primary_phone: toOptionalString(value.primary_phone),
        address: toOptionalString(value.address),
        notes: toOptionalString(value.notes),
        total_projects: toOptionalNumber(value.total_projects),
        total_members: toOptionalNumber(value.total_members),
        created_at: toOptionalString(value.created_at),
    };
};

export const toDashboardProjects = (value: unknown): DashboardProject[] => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.flatMap((item) => {
        if (!isRecord(item)) {
            return [];
        }

        const id = toOptionalString(item.id);
        const name = toOptionalString(item.name);
        const clientId = toOptionalString(item.client_id);

        if (!id || !name || !clientId) {
            return [];
        }

        return [{
            id,
            name,
            client_id: clientId,
            status: toOptionalString(item.status),
            description: toOptionalString(item.description),
            created_at: toOptionalString(item.created_at),
        }];
    });
};

export const toDashboardProjectDetail = (value: unknown): DashboardProjectDetail | undefined => {
    if (!isRecord(value)) {
        return undefined;
    }

    const id = toOptionalString(value.id);
    const name = toOptionalString(value.name);
    const clientId = toOptionalString(value.client_id);

    if (!id || !name) {
        return undefined;
    }

    return {
        id,
        name,
        client_id: clientId || '',
        status: toOptionalString(value.status),
        description: toOptionalString(value.description),
        created_at: toOptionalString(value.created_at),
        priority: toOptionalString(value.priority),
        start_date: toOptionalString(value.start_date),
        due_date: toOptionalString(value.due_date),
        budget_cents: toOptionalNumber(value.budget_cents),
        currency: toOptionalString(value.currency),
    };
};

const toStringArray = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

export const toDashboardDeploymentConfigs = (value: unknown): DashboardDeploymentConfig[] => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.flatMap((item) => {
        if (!isRecord(item)) {
            return [];
        }

        const id = toOptionalString(item.id);
        if (!id) {
            return [];
        }

        return [{
            id,
            project_id: toOptionalString(item.project_id) || '',
            name: toOptionalString(item.name) || '',
            slug: toOptionalString(item.slug) || '',
            description: toOptionalString(item.description) || '',
            target_slug: toOptionalString(item.target_slug) || '',
            target_name: toOptionalString(item.target_name) || '',
            target_icon_url: toOptionalString(item.target_icon_url) || '',
            github_repo_owner: toOptionalString(item.github_repo_owner) || '',
            github_repo_name: toOptionalString(item.github_repo_name) || '',
            github_branch: toOptionalString(item.github_branch) || '',
            github_base_directory: toOptionalString(item.github_base_directory) || '',
            build_command: toOptionalString(item.build_command) || '',
            output_directory: toOptionalString(item.output_directory) || '',
            install_command: toOptionalString(item.install_command) || '',
            node_version: toOptionalString(item.node_version) || '',
            environment: toOptionalString(item.environment) || '',
            auto_deploy_enabled: typeof item.auto_deploy_enabled === 'boolean' ? item.auto_deploy_enabled : false,
            auto_deploy_branches: toStringArray(item.auto_deploy_branches),
            is_active: typeof item.is_active === 'boolean' ? item.is_active : false,
            last_deployed_at: toOptionalString(item.last_deployed_at) || '',
            created_at: toOptionalString(item.created_at) || '',
            cloudflare_project_name: toOptionalString(item.cloudflare_project_name) || '',
            cloudflare_account_id: toOptionalString(item.cloudflare_account_id) || '',
            vercel_project_id: toOptionalString(item.vercel_project_id) || '',
            vercel_team_id: toOptionalString(item.vercel_team_id) || '',
            // Cloud Run
            cloud_run_config_mode: toOptionalString(item.cloud_run_config_mode) || '',
            cloud_run_project_id: toOptionalString(item.cloud_run_project_id) || '',
            cloud_run_region: toOptionalString(item.cloud_run_region) || '',
            cloud_run_service_name: toOptionalString(item.cloud_run_service_name) || '',
            cloud_run_ar_repo: toOptionalString(item.cloud_run_ar_repo) || '',
            cloud_run_dockerfile_path: toOptionalString(item.cloud_run_dockerfile_path) || '',
            cloud_run_port: toOptionalNumber(item.cloud_run_port) || 0,
            cloud_run_cpu: toOptionalString(item.cloud_run_cpu) || '',
            cloud_run_memory: toOptionalString(item.cloud_run_memory) || '',
            cloud_run_min_instances: toOptionalNumber(item.cloud_run_min_instances) || 0,
            cloud_run_max_instances: toOptionalNumber(item.cloud_run_max_instances) || 0,
        }];
    });
};

export const toDashboardDeploymentRuns = (value: unknown): DashboardDeploymentRun[] => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.flatMap((item) => {
        if (!isRecord(item)) {
            return [];
        }

        const id = toOptionalString(item.id);
        if (!id) {
            return [];
        }

        return [{
            id,
            config_id: toOptionalString(item.config_id) || '',
            config_name: toOptionalString(item.config_name) || '',
            project_id: toOptionalString(item.project_id) || '',
            status: toOptionalString(item.status) || 'queued',
            trigger_type: toOptionalString(item.trigger_type) || '',
            git_ref: toOptionalString(item.git_ref) || '',
            git_sha: toOptionalString(item.git_sha) || '',
            git_message: toOptionalString(item.git_message) || '',
            git_author: toOptionalString(item.git_author) || '',
            provider_url: toOptionalString(item.provider_url) || '',
            queued_at: toOptionalString(item.queued_at) || '',
            started_at: toOptionalString(item.started_at) || '',
            finished_at: toOptionalString(item.finished_at) || '',
            duration_seconds: toOptionalNumber(item.duration_seconds) || 0,
            triggered_by_name: toOptionalString(item.triggered_by_name) || '',
            error_message: toOptionalString(item.error_message) || '',
        }];
    });
};

export const toDashboardDeploymentLogs = (value: unknown): DashboardDeploymentLog[] => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.flatMap((item) => {
        if (!isRecord(item)) {
            return [];
        }

        const id = typeof item.id === 'number' ? item.id : undefined;
        if (id === undefined) {
            return [];
        }

        return [{
            id,
            timestamp: toOptionalString(item.timestamp) || '',
            level: toOptionalString(item.level) || '',
            phase: toOptionalString(item.phase) || '',
            message: toOptionalString(item.message) || '',
        }];
    });
};

export const toDashboardMembers = (value: unknown): DashboardMember[] => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.flatMap((item) => {
        if (!isRecord(item)) {
            return [];
        }

        const userId = toOptionalString(item.user_id);
        const role = toOptionalString(item.role);
        if (!userId || !role) {
            return [];
        }

        return [{
            user_id: userId,
            role,
            name: toOptionalString(item.name),
            username: toOptionalString(item.username),
            email: toOptionalString(item.email),
            avatar_url: toOptionalString(item.avatar_url),
            joined_at: toOptionalString(item.joined_at),
        }];
    });
};

export const toDashboardTasks = (value: unknown): DashboardTask[] => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.flatMap((item) => {
        if (!isRecord(item)) {
            return [];
        }

        const id = toOptionalString(item.id);
        const title = toOptionalString(item.title);
        if (!id || !title) {
            return [];
        }

        return [{
            id,
            title,
            status: toOptionalString(item.status),
            priority: toOptionalString(item.priority),
            due_date: toOptionalString(item.due_date),
            assignee_name: toOptionalString(item.assignee_name),
            updated_at: toOptionalString(item.updated_at),
        }];
    });
};

export const toDashboardMilestones = (value: unknown): DashboardMilestone[] => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.flatMap((item) => {
        if (!isRecord(item)) {
            return [];
        }

        const id = toOptionalString(item.id);
        const title = toOptionalString(item.title);
        const status = toOptionalString(item.status);
        if (!id || !title || !status) {
            return [];
        }

        return [{
            id,
            title,
            status,
            due_date: toOptionalString(item.due_date),
        }];
    });
};

export const toDashboardProjectStats = (value: unknown): DashboardProjectStats => {
    const empty: DashboardProjectStats = {
        upcoming_milestones: [],
        overdue_tasks: [],
        recently_updated: [],
    };

    if (!isRecord(value)) {
        return empty;
    }

    return {
        total_tasks: toOptionalNumber(value.total_tasks),
        open_tasks: toOptionalNumber(value.open_tasks),
        in_progress_tasks: toOptionalNumber(value.in_progress_tasks),
        review_tasks: toOptionalNumber(value.review_tasks),
        completed_tasks: toOptionalNumber(value.completed_tasks),
        blocked_tasks: toOptionalNumber(value.blocked_tasks),
        total_estimated_hours: toOptionalNumber(value.total_estimated_hours),
        total_actual_hours: toOptionalNumber(value.total_actual_hours),
        upcoming_milestones: toDashboardMilestones(value.upcoming_milestones),
        overdue_tasks: toDashboardTasks(value.overdue_tasks),
        recently_updated: toDashboardTasks(value.recently_updated),
    };
};
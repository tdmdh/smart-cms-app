

export interface DeploymentTargetItem {
    id: string;
    slug: string;
    name: string;
    provider: string;
    icon_url: string;
}

export interface DeploymentConfigItem {
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
    // Provider-specific (read-only)
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

export interface EnvVarItem {
    id: string;
    key: string;
    value: string; // Masked for secrets
    is_secret: boolean;
    environments: string[];
}

export interface DeploymentItem {
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

export interface DeploymentLogItem {
    id: number;
    timestamp: string;
    level: string;
    phase: string;
    message: string;
}

export interface VercelProjectItem {
    id: string;
    name: string;
    team_id?: string;
    team_name?: string;
    repo?: string;
    production_branch?: string;
    framework?: string;
}

export interface VercelTeamItem {
    id: string;
    slug?: string;
    name: string;
}

// Responses
export interface ListTargetsResponse {
    success: boolean;
    targets: DeploymentTargetItem[];
    error?: string;
}

export interface ConfigResponse {
    success: boolean;
    config: DeploymentConfigItem;
    error?: string;
}

export interface ListConfigsResponse {
    success: boolean;
    configs: DeploymentConfigItem[];
    error?: string;
}

export interface EnvVarResponse {
    success: boolean;
    error?: string;
}

export interface ListEnvVarsResponse {
    success: boolean;
    env_vars: EnvVarItem[];
    error?: string;
}

export interface DeploymentResponse {
    success: boolean;
    deployment: DeploymentItem;
    error?: string;
}

export interface ListDeploymentsResponse {
    success: boolean;
    deployments: DeploymentItem[];
    total: number;
    page: number;
    page_size: number;
    error?: string;
}

export interface DeploymentLogsResponse {
    success: boolean;
    logs: DeploymentLogItem[];
    error?: string;
}

export interface ListVercelProjectsResponse {
    projects: VercelProjectItem[];
    error?: string;
}

export interface ListVercelTeamsResponse {
    teams: VercelTeamItem[];
    error?: string;
}

export interface VercelProjectResponse {
    project: VercelProjectItem;
    error?: string;
}

export interface DeleteResponse {
    success: boolean;
    error?: string;
}

// Requests
export interface CreateDeploymentConfigRequest {
    project_id: string;
    name: string;
    description?: string;
    target_slug: string;
    github_repo_owner?: string;
    github_repo_name?: string;
    github_branch?: string;
    github_base_directory?: string;
    build_command?: string;
    output_directory?: string;
    install_command?: string;
    node_version?: string;
    environment?: string;
    auto_deploy_enabled?: boolean;
    auto_deploy_branches?: string[];
    // Cloud Run
    cloud_run_config_mode?: string;
    cloud_run_project_id?: string;
    cloud_run_region?: string;
    cloud_run_service_name?: string;
    cloud_run_ar_repo?: string;
    cloud_run_dockerfile_path?: string;
    cloud_run_port?: number;
    cloud_run_cpu?: string;
    cloud_run_memory?: string;
    cloud_run_min_instances?: number;
    cloud_run_max_instances?: number;
}

export interface UpdateConfigRequest {
    name?: string;
    description?: string;
    github_branch?: string;
    github_base_directory?: string;
    build_command?: string;
    output_directory?: string;
    install_command?: string;
    node_version?: string;
    environment?: string;
    auto_deploy_enabled?: boolean;
    auto_deploy_branches?: string[];
    is_active?: boolean;
    // Cloud Run
    cloud_run_config_mode?: string;
    cloud_run_project_id?: string;
    cloud_run_region?: string;
    cloud_run_service_name?: string;
    cloud_run_ar_repo?: string;
    cloud_run_dockerfile_path?: string;
    cloud_run_port?: number;
    cloud_run_cpu?: string;
    cloud_run_memory?: string;
    cloud_run_min_instances?: number;
    cloud_run_max_instances?: number;
}

export interface SetEnvVarRequest {
    key: string;
    value: string;
    is_secret?: boolean;
    environments?: string[]; // e.g. ["production", "preview"]
}

export interface TriggerDeploymentRequest {
    git_ref?: string;
}

export interface CreateVercelProjectRequest {
    name?: string;
    team_id?: string;
}

export interface SelectVercelProjectRequest {
    project_id: string;
    team_id?: string;
}

// ── GCP / Cloud Run types ────────────────────────────────────────────────────

export interface GCPProjectItem {
    project_id: string;
    name: string;
    project_number: string;
    state: string;
}

export interface CloudRunServiceItem {
    name: string;
    uri: string;
    create_time: string;
    update_time: string;
}

export interface ListGCPProjectsResponse {
    projects: GCPProjectItem[];
    error?: string;
}

export interface ListCloudRunServicesResponse {
    services: CloudRunServiceItem[];
    error?: string;
}


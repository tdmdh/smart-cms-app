
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    api,
} from './config';
import type {
    CreateDeploymentConfigRequest,
    UpdateConfigRequest,
    SetEnvVarRequest,
    TriggerDeploymentRequest,
    CreateVercelProjectRequest,
    SelectVercelProjectRequest,
} from '@/src/api/deployments/config';

export const deploymentsKeys = {
    all: ['deployments'] as const,
    targets: () => [...deploymentsKeys.all, 'targets'] as const,
    configs: {
        all: () => [...deploymentsKeys.all, 'configs'] as const,
        list: (projectId: string) => [...deploymentsKeys.configs.all(), 'list', projectId] as const,
        detail: (configId: string) => [...deploymentsKeys.configs.all(), 'detail', configId] as const,
        envVars: (configId: string) => [...deploymentsKeys.configs.detail(configId), 'envVars'] as const,
    },
    runs: {
        all: () => [...deploymentsKeys.all, 'runs'] as const,
        list: (projectId: string, params?: { page?: number; page_size?: number }) => [...deploymentsKeys.runs.all(), 'list', projectId, params] as const,
        detail: (deploymentId: string) => [...deploymentsKeys.runs.all(), 'detail', deploymentId] as const,
        logs: (deploymentId: string) => [...deploymentsKeys.runs.detail(deploymentId), 'logs'] as const,
    },
    vercel: {
        teams: (configId: string) => [...deploymentsKeys.configs.detail(configId), 'vercel-teams'] as const,
        projects: (configId: string, teamId?: string) => [...deploymentsKeys.configs.detail(configId), 'vercel-projects', teamId || 'all'] as const,
    }
};

// --------------------------------------------------------------------------
// Targets
// --------------------------------------------------------------------------

export function useDeploymentTargets() {
    return useQuery({
        queryKey: deploymentsKeys.targets(),
        queryFn: () => api.listTargets(),
    });
}

// --------------------------------------------------------------------------
// Configs
// --------------------------------------------------------------------------

export function useDeploymentConfigs(projectId: string) {
    return useQuery({
        queryKey: deploymentsKeys.configs.list(projectId),
        queryFn: () => api.listConfigs(projectId),
        enabled: !!projectId,
    });
}

export function useDeploymentConfig(configId: string) {
    return useQuery({
        queryKey: deploymentsKeys.configs.detail(configId),
        queryFn: () => api.getConfig(configId),
        enabled: !!configId,
    });
}

export function useCreateDeploymentConfig() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateDeploymentConfigRequest) => api.createConfig(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: deploymentsKeys.configs.list(variables.project_id) });
        },
    });
}

export function useUpdateDeploymentConfig() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ configId, data }: { configId: string; data: UpdateConfigRequest }) =>
            api.updateConfig(configId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: deploymentsKeys.configs.detail(variables.configId) });
            queryClient.invalidateQueries({ queryKey: deploymentsKeys.configs.all() });
        },
    });
}

export function useDeleteDeploymentConfig() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ configId, deleteFromProvider }: { configId: string; deleteFromProvider: boolean }) =>
            api.deleteConfig(configId, deleteFromProvider),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: deploymentsKeys.configs.all() });
        },
    });
}

// --------------------------------------------------------------------------
// Env Vars
// --------------------------------------------------------------------------

export function useDeploymentEnvVars(configId: string) {
    return useQuery({
        queryKey: deploymentsKeys.configs.envVars(configId),
        queryFn: () => api.listEnvVars(configId),
        enabled: !!configId,
    });
}

export function useSetEnvVar() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ configId, data }: { configId: string; data: SetEnvVarRequest }) =>
            api.setEnvVar(configId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: deploymentsKeys.configs.envVars(variables.configId) });
        },
    });
}

export function useDeleteEnvVar() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ configId, envVarId }: { configId: string; envVarId: string }) =>
            api.deleteEnvVar(configId, envVarId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: deploymentsKeys.configs.envVars(variables.configId) });
        },
    });
}

// --------------------------------------------------------------------------
// Deployments & Logs
// --------------------------------------------------------------------------

export function useDeployments(projectId: string, params?: { page?: number; page_size?: number }) {
    return useQuery({
        queryKey: deploymentsKeys.runs.list(projectId, params),
        queryFn: () => api.listDeployments(projectId, params),
        enabled: !!projectId,
    });
}

export function useDeployment(deploymentId: string) {
    return useQuery({
        queryKey: deploymentsKeys.runs.detail(deploymentId),
        queryFn: () => api.getDeployment(deploymentId),
        enabled: !!deploymentId,
        refetchInterval: (query) => {
            const status = query.state.data?.deployment?.status;
            if (status && ['queued', 'cloning', 'building', 'deploying'].includes(status.toLowerCase())) {
                return 3000; // Poll every 3s if active
            }
            return false;
        }
    });
}

export function useDeploymentLogs(deploymentId: string, deploymentStatus?: string, enabled: boolean = true) {
    return useQuery({
        queryKey: deploymentsKeys.runs.logs(deploymentId),
        queryFn: () => api.getDeploymentLogs(deploymentId),
        enabled: !!deploymentId && enabled,
        refetchInterval: () => {
            const isActive = deploymentStatus && ['queued', 'cloning', 'building', 'deploying'].includes(deploymentStatus.toLowerCase());
            return isActive ? 3000 : false;
        }
    });
}

export function useTriggerDeployment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ configId, data }: { configId: string; data: TriggerDeploymentRequest }) =>
            api.triggerDeployment(configId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: deploymentsKeys.runs.all() });
        },
    });
}

export function useCancelDeployment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (deploymentId: string) => api.cancelDeployment(deploymentId),
        onSuccess: (_, deploymentId) => {
            queryClient.invalidateQueries({ queryKey: deploymentsKeys.runs.detail(deploymentId) });
            queryClient.invalidateQueries({ queryKey: deploymentsKeys.runs.all() });
        },
    });
}

export function useRollbackDeployment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (deploymentId: string) => api.rollbackDeployment(deploymentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: deploymentsKeys.runs.all() });
        },
    });
}

export function useVercelProjects(configId: string, teamId?: string) {
    return useQuery({
        queryKey: deploymentsKeys.vercel.projects(configId, teamId),
        queryFn: () => api.listVercelProjects(configId, teamId),
        enabled: !!configId,
    });
}

export function useVercelTeams(configId: string) {
    return useQuery({
        queryKey: deploymentsKeys.vercel.teams(configId),
        queryFn: () => api.listVercelTeams(configId),
        enabled: !!configId,
    });
}

export function useCreateVercelProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ configId, data }: { configId: string; data: CreateVercelProjectRequest }) =>
            api.createVercelProject(configId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: deploymentsKeys.vercel.projects(variables.configId) });
            queryClient.invalidateQueries({ queryKey: deploymentsKeys.configs.detail(variables.configId) });
            queryClient.invalidateQueries({ queryKey: deploymentsKeys.configs.all() });
        },
    });
}

export function useSelectVercelProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ configId, data }: { configId: string; data: SelectVercelProjectRequest }) =>
            api.selectVercelProject(configId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: deploymentsKeys.configs.detail(variables.configId) });
            queryClient.invalidateQueries({ queryKey: deploymentsKeys.configs.all() });
        },
    });
}

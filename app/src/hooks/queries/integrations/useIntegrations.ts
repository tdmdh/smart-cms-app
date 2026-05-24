import {
    useQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import {
    integrationsApi,
    type BeginConnectRequest,
    type GitHubRepo,
    type GitHubBranch,
    type GitHubTreeEntry,
    type GCPProject,
} from "./config";

// ============================================================================
// Query Keys
// ============================================================================

export const integrationsKeys = {
    all: ["integrations"] as const,
    providers: () => [...integrationsKeys.all, "providers"] as const,
    connections: () => [...integrationsKeys.all, "connections"] as const,
    connectionsList: (filters?: { organizationId?: string }) =>
        [...integrationsKeys.connections(), filters] as const,
    githubRepos: () => [...integrationsKeys.all, "github", "repos"] as const,
    githubBranches: (owner: string, repo: string) =>
        [...integrationsKeys.all, "github", "branches", owner, repo] as const,
    githubTree: (owner: string, repo: string, ref: string, path: string) =>
        [...integrationsKeys.all, "github", "tree", owner, repo, ref, path] as const,
    gcpProjects: () => [...integrationsKeys.all, "gcp", "projects"] as const,
    cloudRunServices: (projectId: string, region: string) =>
        [...integrationsKeys.all, "gcp", "services", projectId, region] as const,
};

// ============================================================================
// Queries
// ============================================================================

export function useProviders() {
    return useQuery({
        queryKey: integrationsKeys.providers(),
        queryFn: () => integrationsApi.listProviders(),
        staleTime: 15 * 60 * 1000,
    });
}

export function useConnections(organizationId?: string) {
    return useQuery({
        queryKey: integrationsKeys.connectionsList({ organizationId }),
        queryFn: () => integrationsApi.listConnections(organizationId),
        staleTime: 2 * 60 * 1000,
    });
}

export function useGitHubRepos(enabled = true) {
    return useQuery({
        queryKey: integrationsKeys.githubRepos(),
        queryFn: () => integrationsApi.listGitHubRepos(),
        enabled,
        staleTime: 2 * 60 * 1000,
    });
}

export function useGitHubBranches(owner: string, repo: string) {
    return useQuery({
        queryKey: integrationsKeys.githubBranches(owner, repo),
        queryFn: () => integrationsApi.listGitHubBranches(owner, repo),
        enabled: !!owner && !!repo,
        staleTime: 60 * 1000,
    });
}

export function useGitHubTree(owner: string, repo: string, ref: string, path: string, enabled = true) {
    return useQuery({
        queryKey: integrationsKeys.githubTree(owner, repo, ref, path),
        queryFn: () => integrationsApi.listGitHubTree(owner, repo, ref, path),
        enabled: enabled && !!owner && !!repo && !!ref,
        staleTime: 60 * 1000,
    });
}

// ============================================================================
// Mutations
// ============================================================================

export function useBeginConnect() {
    return useMutation({
        mutationFn: ({
            provider,
            data,
        }: {
            provider: string;
            data: BeginConnectRequest;
        }) => integrationsApi.beginConnect(provider, data),
    });
}

export function useHandleCallback() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            provider,
            state,
            code,
        }: {
            provider: string;
            state: string;
            code: string;
        }) => integrationsApi.handleCallback(provider, state, code),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: integrationsKeys.connections(),
            });
        },
    });
}

export function useDisconnect() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (connectionId: string) =>
            integrationsApi.disconnect(connectionId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: integrationsKeys.connections(),
            });
        },
    });
}

export function useGCPProjects(enabled = true) {
    return useQuery({
        queryKey: integrationsKeys.gcpProjects(),
        queryFn: () => integrationsApi.listGCPProjects(),
        enabled,
        staleTime: 2 * 60 * 1000,
    });
}

export function useCloudRunServices(projectId: string, region: string) {
    return useQuery({
        queryKey: integrationsKeys.cloudRunServices(projectId, region),
        queryFn: () => integrationsApi.listCloudRunServices(projectId, region),
        enabled: !!projectId && !!region,
        staleTime: 60 * 1000,
    });
}

export type { GitHubRepo, GitHubBranch, GitHubTreeEntry, GCPProject };

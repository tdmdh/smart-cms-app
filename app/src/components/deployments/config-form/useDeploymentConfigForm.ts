import { useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { closeAllViews, selectSidebarViewData } from '@/src/store/slices/layoutSlice';
import { useToast } from '@/src/components/shared/ui';
import {
    useCreateDeploymentConfig,
    useDeploymentTargets,
    useUpdateDeploymentConfig,
    useSetEnvVar,
    useTriggerDeployment,
} from '@/src/hooks/queries/deployments/useDeployments';
import {
    useBeginConnect,
    useConnections,
    useGitHubBranches,
    useGitHubRepos,
} from '@/src/hooks/queries/integrations/useIntegrations';
import type { GitHubRepo } from '@/src/hooks/queries/integrations/useIntegrations';
import { useOAuthPopup } from '@/src/hooks/queries/integrations/useOAuthPopup';
import type { CreateDeploymentConfigRequest, DeploymentConfigItem } from '@/src/api/deployments/config';
import { getProviderDef } from '../provider-configs/registry';
import { normalizeDirectoryPath } from './DirectoryTreeNode';
import type { PendingEnvVar } from './PendingEnvVarsEditor';

// ─── Initial form data ────────────────────────────────────────────────────────

function createInitialFormData(
    projectId: string,
    existing?: DeploymentConfigItem
): CreateDeploymentConfigRequest {
    if (!existing) {
        return {
            project_id: projectId,
            name: '',
            target_slug: '',
            github_repo_owner: '',
            github_repo_name: '',
            github_branch: 'main',
            github_base_directory: '/',
            build_command: 'npm run build',
            output_directory: 'dist',
            install_command: 'npm install',
            node_version: '18',
            auto_deploy_enabled: true,
            cloud_run_dockerfile_path: '',
        };
    }
    return {
        project_id: projectId,
        name: existing.name,
        target_slug: existing.target_slug,
        github_repo_owner: existing.github_repo_owner,
        github_repo_name: existing.github_repo_name,
        github_branch: existing.github_branch,
        github_base_directory: existing.github_base_directory || '/',
        build_command: existing.build_command,
        output_directory: existing.output_directory,
        install_command: existing.install_command,
        node_version: existing.node_version,
        auto_deploy_enabled: existing.auto_deploy_enabled,
        cloud_run_config_mode: existing.cloud_run_config_mode,
        cloud_run_project_id: existing.cloud_run_project_id,
        cloud_run_region: existing.cloud_run_region,
        cloud_run_service_name: existing.cloud_run_service_name,
        cloud_run_ar_repo: existing.cloud_run_ar_repo,
        cloud_run_dockerfile_path: existing.cloud_run_dockerfile_path,
        cloud_run_port: existing.cloud_run_port,
        cloud_run_cpu: existing.cloud_run_cpu,
        cloud_run_memory: existing.cloud_run_memory,
        cloud_run_min_instances: existing.cloud_run_min_instances,
        cloud_run_max_instances: existing.cloud_run_max_instances,
    };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface Options {
    projectId?: string;
    existingConfig?: DeploymentConfigItem;
    onSuccess?: () => void;
    onClose?: () => void;
}

export function useDeploymentConfigForm({
    projectId: propProjectId,
    existingConfig: propExistingConfig,
    onSuccess,
    onClose,
}: Options) {
    const dispatch = useAppDispatch();
    const toast = useToast();

    const sidebarData = useAppSelector(selectSidebarViewData) as {
        projectId?: string;
        existingConfig?: DeploymentConfigItem;
    } | null;

    const resolvedProjectId = propProjectId ?? sidebarData?.projectId ?? '';
    const resolvedConfig = propExistingConfig ?? sidebarData?.existingConfig;

    // ── Queries & mutations ───────────────────────────────────────────────────
    const { data: targetsData, isLoading: isLoadingTargets } = useDeploymentTargets();
    const createMutation = useCreateDeploymentConfig();
    const updateMutation = useUpdateDeploymentConfig();
    const setEnvVarMutation = useSetEnvVar();
    const triggerMutation = useTriggerDeployment();
    const beginConnect = useBeginConnect();
    const { openPopup } = useOAuthPopup();

    const { data: connectionsData } = useConnections();
    const { data: reposData, isLoading: isLoadingRepos } = useGitHubRepos(
        !!connectionsData?.connections?.find(c => c.provider_slug === 'github' && c.status === 'active')
    );

    // ── Local state ───────────────────────────────────────────────────────────
    const [formData, setFormData] = useState<CreateDeploymentConfigRequest>(() =>
        createInitialFormData(resolvedProjectId, resolvedConfig)
    );
    const [pendingEnvVars, setPendingEnvVars] = useState<PendingEnvVar[]>([]);
    const [repoSearch, setRepoSearch] = useState('');
    const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
    const [isRepoModalOpen, setIsRepoModalOpen] = useState(false);
    const [isDirectoryModalOpen, setIsDirectoryModalOpen] = useState(false);
    const [directoryDraft, setDirectoryDraft] = useState(
        normalizeDirectoryPath(formData.github_base_directory || '/')
    );

    const { data: branchesData, isLoading: isLoadingBranches } = useGitHubBranches(
        selectedRepo?.full_name.split('/')[0] ?? '',
        selectedRepo?.full_name.split('/')[1] ?? ''
    );

    // ── Derived ───────────────────────────────────────────────────────────────
    const githubConnection = connectionsData?.connections?.find(
        c => c.provider_slug === 'github' && c.status === 'active'
    );
    const isGitHubConnected = !!githubConnection;
    const connectedAccountName = githubConnection?.external_account_name ?? '';

    const connectionMap = useMemo(() => {
        const map: Record<string, boolean> = {};
        for (const c of connectionsData?.connections ?? []) {
            if (c.status === 'active') map[c.provider_slug] = true;
        }
        return map;
    }, [connectionsData?.connections]);

    const filteredRepos = useMemo(() => {
        const list = reposData?.repos ?? [];
        if (!repoSearch.trim()) return list;
        const q = repoSearch.toLowerCase();
        return list.filter(r =>
            r.full_name.toLowerCase().includes(q) ||
            r.description?.toLowerCase().includes(q)
        );
    }, [reposData?.repos, repoSearch]);

    const effectiveTargetSlug =
        formData.target_slug || (!resolvedConfig ? (targetsData?.targets?.[0]?.slug ?? '') : '');
    const selectedTarget = targetsData?.targets?.find(t => t.slug === effectiveTargetSlug);
    const providerDef = getProviderDef(selectedTarget?.provider);
    const isProviderConnected = !providerDef.connectionSlug || !!connectionMap[providerDef.connectionSlug];
    const canBrowseRepositoryTree =
        !!formData.github_repo_owner && !!formData.github_repo_name && !!formData.github_branch;
    const isPending =
        createMutation.isPending ||
        updateMutation.isPending ||
        setEnvVarMutation.isPending ||
        triggerMutation.isPending;

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRepoSelect = (fullName: string) => {
        const repo = reposData?.repos?.find(r => r.full_name === fullName);
        if (!repo) return;
        const [owner, name] = repo.full_name.split('/');
        setSelectedRepo(repo);
        setFormData(prev => ({
            ...prev,
            github_repo_owner: owner,
            github_repo_name: name,
            github_branch: repo.default_branch || 'main',
            github_base_directory: '/',
        }));
        setDirectoryDraft('/');
    };

    const handleConnectGitHub = () => {
        const { navigate, abort } = openPopup({
            onSuccess: () => toast.success('GitHub connected successfully'),
            onError: (_, err) => toast.error(err),
        });
        beginConnect.mutate(
            {
                provider: 'github',
                data: { scopes: ['repo', 'read:org'], redirect_uri: `${window.location.origin}/integrations/callback/github` },
            },
            {
                onSuccess: data => { if (data.auth_url) navigate(data.auth_url); else abort(); },
                onError: err => { abort(); toast.error(err instanceof Error ? err.message : 'Failed to connect GitHub'); },
            }
        );
    };

    const handleConnectProvider = () => {
        const slug = providerDef.connectionSlug;
        if (!slug) return;
        const { navigate, abort } = openPopup({
            onSuccess: () => toast.success(`${slug} connected successfully`),
            onError: (_, err) => toast.error(err),
        });
        beginConnect.mutate(
            { provider: slug, data: { redirect_uri: `${window.location.origin}/integrations/callback/${slug}` } },
            {
                onSuccess: data => { if (data.auth_url) navigate(data.auth_url); else abort(); },
                onError: err => { abort(); toast.error(err instanceof Error ? err.message : `Failed to connect ${slug}`); },
            }
        );
    };

    const handleClose = () => {
        if (onClose) onClose();
        else dispatch(closeAllViews());
    };

    const handleSubmit = async (e: React.FormEvent, shouldDeploy = false) => {
        e.preventDefault();
        const normalizedBaseDirectory = normalizeDirectoryPath(formData.github_base_directory || '/');
        const targetSlug = effectiveTargetSlug;

        if (!resolvedConfig && !targetSlug) {
            toast.error('Select a deployment target');
            return;
        }

        if (resolvedConfig) {
            updateMutation.mutate(
                {
                    configId: resolvedConfig.id,
                    data: {
                        name: formData.name,
                        github_branch: formData.github_branch,
                        github_base_directory: normalizedBaseDirectory,
                        build_command: formData.build_command,
                        output_directory: formData.output_directory,
                        install_command: formData.install_command,
                        node_version: formData.node_version,
                        auto_deploy_enabled: formData.auto_deploy_enabled,
                        cloud_run_config_mode: formData.cloud_run_config_mode,
                        cloud_run_project_id: formData.cloud_run_project_id,
                        cloud_run_region: formData.cloud_run_region,
                        cloud_run_service_name: formData.cloud_run_service_name,
                        cloud_run_ar_repo: formData.cloud_run_ar_repo,
                        cloud_run_dockerfile_path: formData.cloud_run_dockerfile_path,
                        cloud_run_port: formData.cloud_run_port ? Number(formData.cloud_run_port) : undefined,
                        cloud_run_cpu: formData.cloud_run_cpu,
                        cloud_run_memory: formData.cloud_run_memory,
                        cloud_run_min_instances: formData.cloud_run_min_instances ? Number(formData.cloud_run_min_instances) : undefined,
                        cloud_run_max_instances: formData.cloud_run_max_instances ? Number(formData.cloud_run_max_instances) : undefined,
                    },
                },
                {
                    onSuccess: () => { toast.success('Configuration updated'); onSuccess?.(); handleClose(); },
                    onError: err => toast.error(err instanceof Error ? err.message : 'Failed to update configuration'),
                }
            );
        } else {
            try {
                const result = await createMutation.mutateAsync({
                    ...formData,
                    project_id: resolvedProjectId,
                    target_slug: targetSlug,
                    github_base_directory: normalizedBaseDirectory,
                });
                const newConfigId = result.config.id;

                const envErrors: string[] = [];
                for (const v of pendingEnvVars) {
                    try {
                        await setEnvVarMutation.mutateAsync({
                            configId: newConfigId,
                            data: { key: v.key, value: v.value, is_secret: v.is_secret, environments: v.environments },
                        });
                    } catch {
                        envErrors.push(v.key);
                    }
                }
                if (envErrors.length) toast.error(`Config created, but failed to set: ${envErrors.join(', ')}`);

                if (shouldDeploy) {
                    await triggerMutation.mutateAsync({ configId: newConfigId, data: {} });
                    toast.success('Configuration created and deployment triggered');
                } else {
                    toast.success('Configuration created');
                }
                onSuccess?.();
                handleClose();
            } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Failed to create configuration');
            }
        }
    };

    return {
        // Resolved
        resolvedProjectId,
        resolvedConfig,
        // Form state
        formData, setFormData,
        pendingEnvVars, setPendingEnvVars,
        // UI state
        repoSearch, setRepoSearch,
        selectedRepo,
        isRepoModalOpen, setIsRepoModalOpen,
        isDirectoryModalOpen, setIsDirectoryModalOpen,
        directoryDraft, setDirectoryDraft,
        // Query data
        targetsData, isLoadingTargets,
        reposData, isLoadingRepos,
        branchesData, isLoadingBranches,
        // Derived
        filteredRepos,
        effectiveTargetSlug,
        selectedTarget,
        providerDef,
        isProviderConnected,
        isGitHubConnected,
        connectedAccountName,
        canBrowseRepositoryTree,
        isPending,
        isConnectPending: beginConnect.isPending,
        createIsPending: createMutation.isPending,
        triggerIsPending: triggerMutation.isPending,
        // Handlers
        handleChange,
        handleSelectChange,
        handleRepoSelect,
        handleConnectGitHub,
        handleConnectProvider,
        handleClose,
        handleSubmit,
    };
}

'use client';

import { useMemo, useState } from 'react';
import {
    useDeployments,
    useDeploymentConfigs,
    useTriggerDeployment,
    useDeleteDeploymentConfig,
    useVercelTeams,
    useVercelProjects,
    useCreateVercelProject,
    useSelectVercelProject,
} from '@/src/hooks/queries/deployments/useDeployments';
import { useBeginConnect, useConnections } from '@/src/hooks/queries/integrations/useIntegrations';
import { useOAuthPopup } from '@/src/hooks/queries/integrations/useOAuthPopup';
import { DeploymentList } from '@/src/components/deployments/DeploymentList';
import {
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    EmptyState,
    Icon,
    Input,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    useToast,
} from '@/src/components/shared/ui';
import { toDashboardDeploymentConfigs, toDashboardDeploymentRuns } from '@/src/types/dashboard';
import DeploymentConfigFormView from '@/src/components/sidebar-views/DeploymentConfigFormView';
import type { DeploymentConfigItem } from '@/src/api/deployments/config';

interface ProjectDeploymentsPageProps {
    projectId: string;
}

export default function ProjectDeploymentsPage({ projectId }: ProjectDeploymentsPageProps) {
    const toast = useToast();

    const [showConfigForm, setShowConfigForm] = useState(false);
    const [editingConfig, setEditingConfig] = useState<DeploymentConfigItem | undefined>(undefined);

    const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteFromProvider, setDeleteFromProvider] = useState(true);
    const [selectedVercelProject, setSelectedVercelProject] = useState<string>('');
    const [showCreateVercelDialog, setShowCreateVercelDialog] = useState(false);
    const [newVercelProjectName, setNewVercelProjectName] = useState('');
    const [newVercelTeamSelection, setNewVercelTeamSelection] = useState('__personal__');
    const [vercelTeamFilterSelection, setVercelTeamFilterSelection] = useState('__all__');

    const { data: deploymentsData, isLoading: isLoadingDeployments, refetch: refetchDeployments } =
        useDeployments(projectId);
    const { data: configsData, isLoading: isLoadingConfigs, refetch: refetchConfigs } =
        useDeploymentConfigs(projectId);
    const { data: connectionsData } = useConnections();
    const triggerMutation = useTriggerDeployment();
    const deleteConfigMutation = useDeleteDeploymentConfig();
    const beginConnect = useBeginConnect();
    const { openPopup } = useOAuthPopup();
    const createVercelProjectMutation = useCreateVercelProject();
    const selectVercelProjectMutation = useSelectVercelProject();

    const configs = useMemo(
        () => toDashboardDeploymentConfigs(configsData?.configs),
        [configsData?.configs]
    );
    const deployments = useMemo(
        () => toDashboardDeploymentRuns(deploymentsData?.deployments),
        [deploymentsData?.deployments]
    );

    const config = useMemo(() => {
        if (configs.length === 0) return undefined;
        if (selectedConfigId) return configs.find((item) => item.id === selectedConfigId) ?? configs[0];
        return configs[0];
    }, [configs, selectedConfigId]);

    const hasConfig = !!config;
    const requiredProvider = useMemo(() => {
        const target = config?.target_slug?.toLowerCase() || '';
        if (target.includes('vercel')) return 'vercel';
        if (target.includes('cloudflare')) return 'cloudflare';
        return '';
    }, [config?.target_slug]);

    const hasProviderConnection = useMemo(() => {
        if (!requiredProvider) return true;
        const connections = connectionsData?.connections || [];
        return connections.some(
            (connection) => connection.provider_slug === requiredProvider && connection.status === 'active'
        );
    }, [connectionsData?.connections, requiredProvider]);

    const canDeployNow = hasConfig && hasProviderConnection;
    const isVercelConfig = requiredProvider === 'vercel' && !!config;

    const vercelFilterTeamId =
        vercelTeamFilterSelection === '__all__' || vercelTeamFilterSelection === '__personal__'
            ? undefined
            : vercelTeamFilterSelection;

    const { data: vercelTeamsData, isLoading: isLoadingVercelTeams } = useVercelTeams(
        isVercelConfig && hasProviderConnection ? config!.id : ''
    );

    const {
        data: vercelProjectsData,
        isLoading: isLoadingVercelProjects,
        refetch: refetchVercelProjects,
    } = useVercelProjects(
        isVercelConfig && hasProviderConnection ? config!.id : '',
        vercelFilterTeamId,
    );

    const vercelProjects = useMemo(
        () => vercelProjectsData?.projects || [],
        [vercelProjectsData?.projects]
    );
    const vercelTeams = useMemo(() => vercelTeamsData?.teams || [], [vercelTeamsData?.teams]);

    const getVercelOptionValue = (id: string, teamId?: string) => `${teamId || ''}::${id}`;

    const linkedVercelProjectValue =
        config?.vercel_project_id
            ? getVercelOptionValue(config.vercel_project_id, config.vercel_team_id)
            : '';
    const selectedVercelProjectValue = selectedVercelProject || linkedVercelProjectValue;

    const handleTrigger = () => {
        if (!config) return;

        triggerMutation.mutate(
            { configId: config.id, data: {} },
            {
                onSuccess: async () => {
                    toast.success('Deployment triggered');
                    await Promise.all([refetchDeployments(), refetchConfigs()]);
                },
                onError: (err) =>
                    toast.error(err instanceof Error ? err.message : 'Failed to trigger deployment'),
            }
        );
    };

    const handleConnectProvider = () => {
        if (!requiredProvider) return;

        const { navigate, abort } = openPopup({
            onSuccess: () => toast.success(`${requiredProvider} connected successfully`),
            onError: (_, err) => toast.error(err),
        });

        beginConnect.mutate(
            {
                provider: requiredProvider,
                data: {
                    redirect_uri: `${window.location.origin}/integrations/callback/${requiredProvider}`,
                },
            },
            {
                onSuccess: (data) => { if (data.auth_url) navigate(data.auth_url); else abort(); },
                onError: (err) => { abort(); toast.error(err instanceof Error ? err.message : `Failed to connect ${requiredProvider}`); },
            }
        );
    };

    const handleDeleteConfig = () => {
        if (!config) return;

        deleteConfigMutation.mutate(
            { configId: config.id, deleteFromProvider },
            {
                onSuccess: () => {
                    toast.success('Configuration deleted');
                    setShowDeleteDialog(false);
                    setSelectedConfigId(null);
                    setDeleteFromProvider(true);
                },
                onError: (err) => {
                    toast.error(err instanceof Error ? err.message : 'Failed to delete configuration');
                    setShowDeleteDialog(false);
                },
            }
        );
    };

    const openNewConfigForm = () => {
        setEditingConfig(undefined);
        setShowConfigForm(true);
    };

    const openEditConfigForm = () => {
        if (!config) return;
        setEditingConfig(config);
        setShowConfigForm(true);
    };

    const closeConfigForm = () => {
        setShowConfigForm(false);
        setEditingConfig(undefined);
    };

    const handleConfigFormSuccess = async () => {
        closeConfigForm();
        await Promise.all([refetchDeployments(), refetchConfigs()]);
    };

    const handleSelectVercelProject = () => {
        if (!config || !selectedVercelProjectValue) return;

        const [teamId, selectedProjectId] = selectedVercelProjectValue.split('::');
        if (!selectedProjectId) {
            toast.error('Please select a Vercel project');
            return;
        }

        selectVercelProjectMutation.mutate(
            {
                configId: config.id,
                data: {
                    project_id: selectedProjectId,
                    team_id: teamId || undefined,
                },
            },
            {
                onSuccess: async () => {
                    toast.success('Vercel project selected');
                    await Promise.all([refetchConfigs(), refetchVercelProjects()]);
                },
                onError: (err) => {
                    toast.error(err instanceof Error ? err.message : 'Failed to select Vercel project');
                },
            }
        );
    };

    const handleCreateVercelProject = () => {
        if (!config) return;

        const selectedTeamID = newVercelTeamSelection === '__personal__' ? undefined : newVercelTeamSelection;

        createVercelProjectMutation.mutate(
            {
                configId: config.id,
                data: {
                    name: newVercelProjectName.trim() || undefined,
                    team_id: selectedTeamID,
                },
            },
            {
                onSuccess: async (response) => {
                    const value = getVercelOptionValue(response.project.id, response.project.team_id);
                    setSelectedVercelProject(value);
                    setShowCreateVercelDialog(false);
                    setNewVercelProjectName('');
                    setNewVercelTeamSelection('__personal__');
                    toast.success('Vercel project created and linked');
                    await Promise.all([refetchConfigs(), refetchVercelProjects()]);
                },
                onError: (err) => {
                    toast.error(err instanceof Error ? err.message : 'Failed to create Vercel project');
                },
            }
        );
    };

    if (isLoadingConfigs) {
        return (
            <div className="flex items-center justify-center min-h-80">
                <div className="flex items-center gap-3 text-slate-500">
                    <Icon name="loader" size={18} className="animate-spin" />
                    <span className="text-sm">Loading configurations...</span>
                </div>
            </div>
        );
    }

    if (!hasConfig) {
        if (showConfigForm) {
            return (
                <DeploymentConfigFormView
                    projectId={projectId}
                    onClose={closeConfigForm}
                    onSuccess={handleConfigFormSuccess}
                />
            );
        }

        return (
            <EmptyState
                icon="cloud"
                title="No deployment configuration"
                description="Connect a GitHub repo and deploy your project to Vercel, Cloudflare, or any supported target."
                color="default"
                cta={{
                    label: 'New Deployment Config',
                    onClick: openNewConfigForm,
                }}
            />
        );
    }

    if (showConfigForm) {
        return (
            <DeploymentConfigFormView
                projectId={projectId}
                existingConfig={editingConfig}
                onClose={closeConfigForm}
                onSuccess={handleConfigFormSuccess}
            />
        );
    }

    return (
        <div className="deployments-page">
            <div className="project-team__header">
                <div className="project-team__header-left">
                    <Select
                        value={config?.id || ''}
                        onValueChange={(value) => {
                            setSelectedConfigId(value);
                            setSelectedVercelProject('');
                            setVercelTeamFilterSelection('__all__');
                            setNewVercelTeamSelection('__personal__');
                        }}
                    >
                        <SelectTrigger className="w-52 h-9 text-sm">
                            <SelectValue placeholder="Select config" />
                        </SelectTrigger>
                        <SelectContent>
                            {configs.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                    {item.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="project-team__stats">
                        {config && (
                            <span className="project-team__stat project-team__stat--default deployments-page__repo-pill">
                                <Icon name="git-branch" size={12} />
                                {config.github_repo_owner}/{config.github_repo_name} · {config.github_branch}
                            </span>
                        )}
                    </div>
                </div>

                <div className="project-team__header-actions">
                    <Button
                        variant="ghost"
                        size="xs"
                        onClick={openEditConfigForm}
                        leftIcon="settings"
                        iconSize={14}
                        title="Edit configuration"
                    >
                        Edit Config
                    </Button>
                    <Button
                        variant="ghost"
                        size="xs"
                        onClick={openNewConfigForm}
                        leftIcon="plus"
                        iconSize={14}
                        title="New configuration"
                    >
                        New Config
                    </Button>
                    <Button
                        variant="ghost"
                        size="xs"
                        iconOnly
                        leftIcon="rotate-ccw"
                        iconSize={14}
                        onClick={() => refetchDeployments()}
                        title="Refresh"
                    />
                    <Button
                        variant="primary"
                        size="xs"
                        onClick={handleTrigger}
                        disabled={triggerMutation.isPending || !canDeployNow}
                        loading={triggerMutation.isPending}
                        leftIcon="play"
                        iconSize={14}
                    >
                        Deploy Now
                    </Button>
                </div>
            </div>

            {!hasProviderConnection && requiredProvider && (
                <div className="deployments-page__provider-banner">
                    <span>
                        Connect your {requiredProvider} integration before triggering deployments for this configuration.
                    </span>
                    <Button
                        variant="secondary"
                        size="xs"
                        leftIcon="external-link"
                        loading={beginConnect.isPending}
                        disabled={beginConnect.isPending}
                        onClick={handleConnectProvider}
                    >
                        Connect {requiredProvider}
                    </Button>
                </div>
            )}

            {isVercelConfig && hasProviderConnection && (
                <div className="deployments-page__vercel-panel">
                    <Select
                        value={vercelTeamFilterSelection}
                        onValueChange={setVercelTeamFilterSelection}
                    >
                        <SelectTrigger className="w-[220px] h-9 text-sm" disabled={isLoadingVercelTeams}>
                            <SelectValue placeholder={isLoadingVercelTeams ? 'Loading teams...' : 'Filter by team'} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__all__">All scopes</SelectItem>
                            <SelectItem value="__personal__">Personal</SelectItem>
                            {vercelTeams.map((team) => (
                                <SelectItem key={team.id} value={team.id}>
                                    {team.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={selectedVercelProjectValue} onValueChange={setSelectedVercelProject}>
                        <SelectTrigger className="w-[360px] h-9 text-sm" disabled={isLoadingVercelProjects || selectVercelProjectMutation.isPending}>
                            <SelectValue
                                placeholder={isLoadingVercelProjects ? 'Loading Vercel projects...' : 'Select Vercel project'}
                            />
                        </SelectTrigger>
                        <SelectContent>
                            {vercelProjects.map((project) => (
                                <SelectItem key={`${project.team_id || 'personal'}-${project.id}`} value={getVercelOptionValue(project.id, project.team_id)}>
                                    {project.name}
                                    <span className="deploy-config__select-hint">
                                        {project.team_name || project.team_id || 'personal'}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        variant="secondary"
                        size="xs"
                        onClick={handleSelectVercelProject}
                        loading={selectVercelProjectMutation.isPending}
                        disabled={!selectedVercelProjectValue || selectVercelProjectMutation.isPending}
                    >
                        Use Project
                    </Button>
                    <Button
                        variant="ghost"
                        size="xs"
                        leftIcon="plus"
                        onClick={() => setShowCreateVercelDialog(true)}
                        disabled={createVercelProjectMutation.isPending}
                    >
                        Create Project
                    </Button>
                    <Button
                        variant="ghost"
                        size="xs"
                        iconOnly
                        leftIcon="rotate-ccw"
                        onClick={() => refetchVercelProjects()}
                        title="Refresh projects"
                    />
                </div>
            )}

            <div className="deployments-page__content">
                {isLoadingDeployments ? (
                    <EmptyState
                        icon="loader"
                        title="Loading deployments"
                        size="compact"
                        color="default"
                    />
                ) : (
                    <DeploymentList
                        deployments={deployments}
                        projectId={projectId}
                    />
                )}
            </div>

            <div className="deployments-page__danger">
                <div className="deployments-page__danger-card">
                    <div className="deployments-page__danger-header">
                        <Icon name="warning" size={16} className="text-red-400" />
                        <h3 className="text-base font-semibold text-red-400">Danger Zone</h3>
                    </div>
                    <p className="text-sm text-slate-400 mb-5">
                        Deleting <strong className="text-slate-300">{config?.name}</strong> will permanently
                        remove all deployment history and environment variables. This action cannot be undone.
                    </p>
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setShowDeleteDialog(true)}
                        leftIcon="trash"
                        className="deployments-page__danger-action"
                    >
                        Delete Configuration
                    </Button>
                </div>
            </div>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Configuration</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{config?.name}</strong>? This will remove all
                            deployment history and environment variables. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-center gap-2">
                        <input
                            id="deleteFromProvider"
                            type="checkbox"
                            checked={deleteFromProvider}
                            onChange={(e) => setDeleteFromProvider(e.target.checked)}
                            className="accent-red-500"
                        />
                        <label htmlFor="deleteFromProvider" className="cursor-pointer text-sm text-[var(--text-secondary)]">
                            Also delete associated project/service from the cloud provider
                        </label>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setShowDeleteDialog(false)}
                            disabled={deleteConfigMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleDeleteConfig}
                            loading={deleteConfigMutation.isPending}
                            disabled={deleteConfigMutation.isPending}
                        >
                            Delete Configuration
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showCreateVercelDialog} onOpenChange={setShowCreateVercelDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Vercel Project</DialogTitle>
                        <DialogDescription>
                            Create a new Vercel project for this deployment config. Leave Team ID empty for personal scope.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Project name (optional)</label>
                            <Input
                                type="text"
                                value={newVercelProjectName}
                                onChange={(e) => setNewVercelProjectName(e.target.value)}
                                placeholder="Defaults to config/repo name"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Team scope</label>
                            <Select value={newVercelTeamSelection} onValueChange={setNewVercelTeamSelection}>
                                <SelectTrigger className="w-full h-9 text-sm" disabled={isLoadingVercelTeams}>
                                    <SelectValue placeholder={isLoadingVercelTeams ? 'Loading teams...' : 'Select team scope'} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__personal__">Personal</SelectItem>
                                    {vercelTeams.map((team) => (
                                        <SelectItem key={team.id} value={team.id}>
                                            {team.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setShowCreateVercelDialog(false)}
                            disabled={createVercelProjectMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleCreateVercelProject}
                            loading={createVercelProjectMutation.isPending}
                            disabled={createVercelProjectMutation.isPending}
                        >
                            Create Project
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

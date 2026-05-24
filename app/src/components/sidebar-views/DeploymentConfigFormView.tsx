'use client';

import {
    Button,
    Form,
    FormActions,
    FormGroup,
    FormControl,
    FormInput,
    FormLabel,
    FormRow,
    Icon,
    Modal,
    ModalBody,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Badge,
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from '../shared/ui';
import ProviderConfigSection from '../deployments/provider-configs/ProviderConfigSection';
import { EnvVarsManager } from '../deployments/EnvVarsManager';
import { DirectoryTreeNode, normalizeDirectoryPath } from '../deployments/config-form/DirectoryTreeNode';
import { PendingEnvVarsEditor } from '../deployments/config-form/PendingEnvVarsEditor';
import { useDeploymentConfigForm } from '../deployments/config-form/useDeploymentConfigForm';
import type { DeploymentConfigItem } from '@/src/api/deployments/config';

interface DeploymentConfigFormProps {
    projectId?: string;
    existingConfig?: DeploymentConfigItem;
    onSuccess?: () => void;
    onClose?: () => void;
}

export default function DeploymentConfigFormView(props: DeploymentConfigFormProps) {
    const {
        resolvedConfig,
        formData, setFormData,
        pendingEnvVars, setPendingEnvVars,
        repoSearch, setRepoSearch,
        selectedRepo,
        isRepoModalOpen, setIsRepoModalOpen,
        isDirectoryModalOpen, setIsDirectoryModalOpen,
        directoryDraft, setDirectoryDraft,
        targetsData, isLoadingTargets,
        reposData, isLoadingRepos,
        branchesData, isLoadingBranches,
        filteredRepos,
        effectiveTargetSlug,
        selectedTarget,
        providerDef,
        isProviderConnected,
        isGitHubConnected,
        connectedAccountName,
        canBrowseRepositoryTree,
        isPending,
        isConnectPending,
        createIsPending,
        triggerIsPending,
        handleChange,
        handleSelectChange,
        handleRepoSelect,
        handleConnectGitHub,
        handleConnectProvider,
        handleClose,
        handleSubmit,
    } = useDeploymentConfigForm(props);

    return (
        <div className="w-6xl mx-auto">
            <div className="deploy-config__header">
                <h2 className="deploy-config__header-title">Deployment Configuration</h2>
                <p className="deploy-config__header-description">
                    Configure deployment settings for your project.
                </p>
            </div>

            <Tabs defaultValue="settings">
                <TabsList className="mb-6">
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                    <TabsTrigger value="env-vars">Environment Variables</TabsTrigger>
                </TabsList>

                {/* ── Settings Tab ───────────────────────────────────────── */}
                <TabsContent transparant={true} value="settings">
                    <Form onSubmit={(e) => handleSubmit(e)}>

                        <FormGroup>
                            <FormLabel required>Configuration Name</FormLabel>
                            <FormControl>
                                <FormInput
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Production"
                                    required
                                />
                            </FormControl>
                        </FormGroup>

                        {!resolvedConfig && (
                            <FormGroup>
                                <FormLabel required>Deployment Target</FormLabel>
                                <Select
                                    value={effectiveTargetSlug}
                                    onValueChange={(val) => handleSelectChange('target_slug', val)}
                                >
                                    <SelectTrigger disabled={isLoadingTargets}>
                                        <SelectValue placeholder={isLoadingTargets ? 'Loading targets…' : 'Select a target'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {targetsData?.targets?.map((target) => (
                                            <SelectItem key={target.slug} value={target.slug}>
                                                {target.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormGroup>
                        )}

                        {!!providerDef.connectionSlug && !isProviderConnected && (
                            <div className="deploy-config__connect-banner">
                                <div className="deploy-config__connect-banner-icon">
                                    <Icon name="cloud" size={20} />
                                </div>
                                <div className="deploy-config__connect-banner-text">
                                    <p className="deploy-config__connect-banner-title">Connect {providerDef.displayName}</p>
                                    <p className="deploy-config__connect-banner-desc">
                                        Active {providerDef.displayName} integration is required to trigger deployments.
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleConnectProvider}
                                    loading={isConnectPending}
                                    leftIcon="external-link"
                                >
                                    Connect
                                </Button>
                            </div>
                        )}

                        <FormGroup>
                            <FormLabel required>Repository</FormLabel>
                            <Button
                                type="button"
                                variant="secondary"
                                className="deploy-config__repo-trigger"
                                onClick={() => setIsRepoModalOpen(true)}
                                disabled={!isGitHubConnected}
                                leftIcon="github"
                                iconSize={16}
                            >
                                {selectedRepo || formData.github_repo_name ? (
                                    <>
                                        <span className="deploy-config__repo-trigger-name">
                                            {selectedRepo?.full_name ?? `${formData.github_repo_owner}/${formData.github_repo_name}`}
                                        </span>
                                        <span className="deploy-config__repo-trigger-branch">
                                            <Icon name="git-branch" size={10} />
                                            {formData.github_branch}
                                        </span>
                                    </>
                                ) : (
                                    <span className="deploy-config__repo-trigger-placeholder">Select repository…</span>
                                )}
                                <Icon name="chevron-right" size={14} className="deploy-config__repo-trigger-arrow" />
                            </Button>
                        </FormGroup>

                        <FormGroup>
                            <FormLabel required>Repository Directory</FormLabel>
                            <div className="flex flex-row-reverse items-center gap-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="deploy-config__dir-trigger"
                                    onClick={() => {
                                        setDirectoryDraft(normalizeDirectoryPath(formData.github_base_directory || '/'));
                                        setIsDirectoryModalOpen(true);
                                    }}
                                    disabled={!canBrowseRepositoryTree}
                                    leftIcon="folder"
                                    iconSize={15}
                                >
                                    <Icon name="chevron-right" size={14} className="deploy-config__repo-trigger-arrow" />
                                </Button>
                                <FormControl className="w-full">
                                    <FormInput
                                        name="github_base_directory"
                                        value={formData.github_base_directory || '/'}
                                        onChange={handleChange}
                                        placeholder="/"
                                        required
                                    />
                                </FormControl>
                            </div>
                        </FormGroup>

                        {/* Provider-specific fields */}
                        <ProviderConfigSection
                            provider={selectedTarget?.provider || ''}
                            formData={formData}
                            onChange={handleChange}
                            onSelectChange={handleSelectChange}
                            existingConfig={resolvedConfig}
                            isProviderConnected={isProviderConnected}
                        />

                        {/* Build settings — hidden when provider handles its own build (e.g. GCP/Dockerfile) */}
                        {providerDef.showBuildSettings && (
                            <div className="deploy-config__section">
                                <FormRow>
                                    <FormGroup>
                                        <FormLabel>Build Command</FormLabel>
                                        <FormControl>
                                            <FormInput
                                                name="build_command"
                                                value={formData.build_command}
                                                onChange={handleChange}
                                                placeholder="npm run build"
                                            />
                                        </FormControl>
                                    </FormGroup>
                                    <FormGroup>
                                        <FormLabel>Output Directory</FormLabel>
                                        <FormControl>
                                            <FormInput
                                                name="output_directory"
                                                value={formData.output_directory}
                                                onChange={handleChange}
                                                placeholder="dist"
                                            />
                                        </FormControl>
                                    </FormGroup>
                                </FormRow>
                                <FormRow>
                                    <FormGroup>
                                        <FormLabel>Install Command</FormLabel>
                                        <FormControl>
                                            <FormInput
                                                name="install_command"
                                                value={formData.install_command}
                                                onChange={handleChange}
                                                placeholder="npm install"
                                            />
                                        </FormControl>
                                    </FormGroup>
                                    <FormGroup>
                                        <FormLabel>Node Version</FormLabel>
                                        <FormControl>
                                            <FormInput
                                                name="node_version"
                                                value={formData.node_version}
                                                onChange={handleChange}
                                                placeholder="18"
                                            />
                                        </FormControl>
                                    </FormGroup>
                                </FormRow>
                            </div>
                        )}

                        <label className="deploy-config__toggle">
                            <input
                                type="checkbox"
                                name="auto_deploy_enabled"
                                checked={formData.auto_deploy_enabled}
                                onChange={handleChange}
                                className="deploy-config__toggle-input"
                            />
                            <span className="deploy-config__toggle-label">
                                Auto-deploy when code is pushed to branch
                            </span>
                        </label>

                        <FormActions>
                            <Button type="button" variant="ghost" onClick={handleClose} disabled={isPending}>
                                Cancel
                            </Button>
                            {resolvedConfig ? (
                                <Button type="submit" loading={isPending} disabled={isPending} leftIcon="save">
                                    Save Changes
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        loading={createIsPending && !triggerIsPending}
                                        disabled={isPending}
                                        onClick={(e) => handleSubmit(e, false)}
                                        leftIcon="save"
                                    >
                                        Create Configuration
                                    </Button>
                                    <Button
                                        type="button"
                                        loading={isPending}
                                        disabled={isPending}
                                        onClick={(e) => handleSubmit(e, true)}
                                        leftIcon="rocket"
                                    >
                                        Create & Deploy
                                    </Button>
                                </>
                            )}
                        </FormActions>
                    </Form>
                </TabsContent>

                {/* ── Env Vars Tab ───────────────────────────────────────── */}
                <TabsContent value="env-vars">
                    {resolvedConfig ? (
                        <EnvVarsManager
                            configId={resolvedConfig.id}
                            provider={selectedTarget?.provider || ''}
                        />
                    ) : (
                        <PendingEnvVarsEditor
                            provider={selectedTarget?.provider || ''}
                            envVars={pendingEnvVars}
                            onAdd={(entry) =>
                                setPendingEnvVars(prev => [...prev, { ...entry, tempId: crypto.randomUUID() }])
                            }
                            onRemove={(tempId) =>
                                setPendingEnvVars(prev => prev.filter(v => v.tempId !== tempId))
                            }
                        />
                    )}
                </TabsContent>
            </Tabs>

            {/* ── Repository picker modal ────────────────────────────────── */}
            <Modal isOpen={isRepoModalOpen} onClose={() => setIsRepoModalOpen(false)} title="Repository" size="lg">
                <ModalBody>
                    {!isGitHubConnected && (
                        <div className="deploy-config__connect-banner">
                            <div className="deploy-config__connect-banner-icon">
                                <Icon name="github" size={20} />
                            </div>
                            <div className="deploy-config__connect-banner-text">
                                <p className="deploy-config__connect-banner-title">Connect GitHub</p>
                                <p className="deploy-config__connect-banner-desc">Connect your account to browse repositories.</p>
                            </div>
                            <Button type="button" variant="secondary" size="sm" onClick={handleConnectGitHub} loading={isConnectPending} leftIcon="external-link">
                                Connect
                            </Button>
                        </div>
                    )}

                    {isGitHubConnected && !resolvedConfig && (
                        <FormGroup>
                            <FormControl>
                                <FormInput
                                    type="text"
                                    value={repoSearch}
                                    onChange={(e) => setRepoSearch(e.target.value)}
                                    placeholder="Search repositories…"
                                    leftIcon="search"
                                />
                            </FormControl>
                            <div className="deploy-config__repo-list">
                                {isLoadingRepos ? (
                                    <div className="deploy-config__repo-loading">
                                        <Icon name="loader" size={16} className="animate-spin" />
                                        <span>Loading repositories…</span>
                                    </div>
                                ) : filteredRepos.length === 0 ? (
                                    <div className="deploy-config__repo-empty">
                                        {repoSearch ? 'No repos match your search' : 'No repositories found'}
                                    </div>
                                ) : (
                                    filteredRepos.map((repo) => {
                                        const isOrg = repo.full_name.split('/')[0] !== connectedAccountName;
                                        const isSelected = selectedRepo?.full_name === repo.full_name;
                                        return (
                                            <button
                                                key={repo.id}
                                                type="button"
                                                onClick={() => { handleRepoSelect(repo.full_name); setIsRepoModalOpen(false); }}
                                                className={['deploy-config__repo-item', isSelected ? 'deploy-config__repo-item--selected' : ''].filter(Boolean).join(' ')}
                                            >
                                                <Icon name="github" size={13} className="deploy-config__repo-item-icon" />
                                                <div className="deploy-config__repo-item-body">
                                                    <div className="deploy-config__repo-item-name-row">
                                                        <span className="deploy-config__repo-item-name">{repo.full_name}</span>
                                                        {repo.private && <Icon name="lock" size={10} className="deploy-config__repo-item-lock" />}
                                                        {isOrg && <Badge size="xs" variant="secondary" icon="building-2" className="deploy-config__repo-item-badge">org</Badge>}
                                                    </div>
                                                    {repo.description && <p className="deploy-config__repo-item-desc">{repo.description}</p>}
                                                </div>
                                                <span className="deploy-config__repo-item-branch">{repo.default_branch}</span>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                            {selectedRepo && (
                                <div className="deploy-config__repo-selected">
                                    <Icon name="github" size={13} />
                                    <span>{selectedRepo.full_name}</span>
                                    <a href={selectedRepo.html_url} target="_blank" rel="noopener noreferrer" className="deploy-config__repo-selected-link" title="Open on GitHub">
                                        <Icon name="external-link" size={12} />
                                    </a>
                                </div>
                            )}
                        </FormGroup>
                    )}

                    {(!isGitHubConnected || resolvedConfig) && (
                        <FormRow>
                            <FormGroup>
                                <FormLabel required>Owner / Organization</FormLabel>
                                <FormControl>
                                    <FormInput name="github_repo_owner" value={formData.github_repo_owner} onChange={handleChange} placeholder="octocat" required disabled={!!resolvedConfig} />
                                </FormControl>
                            </FormGroup>
                            <FormGroup>
                                <FormLabel required>Repository Name</FormLabel>
                                <FormControl>
                                    <FormInput name="github_repo_name" value={formData.github_repo_name} onChange={handleChange} placeholder="my-app" required disabled={!!resolvedConfig} />
                                </FormControl>
                            </FormGroup>
                        </FormRow>
                    )}

                    <FormGroup>
                        <FormLabel required>Branch</FormLabel>
                        {isGitHubConnected && selectedRepo ? (
                            <Select value={formData.github_branch} onValueChange={(val) => handleSelectChange('github_branch', val)}>
                                <SelectTrigger disabled={isLoadingBranches}>
                                    <SelectValue placeholder={isLoadingBranches ? 'Loading…' : 'Select branch'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {branchesData?.branches?.map((branch) => (
                                        <SelectItem key={branch.name} value={branch.name}>{branch.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <FormControl>
                                <FormInput name="github_branch" value={formData.github_branch} onChange={handleChange} placeholder="main" required />
                            </FormControl>
                        )}
                    </FormGroup>
                </ModalBody>
            </Modal>

            {/* ── Directory picker modal ─────────────────────────────────── */}
            <Modal isOpen={isDirectoryModalOpen} onClose={() => setIsDirectoryModalOpen(false)} title="Repository Directory" size="lg">
                <ModalBody>
                    {!canBrowseRepositoryTree ? (
                        <div className="deploy-config__repo-empty">Select repository and branch before choosing a directory.</div>
                    ) : (
                        <>
                            <div className="deploy-config__dir-selected-pill">
                                <Icon name="folder" size={13} />
                                <span>{normalizeDirectoryPath(directoryDraft)}</span>
                            </div>
                            <div className="deploy-config__dir-tree">
                                <DirectoryTreeNode
                                    owner={formData.github_repo_owner || ''}
                                    repo={formData.github_repo_name || ''}
                                    branch={formData.github_branch || 'main'}
                                    path="/"
                                    label="Repository Root"
                                    level={0}
                                    selectedPath={directoryDraft}
                                    onSelect={setDirectoryDraft}
                                />
                            </div>
                            <FormActions>
                                <Button type="button" variant="ghost" onClick={() => { setDirectoryDraft(normalizeDirectoryPath(formData.github_base_directory || '/')); setIsDirectoryModalOpen(false); }}>
                                    Cancel
                                </Button>
                                <Button type="button" variant="primary" onClick={() => { setFormData(prev => ({ ...prev, github_base_directory: normalizeDirectoryPath(directoryDraft) })); setIsDirectoryModalOpen(false); }}>
                                    Use Directory
                                </Button>
                            </FormActions>
                        </>
                    )}
                </ModalBody>
            </Modal>
        </div>
    );
}

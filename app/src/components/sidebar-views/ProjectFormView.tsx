'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspacePath } from '@/src/hooks/useWorkspacePath';
import { useCreateProject } from '@/src/hooks/queries/project-management';
import {
    useBeginConnect,
    useConnections,
    useGitHubBranches,
    useGitHubRepos,
} from '@/src/hooks/queries/integrations/useIntegrations';
import type { GitHubRepo } from '@/src/hooks/queries/integrations/useIntegrations';
import { useOAuthPopup } from '@/src/hooks/queries/integrations/useOAuthPopup';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { closeAllViews, selectSidebarViewData } from '@/src/store/slices/layoutSlice';
import { Button, Form, FormControl, FormInput, FormLabel, Input, Select, SelectItem, SelectTrigger, SelectContent, SelectValue, Textarea, FormGroup, FormRow, FormActions, Icon, Badge, Modal, ModalBody, useToast } from '../shared/ui';
import { normalizeDirectoryPath, DirectoryTreeNode } from '../deployments/config-form/DirectoryTreeNode';

const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
];

const statusOptions = [
    { value: 'planning', label: 'Planning' },
    { value: 'active', label: 'Active' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'completed', label: 'Completed' },
];

const currencyOptions = [
    { value: 'USD', label: 'USD' },
    { value: 'EUR', label: 'EUR' },
    { value: 'GBP', label: 'GBP' },
    { value: 'CAD', label: 'CAD' },
    { value: 'AUD', label: 'AUD' },
];

interface ProjectFormViewData {
    clientId?: string;
    clientName?: string;
}

export default function ProjectFormView() {
    const router = useRouter();
    const workspacePath = useWorkspacePath();
    const dispatch = useAppDispatch();
    const toast = useToast();
    const createProject = useCreateProject();
    const beginConnect = useBeginConnect();
    const { openPopup } = useOAuthPopup();

    const viewData = (useAppSelector(selectSidebarViewData) as ProjectFormViewData) || {};

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        client_id: viewData.clientId || '',
        status: 'planning',
        priority: 'medium',
        start_date: '',
        due_date: '',
        budget: '',
        currency: 'USD',
        github_base_directory: '/',
        github_repo_name: '',
        github_branch: '',
        github_repo_owner: '',
    });

    // ── GitHub integration state ──────────────────────────────────────────────
    const [repoSearch, setRepoSearch] = useState('');
    const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
    const [isRepoModalOpen, setIsRepoModalOpen] = useState(false);
    const [isDirectoryModalOpen, setIsDirectoryModalOpen] = useState(false);
    const [directoryDraft, setDirectoryDraft] = useState('/');

    const { data: connectionsData } = useConnections();
    const githubConnection = connectionsData?.connections?.find(
        c => c.provider_slug === 'github' && c.status === 'active'
    );
    const isGitHubConnected = !!githubConnection;
    const connectedAccountName = githubConnection?.external_account_name ?? '';

    const { data: reposData, isLoading: isLoadingRepos } = useGitHubRepos(isGitHubConnected);
    const { data: branchesData, isLoading: isLoadingBranches } = useGitHubBranches(
        selectedRepo?.full_name.split('/')[0] ?? '',
        selectedRepo?.full_name.split('/')[1] ?? ''
    );

    const filteredRepos = useMemo(() => {
        const list = reposData?.repos ?? [];
        if (!repoSearch.trim()) return list;
        const q = repoSearch.toLowerCase();
        return list.filter(r =>
            r.full_name.toLowerCase().includes(q) ||
            r.description?.toLowerCase().includes(q)
        );
    }, [reposData?.repos, repoSearch]);

    const canBrowseRepositoryTree =
        !!formData.github_repo_owner && !!formData.github_repo_name && !!formData.github_branch;

    // ── Form state ────────────────────────────────────────────────────────────
    useEffect(() => {
        if (viewData.clientId && !formData.client_id) {
            setFormData(prev => ({ ...prev, client_id: viewData.clientId || '' }));
        }
    }, [viewData.clientId]);

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
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

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) {
            newErrors.name = 'Project name is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const data = {
            name: formData.name,
            description: formData.description || undefined,
            priority: formData.priority,
            status: formData.status,
            start_date: formData.start_date || undefined,
            due_date: formData.due_date || undefined,
            budget_cents: formData.budget ? Math.round(parseFloat(formData.budget) * 100) : undefined,
            currency: formData.currency,
            ...(formData.client_id && { client_id: formData.client_id }),
            ...(formData.github_repo_owner && {
                github_repo_url: `https://github.com/${formData.github_repo_owner}/${formData.github_repo_name}`,
            }),
        };

        createProject.mutate(data as Parameters<typeof createProject.mutate>[0], {
            onSuccess: (response) => {
                dispatch(closeAllViews());
                const project = response?.project as { id?: string } | undefined;
                if (project?.id) {
                    router.push(workspacePath(`projects/${project.id}`));
                } else {
                    router.push(workspacePath('projects'));
                }
            },
        });
    };

    const handleClose = () => {
        dispatch(closeAllViews());
    };

    return (
        <div className="form-view">
            <Form onSubmit={handleSubmit}>
                <FormGroup>
                    <FormLabel required>
                        Project name
                    </FormLabel>
                    <FormControl>
                        <FormInput
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter project name"
                            error={errors.name}
                        />
                    </FormControl>
                </FormGroup>

                <FormGroup>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                        <Textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Enter project description"
                        />
                    </FormControl>
                </FormGroup>

                <FormRow>
                    <FormGroup>
                        <FormLabel required>
                            Priority
                        </FormLabel>
                        <Select
                            value={formData.priority}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                                {priorityOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormGroup>

                    <FormGroup>
                        <FormLabel required>
                            Status
                        </FormLabel>
                        <Select
                            value={formData.status}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                {statusOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormGroup>
                </FormRow>

                <FormRow >
                    <FormGroup>
                        <FormControl>
                            <Input
                                type="date"
                                name="start_date"
                                value={formData.start_date}
                                onChange={handleChange}
                            />
                        </FormControl>
                    </FormGroup>

                    <FormGroup>
                        <FormControl>
                            <Input
                                type="date"
                                name="due_date"
                                value={formData.due_date}
                                onChange={handleChange}
                            />
                        </FormControl>
                    </FormGroup>
                </FormRow>

                <FormRow>
                    <FormGroup style={{ flex: 2 }}>
                        <FormLabel>Budget</FormLabel>
                        <FormControl>
                            <FormInput
                                type="number"
                                name="budget"
                                value={formData.budget}
                                onChange={handleChange}
                                placeholder="Enter project budget"
                                min="0"
                                step="0.01"
                            />
                        </FormControl>
                    </FormGroup>
                    <FormGroup style={{ flex: 1 }}>
                        <FormLabel>Currency</FormLabel>
                        <Select
                            value={formData.currency}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                                {currencyOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormGroup>
                </FormRow>
                <FormRow>
                    <FormGroup>
                        <FormLabel>Repository</FormLabel>
                        {!isGitHubConnected ? (
                            <div className="deploy-config__connect-banner">
                                <div className="deploy-config__connect-banner-icon">
                                    <Icon name="github" size={20} />
                                </div>
                                <div className="deploy-config__connect-banner-text">
                                    <p className="deploy-config__connect-banner-title">Connect GitHub</p>
                                    <p className="deploy-config__connect-banner-desc">Link a repository to seed the knowledge base automatically.</p>
                                </div>
                                <Button type="button" variant="secondary" size="sm" onClick={handleConnectGitHub} loading={beginConnect.isPending} leftIcon="external-link">
                                    Connect
                                </Button>
                            </div>
                        ) : (
                            <Button
                                type="button"
                                variant="secondary"
                                className="deploy-config__repo-trigger"
                                onClick={() => setIsRepoModalOpen(true)}
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
                                    <span className="deploy-config__repo-trigger-placeholder">Select repository...</span>
                                )}
                                <Icon name="chevron-right" size={14} className="deploy-config__repo-trigger-arrow" />
                            </Button>
                        )}
                    </FormGroup>

                    <FormGroup>
                        <FormLabel>Repository Directory</FormLabel>
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
                            <FormControl>
                                <FormInput
                                    name="github_base_directory"
                                    value={formData.github_base_directory || '/'}
                                    onChange={handleChange}
                                    placeholder="/"
                                />
                            </FormControl>
                        </div>
                    </FormGroup>

                </FormRow>

                <FormActions>
                    <Button onClick={handleClose} variant="ghost">
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        loading={createProject.isPending}
                        disabled={createProject.isPending}
                    >
                        {createProject.isPending ? 'Creating...' : 'Create Project'}
                    </Button>
                </FormActions>
            </Form>

            {/* ── Repository picker modal ────────────────────────────────── */}
            <Modal isOpen={isRepoModalOpen} onClose={() => setIsRepoModalOpen(false)} title="Repository" size="lg">
                <ModalBody>
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

                    <FormGroup>
                        <FormLabel>Branch</FormLabel>
                        {selectedRepo ? (
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
                                <FormInput name="github_branch" value={formData.github_branch} onChange={handleChange} placeholder="main" />
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

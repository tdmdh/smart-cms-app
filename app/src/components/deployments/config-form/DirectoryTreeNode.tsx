'use client';

import { useMemo, useState } from 'react';
import { Icon } from '@/src/components/shared/ui';
import { useGitHubTree } from '@/src/hooks/queries/integrations/useIntegrations';
import type { GitHubTreeEntry } from '@/src/hooks/queries/integrations/useIntegrations';

export function normalizeDirectoryPath(value: string): string {
    const normalized = value.trim().replace(/\\/g, '/');
    if (!normalized || normalized === '/' || normalized === '.') return '/';
    return normalized.replace(/^\/+/, '').replace(/\/+$/, '');
}

interface DirectoryTreeNodeProps {
    owner: string;
    repo: string;
    branch: string;
    path: string;
    label: string;
    level: number;
    selectedPath: string;
    onSelect: (path: string) => void;
}

export function DirectoryTreeNode({
    owner,
    repo,
    branch,
    path,
    label,
    level,
    selectedPath,
    onSelect,
}: DirectoryTreeNodeProps) {
    const [isOpen, setIsOpen] = useState(level === 0);
    const queryPath = path === '/' ? '' : path;
    const { data, isLoading, isError } = useGitHubTree(owner, repo, branch, queryPath, isOpen);

    const directories = useMemo(() => {
        const entries = data?.entries ?? [];
        return entries
            .filter((e: GitHubTreeEntry) => e.type === 'dir')
            .sort((a: GitHubTreeEntry, b: GitHubTreeEntry) => a.name.localeCompare(b.name));
    }, [data?.entries]);

    const normalizedPath = normalizeDirectoryPath(path);
    const isSelected = normalizeDirectoryPath(selectedPath) === normalizedPath;

    return (
        <div className="deploy-config__dir-node" style={{ paddingLeft: `${level * 0.75}rem` }}>
            <div className="deploy-config__dir-node-row">
                <button
                    type="button"
                    className="deploy-config__dir-toggle"
                    onClick={() => setIsOpen((prev) => !prev)}
                    aria-label={isOpen ? 'Collapse directory' : 'Expand directory'}
                >
                    <Icon name={isOpen ? 'chevron-down' : 'chevron-right'} size={12} />
                </button>
                <button
                    type="button"
                    className={[
                        'deploy-config__dir-select',
                        isSelected ? 'deploy-config__dir-select--selected' : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => onSelect(normalizedPath)}
                >
                    <Icon name="folder" size={13} />
                    <span>{label}</span>
                </button>
            </div>

            {isOpen && (
                <div className="deploy-config__dir-children">
                    {isLoading && (
                        <div className="deploy-config__dir-loading">
                            <Icon name="loader" size={13} className="animate-spin" />
                            <span>Loading folders…</span>
                        </div>
                    )}
                    {!isLoading && isError && (
                        <div className="deploy-config__dir-error">Failed to load folders</div>
                    )}
                    {!isLoading && !isError && directories.length === 0 && (
                        <div className="deploy-config__dir-empty">No subdirectories</div>
                    )}
                    {!isLoading && !isError && directories.map((entry) => (
                        <DirectoryTreeNode
                            key={entry.path}
                            owner={owner}
                            repo={repo}
                            branch={branch}
                            path={entry.path}
                            label={entry.name}
                            level={level + 1}
                            selectedPath={selectedPath}
                            onSelect={onSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

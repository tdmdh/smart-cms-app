'use client';

import { useState, useRef } from 'react';
import { Building2, Check, ChevronRight, Pencil, Trash2, Plus, X, Loader2 } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { closeAllViews } from '@/src/store/slices/layoutSlice';
import { selectCurrentWorkspaceId, setCurrentWorkspaceId } from '@/src/store/slices/workspaceSlice';
import {
    useWorkspaces,
    useCreateWorkspace,
    useUpdateWorkspace,
    useDeleteWorkspace,
} from '@/src/hooks/queries/workspace-management';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

type Mode =
    | { type: 'list' }
    | { type: 'creating' }
    | { type: 'editing'; id: string; currentName: string; currentDescription: string }
    | { type: 'deleting'; id: string; name: string };

// --------------------------------------------------------------------------
// Inline form
// --------------------------------------------------------------------------

interface InlineFormProps {
    initialName?: string;
    initialDescription?: string;
    namePlaceholder?: string;
    confirmLabel: string;
    onConfirm: (name: string, description: string) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

function InlineForm({
    initialName = '',
    initialDescription = '',
    namePlaceholder = 'Workspace name',
    confirmLabel,
    onConfirm,
    onCancel,
    isLoading,
}: InlineFormProps) {
    const [name, setName] = useState(initialName);
    const [description, setDescription] = useState(initialDescription);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        onConfirm(name.trim(), description.trim());
    };

    return (
        <form className="sidebar-view__inline-form" onSubmit={handleSubmit}>
            <input
                className="sidebar-view__inline-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={namePlaceholder}
                autoFocus
                disabled={isLoading}
            />
            <textarea
                className="sidebar-view__inline-input sidebar-view__inline-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                disabled={isLoading}
            />
            <div className="sidebar-view__inline-actions">
                <button
                    type="submit"
                    className="sidebar-view__inline-btn sidebar-view__inline-btn--confirm"
                    disabled={!name.trim() || isLoading}
                >
                    {isLoading ? <Loader2 size={14} className="sidebar-view__spinning" /> : confirmLabel}
                </button>
                <button
                    type="button"
                    className="sidebar-view__inline-btn sidebar-view__inline-btn--cancel"
                    onClick={onCancel}
                    disabled={isLoading}
                >
                    <X size={14} />
                </button>
            </div>
        </form>
    );
}

// --------------------------------------------------------------------------
// Delete confirmation row
// --------------------------------------------------------------------------

interface DeleteConfirmProps {
    name: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

function DeleteConfirm({ name, onConfirm, onCancel, isLoading }: DeleteConfirmProps) {
    return (
        <div className="sidebar-view__delete-confirm">
            <span className="sidebar-view__delete-label">Delete &ldquo;{name}&rdquo;?</span>
            <div className="sidebar-view__inline-actions">
                <button
                    type="button"
                    className="sidebar-view__inline-btn sidebar-view__inline-btn--danger"
                    onClick={onConfirm}
                    disabled={isLoading}
                >
                    {isLoading ? <Loader2 size={14} className="sidebar-view__spinning" /> : 'Delete'}
                </button>
                <button
                    type="button"
                    className="sidebar-view__inline-btn sidebar-view__inline-btn--cancel"
                    onClick={onCancel}
                    disabled={isLoading}
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
}

// --------------------------------------------------------------------------
// Workspace row
// --------------------------------------------------------------------------

interface WorkspaceRowProps {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    onSelect: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

function WorkspaceRow({ id, name, description, isActive, onSelect, onEdit, onDelete }: WorkspaceRowProps) {
    return (
        <div className={`sidebar-view__menu-item-row ${isActive ? 'sidebar-view__menu-item-row--active' : ''}`}>
            <button
                className={`sidebar-view__menu-item sidebar-view__menu-item--row ${isActive ? 'sidebar-view__menu-item--active' : ''}`}
                onClick={onSelect}
                title={name}
            >
                <span className="sidebar-view__menu-icon">
                    <Building2 size={18} />
                </span>
                <div className="sidebar-view__menu-content">
                    <span className="sidebar-view__menu-label">{name}</span>
                    {description && (
                        <span className="sidebar-view__menu-meta">{description}</span>
                    )}
                </div>
                {isActive ? (
                    <Check size={14} className="sidebar-view__menu-arrow" />
                ) : (
                    <ChevronRight size={14} className="sidebar-view__menu-arrow" />
                )}
            </button>

            <div className="sidebar-view__menu-item-actions">
                <button
                    type="button"
                    className="sidebar-view__icon-btn"
                    onClick={onEdit}
                    title="Rename workspace"
                    aria-label="Rename workspace"
                >
                    <Pencil size={13} />
                </button>
                <button
                    type="button"
                    className="sidebar-view__icon-btn sidebar-view__icon-btn--danger"
                    onClick={onDelete}
                    title="Delete workspace"
                    aria-label="Delete workspace"
                >
                    <Trash2 size={13} />
                </button>
            </div>
        </div>
    );
}

// --------------------------------------------------------------------------
// Main view
// --------------------------------------------------------------------------

export default function WorkspaceManagerView() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const pathname = usePathname();
    const currentWorkspaceId = useAppSelector(selectCurrentWorkspaceId);
    const { data, isLoading, isError } = useWorkspaces();

    const [mode, setMode] = useState<Mode>({ type: 'list' });

    const createWorkspace = useCreateWorkspace();
    const updateWorkspace = useUpdateWorkspace();
    const deleteWorkspace = useDeleteWorkspace();

    const workspaces = data?.workspaces ?? [];

    const handleSelect = (id: string) => {
        if (id === currentWorkspaceId) return;

        dispatch(setCurrentWorkspaceId(id));
        dispatch(closeAllViews());
        
        // Determine if we are deep-linked into a specific resource (project or client detail)
        const pathParts = pathname.split('/').filter(Boolean);
        const isDeepLink = pathParts.length >= 4 && (pathParts[2] === 'projects' || pathParts[2] === 'clients');

        const destination = isDeepLink
            ? `/dashboard/${id}`
            : pathname.replace(/^\/dashboard\/[^/]+(\/|$)/, `/dashboard/${id}$1`);

        router.push(destination);
    };

    const handleCreate = async (name: string, description: string) => {
        try {
            await createWorkspace.mutateAsync({ name, description });
            setMode({ type: 'list' });
        } catch {
            // error handled by mutation
        }
    };

    const handleRename = async (name: string, description: string) => {
        if (mode.type !== 'editing') return;
        try {
            await updateWorkspace.mutateAsync({ id: mode.id, data: { name, description } });
            setMode({ type: 'list' });
        } catch {
            // error handled by mutation
        }
    };

    const handleDelete = async () => {
        if (mode.type !== 'deleting') return;
        try {
            await deleteWorkspace.mutateAsync(mode.id);
            // If deleted workspace was selected, clear selection
            if (mode.id === currentWorkspaceId) {
                dispatch(setCurrentWorkspaceId(null));
            }
            setMode({ type: 'list' });
        } catch {
            // error handled by mutation
        }
    };

    // ---------- Loading / Error ----------
    if (isLoading) {
        return (
            <div className="sidebar-view__loading">
                <div className="sidebar-view__loading-spinner" />
                <span>Loading workspaces...</span>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="sidebar-view__error">
                <span>Failed to load workspaces</span>
            </div>
        );
    }

    // ---------- Empty ----------
    if (workspaces.length === 0 && mode.type !== 'creating') {
        return (
            <div className="sidebar-view__menu">
                <div className="sidebar-view__empty">
                    <Building2 size={32} />
                    <span>No workspaces yet</span>
                </div>
                <button
                    className="sidebar-view__menu-item sidebar-view__menu-item--action"
                    onClick={() => setMode({ type: 'creating' })}
                >
                    <span className="sidebar-view__menu-icon"><Plus size={18} /></span>
                    <span className="sidebar-view__menu-label">New workspace</span>
                </button>
            </div>
        );
    }

    // ---------- List + inline forms ----------
    return (
        <div className="sidebar-view__menu">
            {workspaces.map((workspace) => {
                const isActive = workspace.id === currentWorkspaceId;

                if (mode.type === 'editing' && mode.id === workspace.id) {
                    return (
                        <InlineForm
                            key={workspace.id}
                            initialName={mode.currentName}
                            initialDescription={mode.currentDescription}
                            confirmLabel="Save"
                            onConfirm={handleRename}
                            onCancel={() => setMode({ type: 'list' })}
                            isLoading={updateWorkspace.isPending}
                        />
                    );
                }

                if (mode.type === 'deleting' && mode.id === workspace.id) {
                    return (
                        <DeleteConfirm
                            key={workspace.id}
                            name={mode.name}
                            onConfirm={handleDelete}
                            onCancel={() => setMode({ type: 'list' })}
                            isLoading={deleteWorkspace.isPending}
                        />
                    );
                }

                return (
                    <WorkspaceRow
                        key={workspace.id}
                        id={workspace.id}
                        name={workspace.name}
                        isActive={isActive}
                        onSelect={() => handleSelect(workspace.id)}
                        onEdit={() => setMode({ type: 'editing', id: workspace.id, currentName: workspace.name, currentDescription: workspace.description ?? '' })}
                        onDelete={() => setMode({ type: 'deleting', id: workspace.id, name: workspace.name })}
                    />
                );
            })}

            <div className="sidebar-view__divider" />

            {mode.type === 'creating' ? (
                <InlineForm
                    namePlaceholder="New workspace name"
                    confirmLabel="Create"
                    onConfirm={handleCreate}
                    onCancel={() => setMode({ type: 'list' })}
                    isLoading={createWorkspace.isPending}
                />
            ) : (
                <button
                    className="sidebar-view__menu-item sidebar-view__menu-item--action"
                    onClick={() => setMode({ type: 'creating' })}
                >
                    <span className="sidebar-view__menu-icon"><Plus size={18} /></span>
                    <span className="sidebar-view__menu-label">New workspace</span>
                </button>
            )}
        </div>
    );
}

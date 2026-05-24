'use client';

import { useEffect } from 'react';
import { Building2, Check, ChevronRight } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { closeAllViews } from '@/src/store/slices/layoutSlice';
import { selectCurrentWorkspaceId, setCurrentWorkspaceId } from '@/src/store/slices/workspaceSlice';
import { getDefaultWorkspace, useWorkspaces } from '@/src/hooks/queries/workspace-management';

interface WorkspaceItemProps {
    id: string;
    name: string;
    isActive?: boolean;
    onClick: () => void;
}

function WorkspaceItem({ name, isActive, onClick }: WorkspaceItemProps) {
    return (
        <button
            className={`sidebar-view__menu-item ${isActive ? 'sidebar-view__menu-item--active' : ''}`}
            onClick={onClick}
        >
            <span className="sidebar-view__menu-icon">
                <Building2 size={18} />
            </span>
            <div className="sidebar-view__menu-content">
                <span className="sidebar-view__menu-label">{name}</span>
            </div>
            {isActive ? (
                <Check size={16} className="sidebar-view__menu-arrow" />
            ) : (
                <ChevronRight size={16} className="sidebar-view__menu-arrow" />
            )}
        </button>
    );
}

export default function WorkspaceSwitcherView() {
    const dispatch = useAppDispatch();
    const currentWorkspaceId = useAppSelector(selectCurrentWorkspaceId);
    const { data, isLoading, isError } = useWorkspaces();

    const workspaces = data?.workspaces ?? [];

    useEffect(() => {
        const defaultWorkspaceId = getDefaultWorkspace(workspaces, currentWorkspaceId);
        if (defaultWorkspaceId && !currentWorkspaceId) {
            dispatch(setCurrentWorkspaceId(defaultWorkspaceId));
        }
    }, [workspaces, currentWorkspaceId, dispatch]);

    const handleSelectWorkspace = (workspaceId: string) => {
        dispatch(setCurrentWorkspaceId(workspaceId));
        dispatch(closeAllViews());
    };

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

    if (workspaces.length === 0) {
        return (
            <div className="sidebar-view__empty">
                <Building2 size={32} />
                <span>No workspaces yet</span>
            </div>
        );
    }

    return (
        <div className="sidebar-view__menu">
            {workspaces.map((workspace) => (
                <WorkspaceItem
                    key={workspace.id}
                    id={workspace.id}
                    name={workspace.name}
                    isActive={workspace.id === currentWorkspaceId}
                    onClick={() => handleSelectWorkspace(workspace.id)}
                />
            ))}
        </div>
    );
}

'use client';

import { useRouter, usePathname } from 'next/navigation';
import { FolderKanban, Plus, ChevronRight } from 'lucide-react';
import { useProjects } from '@/src/hooks/queries/project-management';
import { useAppDispatch } from '@/src/store/hooks';
import { closeAllViews, setSidebarView } from '@/src/store/slices/layoutSlice';
import { useWorkspacePath } from '@/src/hooks/useWorkspacePath';

interface Project {
    id: string;
    name: string;
    status: string;
}

interface ProjectItemProps {
    id: string;
    name: string;
    status: string;
    isActive?: boolean;
    onClick: () => void;
}

function ProjectItem({ name, status, isActive, onClick }: ProjectItemProps) {
    return (
        <button
            className={`sidebar-view__menu-item ${isActive ? 'sidebar-view__menu-item--active' : ''}`}
            onClick={onClick}
        >
            <span className="sidebar-view__menu-icon">
                <FolderKanban size={18} />
            </span>
            <div className="sidebar-view__menu-content">
                <span className="sidebar-view__menu-label">{name}</span>
                <span className="sidebar-view__menu-meta">{status}</span>
            </div>
            <ChevronRight size={16} className="sidebar-view__menu-arrow" />
        </button>
    );
}

export default function ProjectSwitcherView() {
    const router = useRouter();
    const pathname = usePathname();
    const dispatch = useAppDispatch();
    const workspacePath = useWorkspacePath();
    const { data, isLoading, isError } = useProjects({});

    const handleSelectProject = (projectId: string) => {
        dispatch(closeAllViews());
        router.push(workspacePath(`projects/${projectId}`));
    };

    const handleCreateProject = () => {
        dispatch(setSidebarView({ view: 'project-form' }));
    };

    const currentProjectId = pathname.match(/\/dashboard\/projects\/([^/]+)/)?.[1];

    if (isLoading) {
        return (
            <div className="sidebar-view__loading">
                <div className="sidebar-view__loading-spinner" />
                <span>Loading projects...</span>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="sidebar-view__error">
                <span>Failed to load projects</span>
            </div>
        );
    }

    const projects = (data?.projects ?? []) as Project[];

    return (
        <div className="sidebar-view__menu">
            {projects.length > 0 ? (
                <>
                    {projects.map((project) => (
                        <ProjectItem
                            key={project.id}
                            id={project.id}
                            name={project.name}
                            status={project.status}
                            isActive={project.id === currentProjectId}
                            onClick={() => handleSelectProject(project.id)}
                        />
                    ))}
                    <div className="sidebar-view__divider" />
                </>
            ) : (
                <div className="sidebar-view__empty">
                    <FolderKanban size={32} />
                    <span>No projects yet</span>
                </div>
            )}

            <button className="sidebar-view__menu-item sidebar-view__menu-item--action" onClick={handleCreateProject}>
                <span className="sidebar-view__menu-icon">
                    <Plus size={18} />
                </span>
                <span className="sidebar-view__menu-label">Create new project</span>
            </button>
        </div>
    );
}

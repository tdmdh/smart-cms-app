'use client';

import { memo, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Icon, Badge } from '@/src/components/shared/ui';
import { Button } from '@/src/components/shared/ui/Button';
import { useWorkspacePath } from '@/src/hooks/useWorkspacePath';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/src/components/shared/ui/DropdownMenu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/src/components/shared/ui/Dialog';
import { useDeleteProject } from '@/src/hooks/queries/project-management';
import { useToast } from '@/src/components/shared/ui';

export interface Project {
    id: string;
    name: string;
    description?: string;
    client_name?: string;
    status: string;
    priority?: string;
    due_date?: string;
    start_date?: string;
    total_tasks?: number;
    completed_tasks?: number;
    total_members?: number;
    member_count?: number;
}

interface ProjectCardProps {
    project: Project;
    variant?: 'grid' | 'list';
}

const statusConfig: Record<string, { label: string; variant: string; icon: string }> = {
    planning: { label: 'Planning', variant: 'info', icon: '◇' },
    active: { label: 'Active', variant: 'success', icon: '●' },
    on_hold: { label: 'On Hold', variant: 'warning', icon: '◆' },
    completed: { label: 'Completed', variant: 'primary', icon: '✓' },
    archived: { label: 'Archived', variant: 'default', icon: '○' },
};

const priorityConfig: Record<string, { label: string; class: string }> = {
    low: { label: 'Low', class: 'priority--low' },
    medium: { label: 'Medium', class: 'priority--medium' },
    high: { label: 'High', class: 'priority--high' },
    critical: { label: 'Critical', class: 'priority--critical' },
};

function ProjectCardComponent({ project, variant = 'grid' }: ProjectCardProps) {
    const router = useRouter();
    const toast = useToast();
    const deleteMutation = useDeleteProject();
    const workspacePath = useWorkspacePath();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const status = statusConfig[project.status] || statusConfig.planning;
    const priority = project.priority ? priorityConfig[project.priority] : null;

    const totalTasks = project.total_tasks ?? 0;
    const completedTasks = project.completed_tasks ?? 0;
    const progress = useMemo(
        () => totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        [totalTasks, completedTasks]
    );

    const memberCount = project.total_members ?? project.member_count ?? 0;

    const dueDate = project.due_date
        ? new Date(project.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : null;

    const isOverdue = project.due_date && new Date(project.due_date) < new Date() && project.status !== 'completed';

    const navigateToProject = () => router.push(workspacePath(`projects/${project.id}`));

    const handleDelete = () => {
        deleteMutation.mutate(project.id, {
            onSuccess: () => {
                toast.success(`"${project.name}" deleted successfully`);
                setShowDeleteDialog(false);
            },
            onError: (error) => {
                toast.error(error.message || 'Failed to delete project');
                setShowDeleteDialog(false);
            },
        });
    };

    return (
        <>
            <div
                className={`project-card project-card--${variant}`}
                onClick={navigateToProject}
                role="link"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') navigateToProject(); }}

            >
                {/* Top row: icon + name + menu */}
                <div className="project-card__top">
                    <div className="project-card__icon">
                        <Icon name="folder" size={20} />
                    </div>
                    
                    <div className="project-card__content">
                        <div className="project-card__header">
                            <h3 className="project-card__title">{project.name}</h3>
                            <div className="project-card__actions">
                                <div onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                iconOnly
                                                leftIcon="more-vertical"
                                                size="xs"
                                                className="project-card__menu"
                                                aria-label="Project actions"
                                            />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" size='sm'>
                                            <DropdownMenuItem icon='eye' onSelect={() => router.push(workspacePath(`projects/${project.id}`))}>View</DropdownMenuItem>
                                            <DropdownMenuItem icon='settings' onSelect={() => router.push(workspacePath(`projects/${project.id}/settings`))}>Settings</DropdownMenuItem>
                                            <DropdownMenuItem icon='columns' onSelect={() => router.push(workspacePath(`projects/${project.id}/board`))}>Board</DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem icon='trash' variant="danger" onSelect={() => setShowDeleteDialog(true)}>
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                {totalTasks > 0 && (
                                    <div className="project-card__circular-progress" title={`${completedTasks}/${totalTasks} tasks completed`}>
                                        <svg viewBox="0 0 36 36" className="circular-chart">
                                            <path className="circle-bg"
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            />
                                            <path className="circle"
                                                strokeDasharray={`${progress}, 100`}
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </div>
                        {project.client_name && (
                            <span className="project-card__client">{project.client_name}</span>
                        )}
                    </div>
                </div>

                {/* Body: description */}
                {(project.description && variant === 'list') && (
                    <div className="project-card__body">
                        <p className="project-card__description">{project.description}</p>
                    </div>
                )}

                {/* Footer: status + badges + info */}
                <div className="project-card__footer">
                    <div className="project-card__meta">
                        <Badge variant={status.variant as any}>{status.label}</Badge>
                        {priority && (
                            <span className={`project-card__priority ${priority.class}`}>
                                {priority.label}
                            </span>
                        )}
                    </div>
                    <div className="project-card__info">
                        {dueDate && (
                            <span className={`project-card__due ${isOverdue ? 'project-card__due--overdue' : ''}`}>
                                <Icon name="timeline" size={14} />
                                {dueDate}
                            </span>
                        )}
                        {memberCount > 0 && (
                            <span className="project-card__members">
                                <Icon name="users" size={14} />
                                {memberCount}
                            </span>
                        )}
                </div>
                </div>
            </div>

            {/* Delete dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Project</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{project.name}</strong>? This will
                            permanently remove all tasks, milestones, and files. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowDeleteDialog(false)} disabled={deleteMutation.isPending}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={handleDelete} loading={deleteMutation.isPending}>
                            {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export const ProjectCard = memo(ProjectCardComponent);

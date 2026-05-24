'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/src/store/hooks';
import { setSidebarView } from '@/src/store/slices/layoutSlice';
import { Icon, UserAvatar, Badge } from '@/src/components/shared/ui';
import { Button } from '@/src/components/shared/ui/Button';
import { useWorkspacePath } from '@/src/hooks/useWorkspacePath';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/src/components/shared/ui/DropdownMenu';

interface Assignee {
    user_id: string;
    name?: string;
    username?: string;
    avatar_url?: string;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority?: string;
    assignee_id?: string;
    assignee_name?: string;
    assignees?: Assignee[];
    due_date?: string;
    time_estimate?: number;
    time_logged?: number;
    comment_count?: number;
    subtask_count?: number;
    project_name?: string;
    project_id?: string;
    milestone_name?: string;
    milestone_id?: string;
    avatar_url?: string;
    user_id?: string;
    username?: string;
    name?: string;
}

interface TaskCardProps {
    task: Task;
    variant?: 'kanban' | 'list';
    selected?: boolean;
    onSelect?: () => void;
    onDragStart?: () => void;
}

const priorityConfig: Record<string, { label: string; class: string }> = {
    low: { label: 'Low', class: 'task-card__priority--low' },
    medium: { label: 'Medium', class: 'task-card__priority--medium' },
    high: { label: 'High', class: 'task-card__priority--high' },
    critical: { label: 'Critical', class: 'task-card__priority--critical' },
    urgent: { label: 'Urgent', class: 'task-card__priority--critical' },
};

const statusConfig: Record<string, { label: string; class: string }> = {
    open: { label: 'Open', class: 'task-card__status--open' },
    in_progress: { label: 'In Progress', class: 'task-card__status--in-progress' },
    review: { label: 'In Review', class: 'task-card__status--in-review' },
    completed: { label: 'Completed', class: 'task-card__status--completed' },
    blocked: { label: 'Blocked', class: 'task-card__status--blocked' },
    back_log: { label: 'Backlog', class: 'task-card__status--backlog' },
};

function TaskCardComponent({ task, variant = 'kanban', selected, onSelect, onDragStart }: TaskCardProps) {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const workspacePath = useWorkspacePath();
    const priority = task.priority ? priorityConfig[task.priority] : null;
    const status = statusConfig[task.status] || statusConfig.open;

    const dueDate = task.due_date
        ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : null;

    const isOverdue = task.due_date &&
        new Date(task.due_date) < new Date() &&
        task.status !== 'completed';

    const hasAssignees = task.assignees && task.assignees.length > 0;
    const displayAssignees = task.assignees?.slice(0, 3) || [];
    const extraAssigneeCount = (task.assignees?.length || 0) - 3;
    const hasSingleAssignee = !hasAssignees && task.assignee_name;

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        dispatch(setSidebarView({ view: 'task-detail', data: { taskId: task.id } }));
    };

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('taskId', task.id);
        onDragStart?.();
    };

    const cardClasses = [
        'task-card',
        `task-card--${variant}`,
        selected && 'task-card--selected',
    ].filter(Boolean).join(' ');

    return (
        <div
            className={cardClasses}
            draggable={variant === 'kanban'}
            onClick={handleClick}
            onDragStartCapture={handleDragStart}

        >
            {/* Selection checkbox */}
            {onSelect && (
                <button
                    className="task-card__select"
                    onClick={(e) => { e.stopPropagation(); onSelect(); }}
                    aria-label={selected ? 'Deselect' : 'Select'}
                >
                    {selected ? <Icon name="check" size={12} /> : null}
                </button>
            )}

            <div className="task-card__content">
                <div className="task-card__header">
                    <h4 className="task-card__title">{task.title}</h4>
                    <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost" iconOnly size="xs"
                                    leftIcon="more-vertical"
                                    className="task-card__menu"
                                    aria-label="Task actions"
                                />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" size="sm">
                                <DropdownMenuItem
                                    icon="eye"
                                    onSelect={() => dispatch(setSidebarView({ view: 'task-detail', data: { taskId: task.id } }))}
                                >
                                    View Details
                                </DropdownMenuItem>
                                {task.project_id && (
                                    <DropdownMenuItem
                                        icon="folder"
                                        onSelect={() => router.push(workspacePath(`projects/${task.project_id}`))}
                                    >
                                        Go to Project
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem icon="trash" variant="danger">
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {task.description && (
                    <div className="task-card__body">
                        <p className="task-card__description">{task.description}</p>
                    </div>
                )}

                <div className="task-card__meta">
                    {variant === 'list' && (
                        <Badge size="sm" className={status.class}>{status.label}</Badge>
                    )}

                    {priority && (
                        <span className={`task-card__priority ${priority.class}`}>
                            {priority.label}
                        </span>
                    )}

                    {task.milestone_name && (
                        <span className="task-card__milestone" title={`Milestone: ${task.milestone_name}`}>
                            <Icon name="target" size={12} />
                            {task.milestone_name}
                        </span>
                    )}

                    {dueDate && (
                        <span className={`task-card__due ${isOverdue ? 'task-card__due--overdue' : ''}`}>
                            <Icon name="timeline" size={12} />
                            {dueDate}
                        </span>
                    )}

                    {(task.subtask_count || 0) > 0 && (
                        <span className="task-card__count" title="Subtasks">
                            <Icon name="list-checks" size={12} />
                            {task.subtask_count}
                        </span>
                    )}

                    {(task.comment_count || 0) > 0 && (
                        <span className="task-card__count" title="Comments">
                            <Icon name="send" size={12} />
                            {task.comment_count}
                        </span>
                    )}

                    {task.time_logged !== undefined && task.time_logged > 0 && (
                        <span className="task-card__count" title="Time logged">
                            <Icon name="timeline" size={12} />
                            {task.time_logged}h
                        </span>
                    )}
                </div>

                <div className="task-card__footer">
                    {task.project_name && (
                        <span className="task-card__project">
                            <Icon name="folder" size={12} />
                            {task.project_name}
                        </span>
                    )}

                    {hasAssignees && (
                        <div className="task-card__assignees">
                            {displayAssignees.map((assignee) => (
                                <UserAvatar
                                    key={assignee.user_id}
                                    name={assignee.name}
                                    username={assignee.username}
                                    avatarUrl={assignee.avatar_url}
                                    size="xs"
                                />
                            ))}
                            {extraAssigneeCount > 0 && (
                                <span className="task-card__extra-count">+{extraAssigneeCount}</span>
                            )}
                        </div>
                    )}
                    {/* 
                    {hasSingleAssignee && (
                        <div className="task-card__assignees">
                            <UserAvatar
                                key={task.user_id}
                                name={task.name}
                                avatarUrl={task.avatar_url}
                                size="xs"
                            />
                        </div>
                    )} */}
                </div>
            </div>
        </div>
    );
}

export const TaskCard = memo(TaskCardComponent);

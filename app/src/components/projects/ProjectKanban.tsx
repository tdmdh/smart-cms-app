'use client';

import { memo, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    useProjectKanban,
    useMoveTask,
    useMilestones,
    useDeleteTask,
    useKanbanColumns,
    useCreateKanbanColumn,
    useUpdateKanbanColumn,
    useDeleteKanbanColumn,
} from '@/src/hooks/queries/project-management';
import type { KanbanColumn } from '@/src/hooks/queries/project-management';
import { useProjectWebSocket } from '@/src/providers/WebSocketProvider';
import { useAppDispatch } from '@/src/store/hooks';
import { setSidebarView } from '@/src/store/slices/layoutSlice';
import { UserAvatar, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Skeleton, useToast, Button, Icon, EmptyState } from '@/src/components/shared/ui';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/src/components/shared/ui/DropdownMenu';
import { TaskQuickEditModal } from './TaskQuickEditModal';
import KanbanColumnModal from './KanbanColumnModal';
import type { MilestoneStatus } from '@/src/types/milestone';


interface TaskAssignee {
    user_id: string;
    name: string;
    username: string;
    avatar_url?: string;
}

interface Task {
    id: string;
    title: string;
    description?: string;
    priority?: string;
    milestone_id?: string;
    milestone_name?: string;
    assignee_name?: string; // Deprecated
    assignees?: TaskAssignee[];
    due_date?: string;
    subtask_count?: number;
    comment_count?: number;
}

interface Column {
    status: string;
    title: string;
    tasks: Task[];
}

interface Milestone {
    id: string;
    name?: string;
    title?: string;
    status?: MilestoneStatus;
    total_tasks?: number;
    completed_tasks?: number;
}

interface ProjectKanbanProps {
    projectId: string;
}

const priorityColors: Record<string, string> = {
    low: 'task-card__priority--low',
    medium: 'task-card__priority--medium',
    high: 'task-card__priority--high',
    critical: 'task-card__priority--urgent',
};

// Utility: derive a readable text color (black or white) for a given background hex
function getContrastColor(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
}

// --------------------------------------------------------------------------
// ProjectKanbanHeader Component
// --------------------------------------------------------------------------

interface TaskCounts {
    open: number;
    in_progress: number;
    review: number;
    blocked: number;
    completed: number;
    total: number;
}

function ProjectKanbanHeader({
    taskCounts,
    onAddTask,
    onCreateColumn,
    hasColumns,
    milestones,
    selectedMilestoneId,
    onMilestoneSelect,
}: {
    taskCounts: TaskCounts;
    onAddTask: () => void;
    onCreateColumn: () => void;
    hasColumns: boolean;
    milestones: Milestone[];
    selectedMilestoneId: string | undefined;
    onMilestoneSelect: (id: string | undefined) => void;
}) {
    const selectedMilestone = milestones.find(m => m.id === selectedMilestoneId);
    const totalTasks = selectedMilestone?.total_tasks || 0;
    const progress = selectedMilestone?.total_tasks
        ? Math.round((selectedMilestone.completed_tasks || 0) / selectedMilestone.total_tasks * 100)
        : 0;

    return (
        <div className="project-kanban__header">
            <div className="project-kanban__header-left">
                {taskCounts.total > 0 && (
                    <div className="project-kanban__stats">
                        {taskCounts.completed > 0 && (
                            <span className="project-kanban__stat project-kanban__stat--success">
                                <Icon name='success' size={12} />
                                {taskCounts.completed}
                            </span>
                        )}
                        {taskCounts.in_progress > 0 && (
                            <span className="project-kanban__stat project-kanban__stat--info">
                                <Icon name="play-circle" size={12} />
                                {taskCounts.in_progress}
                            </span>
                        )}
                        {taskCounts.review > 0 && (
                            <span className="project-kanban__stat project-kanban__stat--warning">
                                <Icon name="eye" size={12} />
                                {taskCounts.review}
                            </span>
                        )}
                        {taskCounts.open > 0 && (
                            <span className="project-kanban__stat project-kanban__stat--default">
                                <Icon name="clock" size={12} />
                                {taskCounts.open}
                            </span>
                        )}
                        {taskCounts.blocked > 0 && (
                            <span className="project-kanban__stat project-kanban__stat--danger">
                                <Icon name="alert-circle" size={12} />
                                {taskCounts.blocked}
                            </span>
                        )}
                    </div>
                )}
            </div>
            <div className="project-kanban__header-actions">
                {milestones.length > 0 && (
                    <div className="project-kanban__filter">
                         {selectedMilestone && totalTasks > 0 && (
                            <div className=' pl-2'>
                                    <div className="project-card__circular-progress" title={`${selectedMilestone.completed_tasks}/${selectedMilestone.total_tasks} tasks completed`}>
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
                            </div>
                                )}
                        <Select value={selectedMilestoneId || 'all'} onValueChange={(v) => onMilestoneSelect(v === 'all' ? undefined : v)}>
                            <SelectTrigger className="project-kanban__filter-select">
                                <Icon name="target" size={14} />
                                <SelectValue placeholder="All Milestones" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Milestones</SelectItem>
                                {milestones.map(m => (
                                    <SelectItem key={m.id} value={m.id}>
                                        <span className="project-kanban__filter-option">
                                            {m.name || m.title}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                <Button
                    variant="secondary"
                    size="xs"
                    iconSize={14}
                    onClick={onCreateColumn}
                    rightIcon={'plus'}
                >
                    Add Column
                </Button>
                {hasColumns && (
                    <Button
                        variant="primary"
                        size="xs"
                        iconSize={14}
                        onClick={onAddTask}
                        rightIcon={'plus'}
                    >
                        Add Task
                    </Button>
                )}
            </div>
        </div>
    );
}

// --------------------------------------------------------------------------
// TaskCard Component
// --------------------------------------------------------------------------




function TaskCard({ task, onDragStart, columnColor, milestones, onQuickEdit }: { task: Task; onDragStart: () => void; columnColor?: string; milestones?: Milestone[]; onQuickEdit?: (taskId: string) => void }) {
    const handleClick = () => {
        if (onQuickEdit) {
            onQuickEdit(task.id);
        }
    };

    const hasAssignees = task.assignees && task.assignees.length > 0;
    const displayAssignees = task.assignees?.slice(0, 3) || [];
    const extraAssigneeCount = (task.assignees?.length || 0) - 3;

    const milestoneName = task.milestone_name ||
        (task.milestone_id && milestones?.find(m => m.id === task.milestone_id)?.name);

    return (
        <motion.div
            layout
            className="task-card"
            draggable
            onDragStart={onDragStart}
            onClick={handleClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            {/* <div className="task-card__grip">
                <GripVertical size={14} />
            </div> */}
            <div className="task-card__content">
                <h4 className="task-card__title">{task.title}</h4>
                {task.description && (
                    <p className="task-card__description">{task.description}</p>
                )}
                <div className="task-card__meta">
                    {task.priority && (
                        <span className={`task-card__priority ${priorityColors[task.priority] || ''}`}>
                            {task.priority}
                        </span>
                    )}
                    {/* Milestone badge */}
                    {milestoneName && (
                        <span className="task-card__milestone" title={`Milestone: ${milestoneName}`}>
                            <Icon name="target" size={12} />
                            {milestoneName}
                        </span>
                    )}
                    {/* Due date badge */}
                    {task.due_date && (
                        <span
                            className={`task-card__due-date ${new Date(task.due_date) < new Date() ? 'task-card__due-date--overdue' : ''}`}
                            title={`Due: ${new Date(task.due_date).toLocaleDateString()}`}
                        >
                            <Icon name="calendar-days" size={12} />
                            {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                    )}
                    {/* Count badges */}
                    {(task.subtask_count || 0) > 0 && (
                        <span className="task-card__count--subtasks" title="Subtasks">
                            <Icon name="list-checks" size={12} />
                            {task.subtask_count}
                        </span>
                    )}
                    {(task.comment_count || 0) > 0 && (
                        <span className="task-card__count--comments" title="Comments">
                            <Icon name="message-square" size={12} />
                            {task.comment_count}
                        </span>
                    )}
                </div>
            </div>
            {/* Assignee avatars */}
            {hasAssignees && (
                <div className="task-card__assignees">
                    {displayAssignees.map((assignee, index) => (
                        <UserAvatar
                            key={assignee.user_id}
                            name={assignee.name}
                            username={assignee.username}
                            avatarUrl={assignee.avatar_url}
                            size="xs"
                            className={index > 0 ? '-ml-1.5' : ''}
                        />
                    ))}
                    {extraAssigneeCount > 0 && (
                        <span className="task-card__extra-count">+{extraAssigneeCount}</span>
                    )}
                </div>
            )}
        </motion.div>
    );
}

function KanbanColumnCard({
    column,
    projectId,
    milestoneId,
    onDrop,
    milestones,
    onQuickEdit,
    onEditColumn,
    onDeleteColumn,
}: {
    column: KanbanColumn & { tasks: Task[] };
    projectId: string;
    milestoneId?: string;
    onDrop: (taskId: string, columnId: string) => void;
    milestones?: Milestone[];
    onQuickEdit?: (taskId: string) => void;
    onEditColumn: (col: KanbanColumn) => void;
    onDeleteColumn: (col: KanbanColumn) => void;
}) {
    const [isDragOver, setIsDragOver] = useState(false);
    const dispatch = useAppDispatch();


    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };
    const handleDragLeave = () => setIsDragOver(false);
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const taskId = e.dataTransfer.getData('taskId');
        if (taskId) onDrop(taskId, column.id);
    };
    const handleAddTask = () => {
        dispatch(setSidebarView({ view: 'task-form', data: { projectId, milestoneId } }));
    };

    return (
        <div
            className={`kanban-column ${isDragOver ? 'kanban-column--drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div
                className="kanban-column__header"
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                    <span
                        className="kanban-column__color-dot"
                        style={{ backgroundColor: column.color }}
                    />
                    <h3 className="kanban-column__title" style={{ color: column.color }}>
                        {column.name}
                        <span className="kanban-column__count">{column.tasks.length}</span>
                    </h3>
                </div>
                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <button className="kanban-column__add" onClick={handleAddTask} title="Add task">
                        <Icon name="plus" size={14} />
                    </button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                iconOnly
                                leftIcon="more-vertical"
                                size="xs"
                                iconSize={12}
                                aria-label="Project actions"
                            />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem icon='edit'  onClick={() => onEditColumn(column)}>
                                Edit Column
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                icon='trash'
                                onClick={() => onDeleteColumn(column)}
                                variant="danger"
                            >
                                Delete Column
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            <div className="kanban-column__tasks">
                {(column.tasks as Task[]).map((task: Task) => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        columnColor={column.color}
                        onDragStart={() => {
                            const event = window.event as DragEvent | undefined;
                            event?.dataTransfer?.setData('taskId', task.id);
                        }}
                        milestones={milestones}
                        onQuickEdit={onQuickEdit}
                    />
                ))}
                {column.tasks.length === 0 && (
                    <div className="py-6 w-full">
                        <EmptyState icon="list-checks" title="No tasks" size="compact" />
                    </div>
                )}
            </div>
        </div>
    );
}

function ProjectKanbanComponent({ projectId }: ProjectKanbanProps) {
    const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | undefined>(undefined);
    const [quickEditTaskId, setQuickEditTaskId] = useState<string | null>(null);

    // Column management state
    const [columnModalOpen, setColumnModalOpen] = useState(false);
    const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null);
    const [deletingColumn, setDeletingColumn] = useState<KanbanColumn | null>(null);

    // Data fetching
    const { data: kanbanData, isLoading: kanbanLoading } = useProjectKanban(projectId, selectedMilestoneId);
    const { data: columnsData, isLoading: columnsLoading } = useKanbanColumns(projectId);
    const { data: milestonesData } = useMilestones(projectId);

    // Mutations
    const moveTask = useMoveTask();
    const createColumn = useCreateKanbanColumn(projectId);
    const updateColumn = useUpdateKanbanColumn(projectId, editingColumn?.id ?? '');
    const deleteColumn = useDeleteKanbanColumn(projectId);

    const dispatch = useAppDispatch();
    useProjectWebSocket(projectId);

    const handleQuickEdit = useCallback((taskId: string) => setQuickEditTaskId(taskId), []);
    const handleCloseQuickEdit = useCallback(() => setQuickEditTaskId(null), []);
    const handleAddTask = () => dispatch(setSidebarView({ view: 'task-form', data: { projectId, milestoneId: selectedMilestoneId } }));
    const handleCreateColumn = useCallback(() => {
        setEditingColumn(null);
        setColumnModalOpen(true);
    }, []);

    const milestones = useMemo(() => (milestonesData?.milestones ?? []) as Milestone[], [milestonesData?.milestones]);

    // Build columns: use server-fetched dynamic columns, with tasks from kanban endpoint matched by column id
    const columns = useMemo((): (KanbanColumn & { tasks: Task[] })[] => {
        const apiCols: KanbanColumn[] = columnsData ?? [];
        const kanbanCols = (kanbanData?.columns ?? []) as (KanbanColumn & { tasks?: Task[] })[];

        return apiCols.map(col => {
            const matching = kanbanCols.find(k => k.id === col.id);
            return { ...col, tasks: (matching?.tasks ?? []) as Task[] };
        });
    }, [columnsData, kanbanData]);

    const taskCounts = useMemo((): TaskCounts => {
        const counts: TaskCounts = { open: 0, in_progress: 0, review: 0, blocked: 0, completed: 0, total: 0 };
        columns.forEach(col => { counts.total += col.tasks.length; });
        return counts;
    }, [columns]);

    const handleDrop = (taskId: string, newColumnId: string) => {
        moveTask.mutate({ id: taskId, data: { new_status: newColumnId, new_column_id: newColumnId } });
    };

    const isLoading = kanbanLoading || columnsLoading;
    if (isLoading) {
        return (
            <div className="flex flex-col gap-4">
                <Skeleton className="w-64 h-18 rounded-4xl flex items-center justify-between opacity-50 bg-gray-200" />
                <div className="project-kanban project-kanban--loading">
                    {[1, 2, 3, 4, 5].map(i => (
                        <Skeleton key={i} className="kanban-column kanban-column--skeleton">
                            <div className="kanban-column__header-skeleton" />
                            <div className="kanban-column__tasks">
                                {[1, 2].map(j => (
                                    <Skeleton key={j} className="task-card task-card--skeleton" />
                                ))}
                            </div>
                        </Skeleton>
                    ))}
                </div>
            </div>
        );
    }

    const isEmpty = columns.length === 0;
    return (
        <div className="project-kanban-wrapper">
            <ProjectKanbanHeader
                taskCounts={taskCounts}
                onAddTask={handleAddTask}
                onCreateColumn={handleCreateColumn}
                hasColumns={columns.length > 0}
                milestones={milestones}
                selectedMilestoneId={selectedMilestoneId}
                onMilestoneSelect={setSelectedMilestoneId}
            />

            {isEmpty ? (
                <EmptyState
                    title="No Columns"
                    description="Create your first column to start organizing tasks."
                    icon="columns"
                    cta={{
                        label: 'Create First Column',
                        onClick: handleCreateColumn,
                    }}
                />
            ) : (
                <div
                    className="project-kanban"
                    style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(260px, 1fr))` }}
                >
                    {columns.map(column => (
                        <KanbanColumnCard
                            key={column.id}
                            column={column}
                            projectId={projectId}
                            milestoneId={selectedMilestoneId}
                            onDrop={handleDrop}
                            milestones={milestones}
                            onQuickEdit={handleQuickEdit}
                            onEditColumn={(col) => { setEditingColumn(col); setColumnModalOpen(true); }}
                            onDeleteColumn={(col) => setDeletingColumn(col)}
                        />
                    ))}
                </div>
            )}
            
            {/* Kanban Column Modal (create / edit) */}
            <KanbanColumnModal
                isOpen={columnModalOpen}
                onClose={() => { setColumnModalOpen(false); setEditingColumn(null); }}
                column={editingColumn}
                isLoading={createColumn.isPending || updateColumn.isPending}
                onSubmit={(data) => {
                    if (editingColumn) {
                        updateColumn.mutate(data, {
                            onSuccess: () => { setColumnModalOpen(false); setEditingColumn(null); },
                        });
                    } else {
                        createColumn.mutate({
                            ...data,
                            position: columns.length,
                        }, {
                            onSuccess: () => setColumnModalOpen(false),
                        });
                    }
                }}
            />

            {/* Delete Confirmation Modal */}
            <KanbanColumnModal
                isOpen={!!deletingColumn}
                onClose={() => setDeletingColumn(null)}
                column={deletingColumn}
                isDeleteConfirm
                isLoading={deleteColumn.isPending}
                onSubmit={() => {}}
                onDelete={() => {
                    if (deletingColumn) {
                        deleteColumn.mutate(deletingColumn.id, {
                            onSuccess: () => setDeletingColumn(null),
                        });
                    }
                }}
            />

            <TaskQuickEditModal
                taskId={quickEditTaskId}
                projectId={projectId}
                isOpen={quickEditTaskId !== null}
                onClose={handleCloseQuickEdit}
            />
        </div>
    );
}

export const ProjectKanban = memo(ProjectKanbanComponent);

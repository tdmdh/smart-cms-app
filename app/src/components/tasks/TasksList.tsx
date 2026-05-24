'use client';

import { memo, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserTasks } from '@/src/hooks/queries/project-management';
import { useAppDispatch } from '@/src/store/hooks';
import { setSidebarView } from '@/src/store/slices/layoutSlice';
import { useDebounce } from '@/src/hooks/useDebounce';
import { Input } from '@/src/components/shared/ui/Input';
import { Button } from '@/src/components/shared/ui/Button';
import { Icon } from '@/src/components/shared/ui/Icon';
import EmptyState from '@/src/components/shared/ui/EmptyState';
import { Skeleton } from '@/src/components/shared/ui/Skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/src/components/shared/ui/Select';
import { DashboardListPage, type BulkAction } from '@/src/components/shared/DashboardListPage';
import { TaskCard, type Task } from '@/src/components/tasks/TaskCard';

type ViewMode = 'list' | 'board';
type GroupBy = 'none' | 'project' | 'priority' | 'due';

const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'review', label: 'In Review' },
    { value: 'completed', label: 'Completed' },
    { value: 'blocked', label: 'Blocked' },
];

const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
];

const groupByOptions = [
    { value: 'none', label: 'No Grouping' },
    { value: 'project', label: 'By Project' },
    { value: 'priority', label: 'By Priority' },
    { value: 'due', label: 'By Due Date' },
];

const boardColumns = [
    { key: 'open', label: 'Open' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'review', label: 'In Review' },
    { key: 'completed', label: 'Completed' },
];

function getDueGroup(task: Task): string {
    if (!task.due_date) return 'No Due Date';
    const now = new Date();
    const due = new Date(task.due_date);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const diffDays = Math.ceil((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays <= 7) return 'This Week';
    return 'Later';
}

function groupTasks(tasks: Task[], groupBy: GroupBy): Map<string, Task[]> {
    const groups = new Map<string, Task[]>();
    if (groupBy === 'none') {
        groups.set('all', tasks);
        return groups;
    }

    for (const task of tasks) {
        let key: string;
        switch (groupBy) {
            case 'project':
                key = task.project_name || 'No Project';
                break;
            case 'priority':
                key = task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'None';
                break;
            case 'due':
                key = getDueGroup(task);
                break;
            default:
                key = 'all';
        }
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(task);
    }

    return groups;
}

function TasksListComponent() {
    const dispatch = useAppDispatch();
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [groupBy, setGroupBy] = useState<GroupBy>('none');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery);
    const [page, setPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const pageSize = 50;

    const { data, isLoading, isError } = useUserTasks({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        page,
        page_size: pageSize,
    });

    const allTasks = (data?.tasks || []) as Task[];
    const pagination = data?.pagination as { total_items?: number; total_pages?: number } | undefined;

    const tasks = useMemo(() => {
        if (!debouncedSearch.trim()) return allTasks;
        const q = debouncedSearch.toLowerCase();
        return allTasks.filter(
            t => t.title.toLowerCase().includes(q) ||
                t.project_name?.toLowerCase().includes(q) ||
                t.description?.toLowerCase().includes(q)
        );
    }, [allTasks, debouncedSearch]);

    const statusCounts = useMemo(() => ({
        total: allTasks.length,
        in_progress: allTasks.filter(t => t.status === 'in_progress').length,
        completed: allTasks.filter(t => t.status === 'completed').length,
        overdue: allTasks.filter(t =>
            t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
        ).length,
    }), [allTasks]);

    const handleTaskClick = useCallback((taskId: string) => {
        dispatch(setSidebarView({ view: 'task-detail', data: { taskId }, width: 'xl' }));
    }, [dispatch]);

    const toggleSelection = useCallback((taskId: string) => {
        setSelectedIds(prev =>
            prev.includes(taskId)
                ? prev.filter(id => id !== taskId)
                : [...prev, taskId]
        );
    }, []);

    const bulkActions: BulkAction[] = useMemo(() => [
        {
            label: 'Mark Complete',
            variant: 'primary' as const,
            onClick: (ids: string[]) => {
                // TODO: wire to useBulkUpdateTaskStatus
                console.log('bulk complete', ids);
                setSelectedIds([]);
            },
        },
        {
            label: 'Delete',
            variant: 'danger' as const,
            onClick: (ids: string[]) => {
                console.log('bulk delete', ids);
                setSelectedIds([]);
            },
        },
    ], []);

    const taskGroups = useMemo(
        () => groupTasks(tasks, viewMode === 'board' ? 'none' : groupBy),
        [tasks, groupBy, viewMode]
    );

    const allTaskIds = useMemo(() => tasks.map(t => t.id), [tasks]);

    // Stats
    const stats = (
        <>
            <span className="project-team__stat project-team__stat--default">
                <Icon name="list-checks" size={12} />
                {statusCounts.total} task{statusCounts.total !== 1 ? 's' : ''}
            </span>
            {statusCounts.in_progress > 0 && (
                <span className="project-team__stat project-team__stat--warning">
                    <Icon name="activity" size={12} />
                    {statusCounts.in_progress} in progress
                </span>
            )}
            {statusCounts.completed > 0 && (
                <span className="project-team__stat project-team__stat--success">
                    <Icon name="check" size={12} />
                    {statusCounts.completed} done
                </span>
            )}
            {statusCounts.overdue > 0 && (
                <span className="project-team__stat project-team__stat--danger">
                    <Icon name="warning" size={12} />
                    {statusCounts.overdue} overdue
                </span>
            )}
        </>
    );

    // Actions
    const actions = (
        <>
            <Input
                leftIcon="search"
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />

            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    {statusOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setPage(1); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    {priorityOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {viewMode === 'list' && (
                <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {groupByOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            <div className="projects-list__view-toggle">
                <Button
                    variant="ghost" iconOnly size="xs"
                    leftIcon="list" iconSize={14}
                    aria-label="List view"
                    aria-pressed={viewMode === 'list'}
                    onClick={() => setViewMode('list')}
                    className={viewMode === 'list' ? 'is-active' : ''}
                />
                <Button
                    variant="ghost" iconOnly size="xs"
                    leftIcon="columns" iconSize={14}
                    aria-label="Board view"
                    aria-pressed={viewMode === 'board'}
                    onClick={() => setViewMode('board')}
                    className={viewMode === 'board' ? 'is-active' : ''}
                />
            </div>
        </>
    );

    if (isError) {
        return (
            <DashboardListPage stats={stats} actions={actions}>
                <EmptyState
                    icon="error"
                    title="Failed to load tasks"
                    description="Something went wrong. Please try again."
                    color="error"
                />
            </DashboardListPage>
        );
    }

    return (
        <DashboardListPage
            stats={stats}
            actions={actions}
            bulkActions={bulkActions}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            allItemIds={allTaskIds}
            totalItems={tasks.length}
        >
            {isLoading ? (
                <div className="tasks-page__grid">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="task-card task-card--skeleton" />
                    ))}
                </div>
            ) : tasks.length === 0 ? (
                <EmptyState
                    icon="list-checks"
                    title="No tasks found"
                    description={
                        searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                            ? 'Try adjusting your search or filters'
                            : 'You have no tasks assigned to you yet'
                    }
                />
            ) : viewMode === 'board' ? (
                /* Board view */
                <div className="tasks-board">
                    {boardColumns.map(col => {
                        const colTasks = tasks.filter(t => t.status === col.key);
                        return (
                            <div key={col.key} className="tasks-board__column">
                                <div className="tasks-board__column-header">
                                    <span className="tasks-board__column-title">{col.label}</span>
                                    <span className="tasks-board__column-count">{colTasks.length}</span>
                                </div>
                                <div className="tasks-board__column-body">
                                    {colTasks.map(task => (
                                        <TaskCard
                                            key={task.id}
                                            task={task}
                                            variant="kanban"
                                            selected={selectedIds.includes(task.id)}
                                            onSelect={() => toggleSelection(task.id)}
                                        />
                                    ))}
                                    {colTasks.length === 0 && (
                                        <div className="tasks-board__empty">No tasks</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* List view (with grouping) */
                <>
                    {Array.from(taskGroups.entries()).map(([group, groupedTasks]) => (
                        <div key={group} className="tasks-group">
                            {groupBy !== 'none' && (
                                <div className="tasks-group__header">
                                    <h3 className="tasks-group__title">{group}</h3>
                                    <span className="tasks-group__count">{groupedTasks.length}</span>
                                </div>
                            )}
                            <motion.div className="tasks-page__grid" layout>
                                <AnimatePresence mode="popLayout">
                                    {groupedTasks.map(task => (
                                        <motion.div
                                            key={task.id}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.15 }}
                                        >
                                            <TaskCard
                                                task={task}
                                                variant="list"
                                                selected={selectedIds.includes(task.id)}
                                                onSelect={() => toggleSelection(task.id)}
                                            />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        </div>
                    ))}

                    {pagination && pagination.total_pages && pagination.total_pages > 1 && (
                        <div className="tasks-page__pagination">
                            <Button
                                variant="ghost" size="xs"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                Previous
                            </Button>
                            <span className="tasks-page__pagination-info">
                                Page {page} of {pagination.total_pages}
                            </span>
                            <Button
                                variant="ghost" size="xs"
                                onClick={() => setPage(p => Math.min(pagination.total_pages!, p + 1))}
                                disabled={page === pagination.total_pages}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </>
            )}
        </DashboardListPage>
    );
}

export const TasksList = memo(TasksListComponent);

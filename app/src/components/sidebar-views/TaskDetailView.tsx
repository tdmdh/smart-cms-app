'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, User, Tag, Clock, Trash2, Plus, UserCircle, GitBranch, ArrowRight, Trash, BookOpen } from 'lucide-react';
import { useTask, useUpdateTask, useMoveTask, useDeleteTask, useProjectMembers, useSubtasks, useKanbanColumns } from '@/src/hooks/queries/project-management';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { closeAllViews, pushView, selectSidebarViewData, setSidebarView } from '@/src/store/slices/layoutSlice';
import { selectCurrentWorkspaceId } from '@/src/store/slices/workspaceSlice';
import { useEnqueueILCalculation } from '@/src/hooks/queries/cognitive-load';
import { CommentsSection } from '@/src/components/tasks/CommentsSection';
import { TimeTracker } from '@/src/components/tasks/TimeTracker';
import { CWBadge } from '@/src/components/shared/ui/CWBadge';
import { CoSignHistoryTab } from '@/src/components/cosign/CoSignHistoryTab';
import { Button, Icon, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Tabs, TabsContent, TabsList, TabsTrigger, Textarea } from '../shared/ui';

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
    status: string;
    column_id?: string;
    priority?: string;
    assignee_id?: string; // Deprecated
    assignees?: TaskAssignee[];
    assignee_name?: string;
    reporter_id?: string;
    reporter_name?: string;
    due_date?: string;
    start_date?: string;
    estimated_hours?: number;
    time_estimate?: number;
    project_id?: string;
    milestone_id?: string;
    parent_task_id?: string;
    subtask_count?: number;
    tags?: string[];
    intrinsic_load?: number;
    extraneous_load?: number;
    cognitive_weight?: number;
}

// Status options are driven by the project's kanban columns (loaded dynamically).

const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
];

export default function TaskDetailView() {
    const dispatch = useAppDispatch();

    const viewData = useAppSelector(selectSidebarViewData) as { taskId?: string } | null;
    const taskId = viewData?.taskId || null;
    const workspaceId = useAppSelector(selectCurrentWorkspaceId) ?? '';

    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');

    const { data, isLoading, isError } = useTask(taskId || '');
    const updateTask = useUpdateTask();
    const enqueueIL = useEnqueueILCalculation();
    const moveTask = useMoveTask();
    const deleteTask = useDeleteTask();

    const task = data?.task as Task | undefined;

    const { data: membersData } = useProjectMembers(task?.project_id || '');
    const members = (membersData?.members || []) as Array<{ user_id: string; name: string; username: string }>;

    const { data: kanbanColumns } = useKanbanColumns(task?.project_id || '');
    const columns = kanbanColumns ?? [];

    const { data: subtasksData } = useSubtasks(taskId || '');
    const subtasks = (subtasksData?.tasks || []) as Task[];

    useEffect(() => {
        if (task) {
            setEditTitle(task.title);
            setEditDescription(task.description || '');
        }
    }, [task]);

    const handleClose = () => {
        dispatch(closeAllViews());
    };

    const handleDelete = () => {
        if (!taskId || !confirm('Are you sure you want to delete this task?')) return;

        deleteTask.mutate(taskId, {
            onSuccess: () => {
                dispatch(closeAllViews());
            }
        });
    };

    const handleSave = () => {
        if (!taskId) return;
        updateTask.mutate(
            { id: taskId, data: { title: editTitle, description: editDescription } },
            {
                onSuccess: () => {
                    setIsEditing(false);
                    enqueueIL.mutate({ taskId, title: editTitle, description: editDescription });
                }
            }
        );
    };

    const handleStatusChange = (columnId: string) => {
        if (!taskId) return;
        // Pass the column_id as new_status — the service detects UUID and routes to column move.
        moveTask.mutate({ id: taskId, data: { new_status: columnId, new_column_id: columnId } });
    };

    const handlePriorityChange = (newPriority: string) => {
        if (!taskId) return;
        updateTask.mutate({ id: taskId, data: { priority: newPriority } });
    };

    const handleAssigneeChange = (newAssigneeId: string) => {
        if (!taskId) return;
        updateTask.mutate({ id: taskId, data: { assignee_ids: newAssigneeId ? [newAssigneeId] : [] } });
    };

    const handleCreateSubtask = () => {
        if (!task?.project_id || !taskId) return;
        dispatch(pushView({
            view: 'task-subtask-form',
            data: { projectId: task.project_id, parentTaskId: taskId }
        }));
    };

    const handleShowKnowledgeContext = () => {
        if (!task?.project_id || !taskId) return;
        const keywords = [task.title, task.description].filter(Boolean).join(' ');
        dispatch(setSidebarView({
            view: 'task-knowledge-context',
            data: { taskId, projectId: task.project_id, keywords },
        }));
    };

    const handleViewSubtask = (subtaskId: string) => {
        dispatch(pushView({
            view: 'task-subtask-detail',
            data: { taskId: subtaskId }
        }));
    };

    if (!taskId) {
        return (
            <div className="task-detail task-detail--empty">
                <p>No task selected</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="task-detail task-detail--loading">
                <div className="task-detail__skeleton" />
            </div>
        );
    }

    if (isError || !task) {
        return (
            <div className="task-detail task-detail--error">
                <p>Failed to load task</p>
            </div>
        );
    }

    const dueDate = task.due_date
        ? new Date(task.due_date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        })
        : null;

    return (
        <div className="task-detail">
            <div className="task-detail__actions-bar">
                <Button onClick={handleDelete} variant="danger">Delete</Button>
                <Button
                    variant="ghost"
                    onClick={handleShowKnowledgeContext}
                    title="Show knowledge context for this task"
                >
                    <BookOpen size={15} /> Context
                </Button>
            </div>

            <Tabs defaultValue="details">
                <TabsList>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="cosign">Co-Sign History</TabsTrigger>
                </TabsList>

                <TabsContent value="details">
                    <div className="task-detail__header">
                        {isEditing ? (
                            <Input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                autoFocus
                            />
                        ) : (
                            <h2
                                className="task-detail__title"
                                onClick={() => setIsEditing(true)}
                            >
                                {task.title}
                            </h2>
                        )}
                    </div>

                    <div className="task-detail__status-bar">
                        {columns.map(col => {
                            const isActive = task.column_id === col.id;
                            return (
                                <button
                                    key={col.id}
                                    className={`task-detail__status-btn ${isActive ? 'is-active' : ''}`}
                                    onClick={() => handleStatusChange(col.id)}
                                    style={isActive ? { borderColor: col.color, color: col.color } : undefined}
                                >
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: col.color, display: 'inline-block', flexShrink: 0 }} />
                                    {col.name}
                                </button>
                            );
                        })}
                    </div>

                    <div className="task-detail__body">
                        <div className="task-detail__section">
                            <h4>Description</h4>
                            {isEditing ? (
                                <Textarea
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    rows={4}
                                    placeholder="Add a description..."
                                />
                            ) : (
                                <p
                                    className="task-detail__description"
                                    onClick={() => setIsEditing(true)}
                                >
                                    {task.description || 'Click to add description...'}
                                </p>
                            )}
                            {isEditing && (
                                <div className="task-detail__edit-actions">
                                    <Button variant="ghost" onClick={() => setIsEditing(false)} className="btn btn--ghost btn--sm">Cancel</Button>
                                    <Button onClick={handleSave} className="btn btn--primary btn--sm">Save</Button>
                                </div>
                            )}
                        </div>

                        <div className="task-detail__meta-grid">
                            <div className="task-detail__meta-item">
                                <Tag size={14} />
                                <span className="task-detail__meta-label">Priority</span>
                                <Select
                                    value={task.priority || 'medium'}
                                    onValueChange={(value) => handlePriorityChange(value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {priorityOptions.map(opt => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="task-detail__meta-item">
                                <User size={14} />
                                <span className="task-detail__meta-label">Assignee</span>
                                <Select
                                    value={task.assignee_id || ''}
                                    onValueChange={(value) => handleAssigneeChange(value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an assignee" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {members.map(member => (
                                            <SelectItem key={member.user_id} value={member.user_id}>
                                                {member.name || member.username}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {dueDate && (
                                <div className="task-detail__meta-item">
                                    <Calendar size={14} />
                                    <span className="task-detail__meta-label">Due Date</span>
                                    <span className="task-detail__meta-value">{dueDate}</span>
                                </div>
                            )}

                            {(task.time_estimate || task.estimated_hours) && (
                                <div className="task-detail__meta-item">
                                    <Clock size={14} />
                                    <span className="task-detail__meta-label">Estimate</span>
                                    <span className="task-detail__meta-value">{task.estimated_hours || task.time_estimate}h</span>
                                </div>
                            )}
                        </div>

                        {task.tags && task.tags.length > 0 && (
                            <div className="task-detail__tags">
                                <span className="task-detail__tags-label">Tags</span>
                                <div className="task-detail__tags-list">
                                    {task.tags.map((tag, index) => (
                                        <span key={index} className="task-detail__tag">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(task.intrinsic_load != null || task.extraneous_load != null || task.cognitive_weight != null) && (
                            <div className="task-detail__cw-row">
                                {task.intrinsic_load != null && (
                                    <CWBadge label="IL" value={task.intrinsic_load} tooltip="Intrinsic Load — complexity inherent to the task" />
                                )}
                                {task.extraneous_load != null && (
                                    <CWBadge label="EL" value={task.extraneous_load} tooltip="Extraneous Load — overhead from process and context switching" />
                                )}
                                {task.cognitive_weight != null && (
                                    <CWBadge label="CW" value={task.cognitive_weight} tooltip="Cognitive Weight — total load this task adds to the assignee" />
                                )}
                            </div>
                        )}

                        {task.reporter_name && (
                            <div className="task-detail__reporter">
                                <UserCircle size={14} />
                                <span className="task-detail__reporter-label">Created by</span>
                                <span className="task-detail__reporter-value">{task.reporter_name}</span>
                            </div>
                        )}

                        <div className="task-detail__subtasks">
                            <div className="task-detail__subtasks-header">
                                <div className="task-detail__subtasks-title">
                                    <span>Subtasks</span>
                                    {task.subtask_count !== undefined && task.subtask_count > 0 && (
                                        <span className="task-detail__subtasks-count">{task.subtask_count}</span>
                                    )}
                                </div>
                                <Button
                                    onClick={handleCreateSubtask}
                                    // className="btn btn--ghost btn--sm"
                                    title="Add Subtask"
                                    variant="ghost"
                                    size="sm"
                                    iconOnly
                                >
                                    <Plus size={14} />
                                </Button>
                            </div>
                            {subtasks.length > 0 ? (
                                <div className="task-detail__subtasks-list">
                                    {subtasks.map(subtask => (
                                        <button
                                            key={subtask.id}
                                            type="button"
                                            className="task-detail__subtask-item"
                                            onClick={() => handleViewSubtask(subtask.id)}
                                        >
                                            <span className={`task-detail__subtask-status task-detail__subtask-status--${subtask.status}`} />
                                            <span className="task-detail__subtask-title">{subtask.title}</span>
                                            <Icon name="chevron-right" dynamicIcon={{
                                                conditions: [
                                                    { when: subtask.status === 'completed', icon: 'check' },
                                                    { when: subtask.status === 'in_progress', icon: 'chevron-right' },
                                                    { when: subtask.status === 'todo', icon: 'chevron-right' },
                                                ],
                                                fallback: 'chevron-right'
                                            }} size={14} />
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="task-detail__subtasks-empty">No subtasks yet</p>
                            )}
                        </div>

                        <TimeTracker taskId={taskId} />

                        <CommentsSection taskId={taskId} />
                    </div>
                </TabsContent>

                <TabsContent value="cosign">
                    <CoSignHistoryTab
                        workspaceId={workspaceId}
                        referenceId={taskId}
                        referenceType="task"
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}

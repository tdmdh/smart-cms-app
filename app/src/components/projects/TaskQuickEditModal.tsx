'use client';

import { useState } from 'react';
import { Edit3, Calendar, Flag, Target, Loader2 } from 'lucide-react';
import { useTask, useUpdateTask, useMoveTask, useMilestones, useKanbanColumns } from '@/src/hooks/queries/project-management';
import { useAppDispatch } from '@/src/store/hooks';
import { setSidebarView } from '@/src/store/slices/layoutSlice';
import { useEnqueueILCalculation } from '@/src/hooks/queries/cognitive-load';
import { CWBadge } from '@/src/components/shared/ui/CWBadge';
import {
    Modal,
    ModalBody,
    Button,
    Form,
    FormGroup,
    FormLabel,
    FormInput,
    FormTextarea,
    FormActions,
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
    useToast,
} from '@/src/components/shared/ui';

interface TaskQuickEditModalProps {
    taskId: string | null;
    projectId: string;
    isOpen: boolean;
    onClose: () => void;
}

interface TaskData {
    id: string;
    title?: string;
    description?: string;
    status?: string;
    column_id?: string;
    priority?: string;
    milestone_id?: string;
    due_date?: string;
    intrinsic_load?: number;
    extraneous_load?: number;
    cognitive_weight?: number;
}

interface MilestoneData {
    id: string;
    name?: string;
    title?: string;
}

interface TaskFormState {
    title: string;
    description: string;
    columnId: string;
    priority: string;
    milestoneId: string;
    dueDate: string;
}

// Status options are loaded dynamically from the project's kanban columns.

const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
];

function getInitialTaskFormState(task?: TaskData): TaskFormState {
    return {
        title: task?.title || '',
        description: task?.description || '',
        columnId: '',  // will be resolved from task.column_id by the form
        priority: task?.priority || '',
        milestoneId: task?.milestone_id || '',
        dueDate: task?.due_date ? task.due_date.split('T')[0] : '',
    };
}

interface TaskQuickEditFormProps {
    task: TaskData;
    taskId: string;
    projectId: string;
    milestones: MilestoneData[];
    updateTask: ReturnType<typeof useUpdateTask>;
    moveTask: ReturnType<typeof useMoveTask>;
    onClose: () => void;
    onViewDetails: () => void;
}

function TaskQuickEditForm({
    task,
    taskId,
    projectId,
    milestones,
    updateTask,
    moveTask,
    onClose,
    onViewDetails,
}: TaskQuickEditFormProps) {
    const toast = useToast();
    const enqueueIL = useEnqueueILCalculation();
    const initialState = getInitialTaskFormState(task);
    const [title, setTitle] = useState(initialState.title);
    const [description, setDescription] = useState(initialState.description);
    const [columnId, setColumnId] = useState(task.column_id || '');
    const [priority, setPriority] = useState(initialState.priority);
    const [milestoneId, setMilestoneId] = useState(initialState.milestoneId);
    const [dueDate, setDueDate] = useState(initialState.dueDate);

    const handleContentBlur = () => {
        if (taskId) {
            enqueueIL.mutate({ taskId, title, description });
        }
    };

    const { data: kanbanColumns } = useKanbanColumns(projectId);
    const columns = kanbanColumns ?? [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateTask.mutateAsync({
                id: taskId,
                data: {
                    title,
                    description: description || undefined,
                    priority: priority || undefined,
                    milestone_id: milestoneId || undefined,
                    due_date: dueDate || undefined,
                },
            });

            const previousColumnId = task.column_id || '';
            if (columnId && columnId !== previousColumnId) {
                await moveTask.mutateAsync({
                    id: taskId,
                    data: { new_column_id: columnId, new_status: columnId },
                });
            }

            toast.success('Task updated successfully');
            onClose();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update task');
        }
    };

    return (
        <Form onSubmit={handleSubmit}>
            <ModalBody>
                <div className="">
                    {/* Title */}
                    <FormGroup>
                        <FormLabel htmlFor="title">Title</FormLabel>
                        <FormInput
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleContentBlur}
                            placeholder="Task title"
                            required
                        />
                    </FormGroup>

                    {/* Description */}
                    <FormGroup>
                        <FormLabel htmlFor="description">Description</FormLabel>
                        <FormTextarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            onBlur={handleContentBlur}
                            placeholder="Brief description (optional)"
                            rows={2}
                        />
                    </FormGroup>

                    {/* Cognitive Weight badges */}
                    {(task.intrinsic_load != null || task.extraneous_load != null || task.cognitive_weight != null) && (
                        <div className="quick-edit-modal__cw-row">
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

                    {/* Column / Status & Priority Row */}
                    <div className="quick-edit-modal__row">
                        <FormGroup>
                            <FormLabel htmlFor="column">Column / Status</FormLabel>
                            <Select value={columnId || (columns[0]?.id ?? '')} onValueChange={setColumnId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select column" />
                                </SelectTrigger>
                                <SelectContent>
                                    {columns.map((col) => (
                                        <SelectItem key={col.id} value={col.id}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: col.color, display: 'inline-block', flexShrink: 0 }} />
                                                {col.name}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormGroup>

                        <FormGroup>
                            <FormLabel htmlFor="priority">
                                 Priority
                            </FormLabel>
                            <Select value={priority || '_none'} onValueChange={(v) => setPriority(v === '_none' ? '' : v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_none">No Priority</SelectItem>
                                    {priorityOptions.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormGroup>
                    </div>

                    {/* Milestone & Due Date Row */}
                    <div className="quick-edit-modal__row">
                        <FormGroup>
                            <FormLabel htmlFor="milestone">
                                Milestone
                            </FormLabel>
                            <Select value={milestoneId || '_none'} onValueChange={(v) => setMilestoneId(v === '_none' ? '' : v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select milestone" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_none">No Milestone</SelectItem>
                                    {milestones.map((m) => (
                                        <SelectItem key={m.id} value={m.id}>
                                            {m.name || m.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormGroup>

                        <FormGroup>
                            <FormLabel htmlFor="dueDate">
                                Due Date
                            </FormLabel>
                            <FormInput
                                id="dueDate"
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </FormGroup>
                    </div>
                </div>
            </ModalBody>

            <FormActions className="modal__footer quick-edit-modal__footer">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onViewDetails}
                >
                    View Full Details
                </Button>
                <div className="quick-edit-modal__actions">
                    <Button
                        type="submit"
                        disabled={updateTask.isPending || moveTask.isPending || !title.trim()}
                        loading={updateTask.isPending || moveTask.isPending}
                    >
                        Save Changes
                    </Button>
                </div>
            </FormActions>
        </Form>
    );
}

export function TaskQuickEditModal({ taskId, projectId, isOpen, onClose }: TaskQuickEditModalProps) {
    const dispatch = useAppDispatch();

    // Only fetch when modal is open and we have a taskId
    const { data: taskResponse, isLoading: taskLoading } = useTask(taskId && isOpen ? taskId : '');
    const { data: milestonesResponse } = useMilestones(projectId);
    const updateTask = useUpdateTask();
    const moveTask = useMoveTask();

    // Type assertion for API response
    const task = (taskResponse as { task?: TaskData } | undefined)?.task;
    const milestones = ((milestonesResponse as { milestones?: MilestoneData[] } | undefined)?.milestones || []) as MilestoneData[];

    const handleViewDetails = () => {
        if (taskId) {
            dispatch(setSidebarView({ view: 'task-detail', data: { taskId }, width: 'xl' }));
            onClose();
        }
    };

    if (!taskId || !isOpen) return null;

    const formKey = task
        ? `${task.id}:${task.status || 'open'}:${task.due_date || 'none'}`
        : `task-${taskId}`;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Quick Edit Task"
            titleIcon={<Edit3 size={18} />}
            size="lg"
        >
            {taskLoading ? (
                <ModalBody>
                    <div className="quick-edit-modal__loading">
                        <Loader2 size={24} />
                        <span>Loading task...</span>
                    </div>
                </ModalBody>
            ) : (
                task ? (
                    <TaskQuickEditForm
                        key={formKey}
                        task={task}
                        taskId={taskId}
                        projectId={projectId}
                        milestones={milestones}
                        updateTask={updateTask}
                        moveTask={moveTask}
                        onClose={onClose}
                        onViewDetails={handleViewDetails}
                    />
                ) : null
            )}
        </Modal>
    );
}

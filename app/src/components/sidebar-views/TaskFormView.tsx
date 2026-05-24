'use client';

import { useState } from 'react';
import { Calendar, User, Flag, Target, Clock, Tag, X, Check } from 'lucide-react';
import {
    UserAvatar,
    Input,
    Textarea,
    Button,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    FormGroup,
    FormLabel,
    FormError,
    FormRow,
    FormActions,
    useToast,
    Form,
    FormControl,
    MultiSelect,
    FormInput,
} from '@/src/components/shared/ui';
import { useCreateTask, useUpdateTask, useProjectMembers, useKanbanColumns } from '@/src/hooks/queries/project-management';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { closeAllViews, selectSidebarViewData } from '@/src/store/slices/layoutSlice';


const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
];

// Status options are loaded dynamically from the project's kanban columns.
// No more hardcoded statusOptions here.

export default function TaskFormView() {
    const dispatch = useAppDispatch();
    const createTask = useCreateTask();
    const updateTask = useUpdateTask();
    const toast = useToast();

    const viewData = useAppSelector(selectSidebarViewData) as { projectId?: string; milestoneId?: string; parentTaskId?: string } | null;
    const projectId = viewData?.projectId || '';
    const milestoneId = viewData?.milestoneId || '';
    const parentTaskId = viewData?.parentTaskId || '';

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        column_id: '',  // will be set to first column once loaded
        priority: 'medium',
        due_date: '',
        start_date: '',
        estimated_hours: '',
        tags: '' as string,
    });

    const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

    const [tagsList, setTagsList] = useState<string[]>([]);

    const { data: membersData } = useProjectMembers(projectId);
    const { data: kanbanColumns, isLoading: columnsLoading } = useKanbanColumns(projectId);
    const columns = kanbanColumns ?? [];
    const members = (membersData?.members || []) as Array<{ user_id: string; name: string; username: string }>;

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.title.trim()) {
            newErrors.title = 'Task title is required';
        }
        if (!projectId) {
            newErrors.project = 'Project context is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const data = {
            title: formData.title,
            description: formData.description || undefined,
            column_id: formData.column_id || (columns.length > 0 ? columns[0].id : undefined),
            priority: formData.priority,
            assignee_ids: selectedAssignees.length > 0 ? selectedAssignees : undefined,
            due_date: formData.due_date || undefined,
            start_date: formData.start_date || undefined,
            estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : undefined,
            milestone_id: milestoneId || undefined,
            parent_task_id: parentTaskId || undefined,
            tags: tagsList.length > 0 ? tagsList : undefined,
        };

        createTask.mutate(
            { projectId, data },
            {
                onSuccess: () => {
                    toast.success('Task created successfully');
                    dispatch(closeAllViews());
                },
            }
        );
    };

    const handleClose = () => {
        dispatch(closeAllViews());
    };

    return (
        <div className="form-view">
            <Form onSubmit={handleSubmit}>
                <FormGroup>
                    <FormLabel required>Task Title</FormLabel>
                    <FormControl>
                        <FormInput
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="What needs to be done?"
                            error={errors.title}
                        />
                    </FormControl>
                </FormGroup>

                <FormGroup>
                    <FormLabel>Description</FormLabel>
                    <Textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Add more details..."
                        rows={3}
                    />
                </FormGroup>

                <FormRow>
                    <FormGroup>
                        <FormLabel>
                            Priority
                        </FormLabel>
                        <Select
                            value={formData.priority}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                                {priorityOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormGroup>

                    <FormGroup>
                        <FormLabel>
                            Column / Status
                        </FormLabel>
                        <Select
                            value={formData.column_id || (columns[0]?.id ?? '')}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, column_id: value }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={columnsLoading ? 'Loading…' : 'Select column'} />
                            </SelectTrigger>
                            <SelectContent>
                                {columns.map(col => (
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
                </FormRow>

                <FormRow>
                    <FormGroup>
                        <FormLabel>
                            Start Date
                        </FormLabel>
                        <FormInput
                            type="date"
                            name="start_date"
                            value={formData.start_date}
                            onChange={handleChange}
                        />
                    </FormGroup>

                    <FormGroup>
                        <FormLabel>
                            Due Date
                        </FormLabel>
                        <FormInput
                            type="date"
                            name="due_date"
                            value={formData.due_date}
                            onChange={handleChange}
                        />
                    </FormGroup>
                </FormRow>

                <FormGroup>
                    <FormLabel>
                        Estimated Hours
                    </FormLabel>
                    <FormInput
                        type="number"
                        name="estimated_hours"
                        value={formData.estimated_hours}
                        onChange={handleChange}
                        placeholder="0"
                        step="0.5"
                        min="0"
                    />
                </FormGroup>

                <FormGroup>
                    <FormLabel>
                        Assignees
                    </FormLabel>
                    <MultiSelect
                        value={selectedAssignees}
                        onValueChange={setSelectedAssignees}
                        options={members.map(m => ({
                            value: m.user_id,
                            label: m.name || m.username,
                        }))}
                        placeholder="Select assignees..."
                        renderOption={(option, isSelected) => (
                            <>
                                <UserAvatar name={option.label} username={option.label} size="sm" />
                                <span className="multi-select__option-label">{option.label}</span>
                                {isSelected && <Check size={14} className="multi-select__option-check" />}
                            </>
                        )}
                        renderSelected={(selectedOptions) =>
                            selectedOptions.length === 0 ? undefined : (
                                <div className="form-view__selected-avatars">
                                    {selectedOptions.slice(0, 3).map(opt => (
                                        <UserAvatar key={opt.value} name={opt.label} username={opt.label} size="xs" />
                                    ))}
                                    {selectedOptions.length > 3 && (
                                        <span className="form-view__more-count">+{selectedOptions.length - 3}</span>
                                    )}
                                </div>
                            )
                        }
                    />
                </FormGroup>

                <FormGroup>
                    <FormLabel>
                        Tags
                    </FormLabel>
                    <div className="form-view__tags-input">
                        <div className="form-view__tags-list">
                            {tagsList.map((tag, index) => (
                                <span key={index} className="form-view__tag">
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => setTagsList(prev => prev.filter((_, i) => i !== index))}
                                        className="form-view__tag-remove"
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <FormInput
                            name="tags"
                            value={formData.tags}
                            onChange={handleChange}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ',') {
                                    e.preventDefault();
                                    const tag = formData.tags.trim();
                                    if (tag && !tagsList.includes(tag)) {
                                        setTagsList(prev => [...prev, tag]);
                                        setFormData(prev => ({ ...prev, tags: '' }));
                                    }
                                }
                            }}
                            placeholder="Type and press Enter to add tags"
                        />
                    </div>
                </FormGroup>

                <FormActions align="end">
                    <Button type="button" variant="ghost" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={createTask.isPending}
                    >
                        {createTask.isPending ? 'Creating...' : 'Create Task'}
                    </Button>
                </FormActions>
            </Form>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { Calendar, Target, Trash2, CheckCircle, AlertCircle, Clock, Zap } from 'lucide-react';
import { useCreateMilestone, useUpdateMilestone, useDeleteMilestone, useMilestone, useMilestoneProgress } from '@/src/hooks/queries/project-management';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { closeAllViews, selectSidebarViewData } from '@/src/store/slices/layoutSlice';
import type { MilestoneStatus } from '@/src/types/milestone';
import { Button, Form, FormActions, FormControl, FormGroup, FormHint, FormInput, FormLabel, Textarea } from '../shared/ui';

interface FormViewData {
    projectId?: string;
    milestoneId?: string;
}

interface Milestone {
    id: string;
    name: string;
    description?: string;
    outcome_description?: string;
    status?: MilestoneStatus;
    blocked_reason?: string;
    due_date?: string;
    achieved_at?: string;
    completed_at?: string;
    total_tasks?: number;
    completed_tasks?: number;
    sort_order?: number;
}

interface Progress {
    required_total: number;
    required_completed: number;
    optional_total: number;
    optional_completed: number;
    percent_complete: number;
}

const statusConfig: Record<MilestoneStatus, { label: string; color: string; icon: typeof Target }> = {
    planned: { label: 'Planned', color: 'default', icon: Clock },
    active: { label: 'Active', color: 'info', icon: Zap },
    achieved: { label: 'Achieved', color: 'success', icon: CheckCircle },
    blocked: { label: 'Blocked', color: 'danger', icon: AlertCircle },
};

function MilestoneInfo({ milestone, progress }: { milestone: Milestone; progress?: Progress }) {
    const status = milestone.status || 'planned';
    const config = statusConfig[status];
    const StatusIcon = config.icon;

    const progressPercent = progress?.percent_complete ??
        (milestone.total_tasks ? Math.round((milestone.completed_tasks || 0) / milestone.total_tasks * 100) : 0);

    return (
        <div className="form-view__info">
            <div className={`form-view__status form-view__status--${config.color}`}>
                <StatusIcon size={14} />
                <span>{config.label}</span>
            </div>

            {milestone.blocked_reason && (
                <div className="form-view__alert form-view__alert--warning" style={{ marginTop: '0.5rem' }}>
                    <AlertCircle size={14} />
                    <span>{milestone.blocked_reason}</span>
                </div>
            )}

            <div className="form-view__progress" style={{ marginTop: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                    <span>Progress</span>
                    <span>{progressPercent}%</span>
                </div>
                <div style={{ height: '6px', background: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                        style={{
                            height: '100%',
                            width: `${progressPercent}%`,
                            background: status === 'achieved' ? 'var(--color-success)' : 'var(--color-primary)',
                            transition: 'width 0.3s ease'
                        }}
                    />
                </div>
                {progress && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                        {progress.required_completed} / {progress.required_total} required tasks complete
                    </div>
                )}
            </div>
        </div>
    );
}

export default function MilestoneFormView() {
    const dispatch = useAppDispatch();

    const viewData = useAppSelector(selectSidebarViewData) as FormViewData | null;
    const projectId = viewData?.projectId || '';
    const milestoneId = viewData?.milestoneId || null;
    const isEditing = !!milestoneId;

    const createMilestone = useCreateMilestone();
    const updateMilestone = useUpdateMilestone();
    const deleteMilestone = useDeleteMilestone();
    const { data: milestoneData, isLoading } = useMilestone(milestoneId || '');
    const { data: progressData } = useMilestoneProgress(milestoneId || '');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        outcome_description: '',
        due_date: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isEditing && milestoneData?.milestone) {
            const m = milestoneData.milestone as Milestone;
            setFormData({
                title: m.name,
                description: m.description || '',
                outcome_description: m.outcome_description || '',
                due_date: m.due_date ? m.due_date.split('T')[0] : '',
            });
        }
    }, [isEditing, milestoneData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.title.trim()) {
            newErrors.title = 'Milestone title is required';
        }
        if (!projectId && !isEditing) {
            newErrors.project = 'Project context is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const data = {
            name: formData.title,
            description: formData.description || undefined,
            outcome_description: formData.outcome_description || undefined,
            due_date: formData.due_date || undefined,
        };

        if (isEditing && milestoneId) {
            updateMilestone.mutate(
                { id: milestoneId, data },
                { onSuccess: () => dispatch(closeAllViews()) }
            );
        } else {
            createMilestone.mutate(
                { projectId, data },
                { onSuccess: () => dispatch(closeAllViews()) }
            );
        }
    };

    const handleDelete = () => {
        if (!milestoneId || !confirm('Are you sure you want to delete this milestone?')) return;

        deleteMilestone.mutate(milestoneId, {
            onSuccess: () => dispatch(closeAllViews())
        });
    };

    const handleClose = () => {
        dispatch(closeAllViews());
    };

    if (isEditing && isLoading) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <div className="form-view">
            <Form onSubmit={handleSubmit}>
                <FormGroup>
                    <FormLabel required>
                        Milestone Title
                    </FormLabel>
                    <FormControl>
                        <FormInput
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g., MVP Launch, Beta Release"
                            error={errors.title}
                        />
                    </FormControl>
                </FormGroup>

                <FormGroup>
                    <FormLabel>
                        Description
                    </FormLabel>
                    <FormControl>
                        <Textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="What does this milestone represent?"
                        />
                    </FormControl>
                </FormGroup>

                <FormGroup>
                    <FormLabel>
                        Done Means...
                    </FormLabel>
                    <Textarea
                        name="outcome_description"
                        value={formData.outcome_description}
                        onChange={handleChange}
                        placeholder="Define what 'done' looks like for this milestone. What criteria must be met?"
                        rows={3}
                    />
                    <FormHint>
                        Helps clarify the success criteria for achieving this milestone
                    </FormHint>
                </FormGroup>

                <FormGroup>
                    <FormLabel>
                        Target Date
                    </FormLabel>
                    <FormControl>
                        <FormInput
                            type="date"
                            name="due_date"
                            value={formData.due_date}
                            onChange={handleChange}
                        />
                    </FormControl>
                </FormGroup>

                {isEditing && milestoneData?.milestone ? (
                    <MilestoneInfo
                        milestone={milestoneData.milestone as Milestone}
                        progress={progressData?.progress as Progress | undefined}
                    />
                ) : null}

                <FormActions>
                    <Button type="button" variant="ghost" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={createMilestone.isPending || updateMilestone.isPending}
                    >
                        {createMilestone.isPending || updateMilestone.isPending
                            ? 'Saving...'
                            : (isEditing ? 'Save Changes' : 'Create Milestone')}
                    </Button>
                </FormActions>
            </Form>
        </div>
    );
}


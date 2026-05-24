'use client';

import { memo, useMemo } from 'react';
import { Target, Calendar, CheckCircle, Clock, AlertCircle, Zap } from 'lucide-react';
import { useMilestones } from '@/src/hooks/queries/project-management';
import { useAppDispatch } from '@/src/store/hooks';
import { setSidebarView } from '@/src/store/slices/layoutSlice';
import type { MilestoneStatus } from '@/src/types/milestone';

interface MilestoneTimelineProps {
    projectId: string;
}

interface Milestone {
    id: string;
    name?: string;
    title?: string;
    description?: string;
    status?: MilestoneStatus;
    due_date?: string;
    start_date?: string;
    total_tasks?: number;
    completed_tasks?: number;
}

const statusConfig: Record<MilestoneStatus, { icon: typeof Target; color: string; label: string }> = {
    planned: { icon: Clock, color: 'var(--text-tertiary)', label: 'Planned' },
    active: { icon: Zap, color: 'var(--color-info)', label: 'Active' },
    achieved: { icon: CheckCircle, color: 'var(--color-success)', label: 'Achieved' },
    blocked: { icon: AlertCircle, color: 'var(--color-error)', label: 'Blocked' },
};

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function MilestoneTimelineComponent({ projectId }: MilestoneTimelineProps) {
    const dispatch = useAppDispatch();
    const { data: milestonesResponse, isLoading } = useMilestones(projectId);

    const milestones = useMemo(() => {
        const items = ((milestonesResponse as { milestones?: Milestone[] } | undefined)?.milestones || []) as Milestone[];
        // Sort by due_date
        return items.sort((a, b) => {
            const dateA = a.due_date ? new Date(a.due_date).getTime() : Infinity;
            const dateB = b.due_date ? new Date(b.due_date).getTime() : Infinity;
            return dateA - dateB;
        });
    }, [milestonesResponse]);

    const handleMilestoneClick = (milestoneId: string) => {
        dispatch(setSidebarView({ view: 'milestone-form', data: { milestoneId, projectId }, width: 'lg' }));
    };

    if (isLoading) {
        return (
            <div className="milestone-timeline milestone-timeline--loading">
                {[1, 2, 3].map(i => (
                    <div key={i} className="milestone-timeline__skeleton" />
                ))}
            </div>
        );
    }

    if (milestones.length === 0) {
        return (
            <div className="milestone-timeline milestone-timeline--empty">
                <Target size={32} />
                <p>No milestones yet</p>
            </div>
        );
    }

    return (
        <div className="milestone-timeline">
            <div className="milestone-timeline__track" />

            {milestones.map((milestone, index) => {
                const status = milestone.status || 'planned';
                const config = statusConfig[status];
                const StatusIcon = config.icon;
                const progress = milestone.total_tasks && milestone.total_tasks > 0
                    ? Math.round((milestone.completed_tasks || 0) / milestone.total_tasks * 100)
                    : 0;
                const isLast = index === milestones.length - 1;

                return (
                    <div
                        key={milestone.id}
                        className={`milestone-timeline__item milestone-timeline__item--${status}`}
                    >
                        {/* Connector line */}
                        {!isLast && <div className="milestone-timeline__connector" />}

                        {/* Status node */}
                        <div
                            className="milestone-timeline__node"
                            style={{ color: config.color }}
                        >
                            <StatusIcon size={20} />
                        </div>

                        {/* Content card */}
                        <button
                            className="milestone-timeline__content"
                            onClick={() => handleMilestoneClick(milestone.id)}
                        >
                            <div className="milestone-timeline__header">
                                <h4 className="milestone-timeline__title">
                                    {milestone.name || milestone.title}
                                </h4>
                                <span
                                    className={`milestone-timeline__status milestone-timeline__status--${status}`}
                                    style={{ color: config.color }}
                                >
                                    {config.label}
                                </span>
                            </div>

                            {milestone.description && (
                                <p className="milestone-timeline__description">
                                    {milestone.description}
                                </p>
                            )}

                            <div className="milestone-timeline__meta">
                                {milestone.due_date && (
                                    <span className="milestone-timeline__date">
                                        <Calendar size={14} />
                                        {formatDate(milestone.due_date)}
                                    </span>
                                )}
                                {milestone.total_tasks !== undefined && milestone.total_tasks > 0 && (
                                    <span className="milestone-timeline__progress">
                                        <span className="milestone-timeline__progress-text">
                                            {milestone.completed_tasks || 0}/{milestone.total_tasks} tasks
                                        </span>
                                        <span className="milestone-timeline__progress-bar">
                                            <span
                                                className="milestone-timeline__progress-fill"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </span>
                                        <span className="milestone-timeline__progress-percent">
                                            {progress}%
                                        </span>
                                    </span>
                                )}
                            </div>
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

export const MilestoneTimeline = memo(MilestoneTimelineComponent);

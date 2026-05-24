'use client';

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, CheckCircle, Clock, ChevronDown, GripVertical, AlertCircle, Zap, ChevronRight
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/src/components/shared/ui/DropdownMenu';
import { Badge, Icon } from '@/src/components/shared/ui';
import { Button } from '@/src/components/shared/ui/Button';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { MilestoneStatus } from '@/src/types/milestone';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export interface Milestone {
    id: string;
    name?: string;
    title?: string;
    description?: string;
    outcome_description?: string;
    due_date?: string;
    status?: MilestoneStatus;
    blocked_reason?: string;
    completed_at?: string;
    achieved_at?: string;
    total_tasks?: number;
    completed_tasks?: number;
    sort_order?: number;
    progress?: number;
}

interface MilestoneCardProps {
    milestone: Milestone;
    isExpanded: boolean;
    onToggle: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onOverrideStatus: (status: MilestoneStatus, reason: string) => void;
}

// --------------------------------------------------------------------------
// Config
// --------------------------------------------------------------------------

export const statusConfig: Record<MilestoneStatus, { label: string; color: string; icon: typeof Clock }> = {
    planned: { label: 'Planned', color: 'default', icon: Clock },
    active: { label: 'Active', color: 'info', icon: Zap },
    achieved: { label: 'Achieved', color: 'success', icon: CheckCircle },
    blocked: { label: 'Blocked', color: 'danger', icon: AlertCircle },
};

export function getStatus(milestone: Milestone): MilestoneStatus {
    if (milestone.status) return milestone.status;
    if (milestone.achieved_at || milestone.completed_at) return 'achieved';
    if (milestone.total_tasks && milestone.completed_tasks && milestone.completed_tasks > 0) return 'active';
    return 'planned';
}

// --------------------------------------------------------------------------
// Component
// --------------------------------------------------------------------------

function MilestoneCardComponent({
    milestone,
    isExpanded,
    onToggle,
    onEdit,
    onDelete,
    onOverrideStatus,
}: MilestoneCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: milestone.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 'auto',
    };

    const derivedStatus = getStatus(milestone);
    const status = statusConfig[derivedStatus] || statusConfig.planned;
    const StatusIcon = status.icon;
    const progress = milestone.progress ??
        (milestone.total_tasks ? Math.round((milestone.completed_tasks || 0) / milestone.total_tasks * 100) : 0);
    const completedTasks = milestone.completed_tasks || 0;
    const totalTasks = milestone.total_tasks || 0;

    const displayTitle = milestone.name || milestone.title || 'Untitled Milestone';

    const dueDate = milestone.due_date
        ? new Date(milestone.due_date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        })
        : null;

    const isOverdue = milestone.due_date &&
        new Date(milestone.due_date) < new Date() &&
        derivedStatus !== 'achieved';

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            layout
            className={`milestone-card milestone-card--${status.color} ${isDragging ? 'milestone-card--dragging' : ''} ${isOverdue ? 'milestone-card--overdue' : ''} ${isExpanded ? 'milestone-card--expanded' : ''}`}
        >
            {/* Status accent strip */}
            <div className={`milestone-card__accent milestone-card__accent--${status.color}`} />

            <div className="milestone-card__content">
                <div className="milestone-card__header">
                    <div
                        className="milestone-card__drag-handle"
                        {...attributes}
                        {...listeners}
                    >
                        <GripVertical size={14} />
                    </div>

                    <button className="milestone-card__main" onClick={onToggle}>
                        <div className="milestone-card__top-row">
                            <div className="milestone-card__title-group">
                                <h4 className="milestone-card__title">{displayTitle}</h4>
                                {milestone.description && !isExpanded && (
                                    <p className="milestone-card__subtitle">{milestone.description}</p>
                                )}
                            </div>
                            <Badge size="sm" variant={status.color as any} className="milestone-card__status-badge">
                                <StatusIcon size={12} style={{ marginRight: '4px' }} />
                                <span>{status.label}</span>
                            </Badge>
                        </div>

                        <div className="milestone-card__bottom-row">
                            <div className="milestone-card__meta">
                                {dueDate && (
                                    <span className={`milestone-card__date ${isOverdue ? 'milestone-card__date--overdue' : ''}`}>
                                        <Calendar size={12} />
                                        {isOverdue ? 'Overdue: ' : ''}{dueDate}
                                    </span>
                                )}
                                {totalTasks > 0 && (
                                    <span className="milestone-card__task-count">
                                        <Icon name="list-checks" size={12} />
                                        {completedTasks}/{totalTasks} tasks
                                    </span>
                                )}
                                {milestone.blocked_reason && (
                                    <span className="milestone-card__blocked-label">
                                        <AlertCircle size={12} />
                                        Blocked
                                    </span>
                                )}
                            </div>

                            {totalTasks > 0 && (
                                <div className="milestone-card__progress-section">
                                    <div className="milestone-card__progress-bar">
                                        <div
                                            className={`milestone-card__progress-fill milestone-card__progress-fill--${status.color}`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <span className="milestone-card__progress-percent">{progress}%</span>
                                </div>
                            )}
                        </div>
                    </button>

                    <div className="milestone-card__actions">
                        <button
                            className={`milestone-card__expand ${isExpanded ? 'milestone-card__expand--open' : ''}`}
                            onClick={onToggle}
                            aria-label={isExpanded ? 'Collapse' : 'Expand'}
                        >
                            <ChevronRight size={14} />
                        </button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost" iconOnly iconSize={14} size="xs"
                                    leftIcon="more-vertical"
                                    className="milestone-card__menu"
                                    aria-label="Milestone actions"
                                />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" size="sm">
                                <DropdownMenuItem onClick={onEdit} icon="edit">
                                    Edit Milestone
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {derivedStatus !== 'blocked' && (
                                    <DropdownMenuItem
                                        onClick={() => onOverrideStatus('blocked', '')}
                                        icon="ban"
                                    >
                                        Mark as Blocked
                                    </DropdownMenuItem>
                                )}
                                {derivedStatus !== 'achieved' && (
                                    <DropdownMenuItem
                                        onClick={() => onOverrideStatus('achieved', 'Manually marked as achieved')}
                                        icon="check"
                                    >
                                        Mark as Achieved
                                    </DropdownMenuItem>
                                )}
                                {derivedStatus !== 'active' && derivedStatus !== 'achieved' && (
                                    <DropdownMenuItem
                                        onClick={() => onOverrideStatus('active', 'Manually activated')}
                                        icon="zap"
                                    >
                                        Mark as Active
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={onDelete} variant="danger" icon="trash">
                                    Delete Milestone
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="milestone-card__body"
                        >
                            {milestone.blocked_reason && (
                                <div className="milestone-card__alert milestone-card__alert--danger">
                                    <AlertCircle size={14} />
                                    <span>{milestone.blocked_reason}</span>
                                </div>
                            )}
                            {milestone.description && (
                                <p className="milestone-card__description">{milestone.description}</p>
                            )}
                            {milestone.outcome_description && (
                                <div className="milestone-card__outcome">
                                    <span className="milestone-card__outcome-label">Done Means:</span>
                                    <p className="milestone-card__outcome-text">{milestone.outcome_description}</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

export const MilestoneCard = memo(MilestoneCardComponent);

'use client';

import { memo } from 'react';
import { AlertTriangle, Calendar, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useAppDispatch } from '@/src/store/hooks';
import { setSidebarView } from '@/src/store/slices/layoutSlice';
import { useTasks } from '@/src/hooks/queries/project-management';

interface OverdueTasksWarningProps {
    projectId: string;
}

interface Task {
    id: string;
    title: string;
    due_date?: string;
    assignee_name?: string;
    priority?: string;
    status?: string; 
}

function getDaysOverdue(dueDate: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
}

function OverdueTasksWarningComponent({ projectId }: OverdueTasksWarningProps) {
    const dispatch = useAppDispatch();
    const [isExpanded, setIsExpanded] = useState(false);

    const { data: tasksResponse } = useTasks(projectId);

    // Filter overdue tasks (due_date in the past and not completed)
    const overdueTasks = ((tasksResponse as { tasks?: Task[] } | undefined)?.tasks || [])
        .filter((task: Task) => {
            if (!task.due_date || task.status === 'completed') return false;
            const dueDate = new Date(task.due_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate < today;
        })
        .sort((a: Task, b: Task) => {
            // Sort by most overdue first
            const daysA = getDaysOverdue(a.due_date!);
            const daysB = getDaysOverdue(b.due_date!);
            return daysB - daysA;
        });

    if (overdueTasks.length === 0) {
        return null;
    }

    const handleTaskClick = (taskId: string) => {
        dispatch(setSidebarView({ view: 'task-detail', data: { taskId }, width: 'xl' }));
    };

    const displayedTasks = isExpanded ? overdueTasks : overdueTasks.slice(0, 3);

    return (
        <div className="overdue-warning">
            <div className="overdue-warning__header">
                <div className="overdue-warning__icon">
                    <AlertTriangle size={18} />
                </div>
                <div className="overdue-warning__info">
                    <h4 className="overdue-warning__title">
                        {overdueTasks.length} Overdue Task{overdueTasks.length !== 1 ? 's' : ''}
                    </h4>
                    <p className="overdue-warning__subtitle">
                        These tasks are past their due date
                    </p>
                </div>
                {overdueTasks.length > 3 && (
                    <button
                        className="overdue-warning__toggle"
                        onClick={() => setIsExpanded(!isExpanded)}
                        aria-label={isExpanded ? 'Show less' : 'Show all'}
                    >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        {isExpanded ? 'Show less' : `+${overdueTasks.length - 3} more`}
                    </button>
                )}
            </div>
            <div className="overdue-warning__list">
                {displayedTasks.map((task: Task) => {
                    const daysOverdue = getDaysOverdue(task.due_date!);
                    return (
                        <button
                            key={task.id}
                            className="overdue-warning__task"
                            onClick={() => handleTaskClick(task.id)}
                        >
                            <div className="overdue-warning__task-info">
                                <span className="overdue-warning__task-title">{task.title}</span>
                                {task.assignee_name && (
                                    <span className="overdue-warning__task-assignee">
                                        {task.assignee_name}
                                    </span>
                                )}
                            </div>
                            <div className="overdue-warning__task-meta">
                                <span className={`overdue-warning__days ${daysOverdue > 7 ? 'overdue-warning__days--severe' : ''}`}>
                                    <Calendar size={12} />
                                    {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                                </span>
                                <ExternalLink size={14} className="overdue-warning__link-icon" />
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export const OverdueTasksWarning = memo(OverdueTasksWarningComponent);

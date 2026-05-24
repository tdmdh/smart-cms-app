'use client';

import { memo, useState } from 'react';
import { Clock, Plus, Play, Pause, Trash2 } from 'lucide-react';
import { useTimeEntries, useLogTime, useDeleteTimeEntry } from '@/src/hooks/queries/project-management';

interface TimeTrackerProps {
    taskId: string;
}

interface TimeEntry {
    id: string;
    description?: string;
    hours: number;
    logged_date: string;
    user_name?: string;
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}

function TimeTrackerComponent({ taskId }: TimeTrackerProps) {
    const [isTracking, setIsTracking] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [hours, setHours] = useState('');
    const [description, setDescription] = useState('');

    const { data, isLoading } = useTimeEntries(taskId);
    const logTime = useLogTime();
    const deleteEntry = useDeleteTimeEntry();

    const entries = (data?.entries ?? []) as TimeEntry[];
    const totalHours = data?.total_hours ?? entries.reduce((sum, e) => sum + e.hours, 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const hoursNum = parseFloat(hours);
        if (isNaN(hoursNum) || hoursNum <= 0) return;

        logTime.mutate(
            {
                taskId,
                data: {
                    hours: hoursNum,
                    description: description || undefined,
                    logged_date: new Date().toISOString().split('T')[0]
                }
            },
            {
                onSuccess: () => {
                    setHours('');
                    setDescription('');
                    setShowForm(false);
                }
            }
        );
    };

    const handleDelete = (id: string) => {
        if (confirm('Delete this time entry?')) {
            deleteEntry.mutate({ id, taskId });
        }
    };

    if (isLoading) {
        return (
            <div className="time-tracker time-tracker--loading">
                <div className="time-tracker__skeleton" />
            </div>
        );
    }

    return (
        <div className="time-tracker">
            <div className="time-tracker__header">
                <h4 className="time-tracker__title">
                    {/* <Clock size={16} /> */}
                    Time Tracking
                </h4>
                <div className="time-tracker__total">
                    <span className="time-tracker__total-value">{totalHours.toFixed(1)}h</span>
                    <span className="time-tracker__total-label">logged</span>
                </div>
            </div>

            <div className="time-tracker__actions">
                <button
                    className={`time-tracker__timer ${isTracking ? 'is-tracking' : ''}`}
                    onClick={() => setIsTracking(!isTracking)}
                >
                    {isTracking ? <Pause size={14} /> : <Play size={14} />}
                    {isTracking ? 'Stop Timer' : 'Start Timer'}
                </button>
                <button
                    className="time-tracker__add"
                    onClick={() => setShowForm(!showForm)}
                >
                    <Plus size={14} />
                    Log Time
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="time-tracker__form">
                    <div className="time-tracker__form-row">
                        <input
                            type="number"
                            step="0.25"
                            min="0.25"
                            value={hours}
                            onChange={(e) => setHours(e.target.value)}
                            placeholder="Hours"
                            className="time-tracker__hours-input"
                            required
                        />
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What did you work on?"
                            className="time-tracker__desc-input"
                        />
                    </div>
                    <div className="time-tracker__form-actions">
                        <button type="button" onClick={() => setShowForm(false)} className="btn btn--ghost btn--sm">
                            Cancel
                        </button>
                        <button type="submit" className="btn btn--primary btn--sm" disabled={logTime.isPending}>
                            Log Time
                        </button>
                    </div>
                </form>
            )}

            {entries.length > 0 && (
                <div className="time-tracker__entries">
                    {entries.slice(0, 5).map(entry => (
                        <div key={entry.id} className="time-entry">
                            <div className="time-entry__info">
                                <span className="time-entry__hours">{entry.hours}h</span>
                                <span className="time-entry__desc">{entry.description || 'No description'}</span>
                            </div>
                            <div className="time-entry__meta">
                                <span className="time-entry__date">{formatDate(entry.logged_date)}</span>
                                <button
                                    className="time-entry__delete"
                                    onClick={() => handleDelete(entry.id)}
                                    aria-label="Delete entry"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export const TimeTracker = memo(TimeTrackerComponent);

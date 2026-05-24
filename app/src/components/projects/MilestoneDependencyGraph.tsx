'use client';

import { memo, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Target, CheckCircle, Clock, AlertCircle, Zap, Calendar,
    TrendingUp, ChevronRight, Users
} from 'lucide-react';
import { useMilestones, useMilestoneDependencyGraph } from '@/src/hooks/queries/project-management';
import type { MilestoneStatus } from '@/src/types/milestone';

interface Milestone {
    id: string;
    name?: string;
    title?: string;
    status?: MilestoneStatus;
    due_date?: string;
    start_date?: string;
    total_tasks?: number;
    completed_tasks?: number;
    blocked_reason?: string;
}

interface MilestoneDependencyGraphProps {
    projectId: string;
}

const statusConfig: Record<MilestoneStatus, {
    color: string;
    icon: typeof Target;
    label: string;
    bgClass: string;
}> = {
    planned: { color: 'default', icon: Clock, label: 'Planned', bgClass: 'roadmap-node--default' },
    active: { color: 'info', icon: Zap, label: 'In Progress', bgClass: 'roadmap-node--info' },
    achieved: { color: 'success', icon: CheckCircle, label: 'Achieved', bgClass: 'roadmap-node--success' },
    blocked: { color: 'danger', icon: AlertCircle, label: 'Blocked', bgClass: 'roadmap-node--danger' },
};

function getStatus(milestone: Milestone): MilestoneStatus {
    return milestone.status || 'planned';
}

function formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
}

function MilestoneNode({
    milestone,
    dependencies,
    isOnCriticalPath,
    onHover,
    isHovered
}: {
    milestone: Milestone;
    dependencies: string[];
    isOnCriticalPath?: boolean;
    onHover: (id: string | null) => void;
    isHovered: boolean;
}) {
    const status = getStatus(milestone);
    const config = statusConfig[status];
    const StatusIcon = config.icon;
    const displayName = milestone.name || milestone.title || 'Untitled';
    const progress = milestone.total_tasks
        ? Math.round((milestone.completed_tasks || 0) / milestone.total_tasks * 100)
        : 0;
    const completedTasks = milestone.completed_tasks || 0;
    const totalTasks = milestone.total_tasks || 0;

    const isOverdue = milestone.due_date &&
        new Date(milestone.due_date) < new Date() &&
        status !== 'achieved';

    return (
        <motion.div
            className={`roadmap-node ${config.bgClass} ${isOnCriticalPath ? 'roadmap-node--critical' : ''} ${isHovered ? 'roadmap-node--hovered' : ''} ${isOverdue ? 'roadmap-node--overdue' : ''}`}
            onMouseEnter={() => onHover(milestone.id)}
            onMouseLeave={() => onHover(null)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            data-milestone-id={milestone.id}
        >
            <div className="roadmap-node__header">
                <div className="roadmap-node__icon">
                    <StatusIcon size={14} />
                </div>
                <span className="roadmap-node__title">{displayName}</span>
            </div>

            <div className="roadmap-node__progress">
                <div className="roadmap-node__progress-bar">
                    <div
                        className="roadmap-node__progress-fill"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <span className="roadmap-node__progress-text">{progress}%</span>
            </div>

            <div className="roadmap-node__meta">
                {milestone.due_date && (
                    <span className={`roadmap-node__date ${isOverdue ? 'roadmap-node__date--overdue' : ''}`}>
                        <Calendar size={10} />
                        {formatDate(milestone.due_date)}
                    </span>
                )}
                <span className="roadmap-node__tasks">
                    <Users size={10} />
                    {completedTasks}/{totalTasks}
                </span>
            </div>

            {status === 'blocked' && milestone.blocked_reason && (
                <div className="roadmap-node__blocked-reason">
                    <AlertCircle size={10} />
                    <span>{milestone.blocked_reason.slice(0, 50)}{milestone.blocked_reason.length > 50 ? '...' : ''}</span>
                </div>
            )}

            {dependencies.length > 0 && (
                <div className="roadmap-node__deps">
                    <ChevronRight size={10} />
                    <span>{dependencies.length} {dependencies.length === 1 ? 'dependency' : 'dependencies'}</span>
                </div>
            )}
        </motion.div>
    );
}

function RoadmapSummary({ milestones }: { milestones: Milestone[] }) {
    const stats = useMemo(() => {
        const total = milestones.length;
        const achieved = milestones.filter(m => getStatus(m) === 'achieved').length;
        const active = milestones.filter(m => getStatus(m) === 'active').length;
        const blocked = milestones.filter(m => getStatus(m) === 'blocked').length;
        const planned = milestones.filter(m => getStatus(m) === 'planned').length;

        const overallProgress = total > 0 ? Math.round((achieved / total) * 100) : 0;

        const overdueMilestones = milestones.filter(m => {
            const status = getStatus(m);
            return m.due_date && new Date(m.due_date) < new Date() && status !== 'achieved';
        });

        const atRisk = overdueMilestones.length > 0 || blocked > 0;

        return { total, achieved, active, blocked, planned, overallProgress, atRisk, overdue: overdueMilestones.length };
    }, [milestones]);

    return (
        <div className="roadmap-summary">
            <div className="roadmap-summary__progress">
                <div className="roadmap-summary__progress-ring">
                    <svg viewBox="0 0 36 36" className="roadmap-summary__ring-svg">
                        <path
                            className="roadmap-summary__ring-bg"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                            className="roadmap-summary__ring-fill"
                            strokeDasharray={`${stats.overallProgress}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                    </svg>
                    <span className="roadmap-summary__progress-value">{stats.overallProgress}%</span>
                </div>
                <div className="roadmap-summary__progress-label">
                    <span className="roadmap-summary__progress-title">Overall Progress</span>
                    <span className={`roadmap-summary__status ${stats.atRisk ? 'roadmap-summary__status--at-risk' : 'roadmap-summary__status--on-track'}`}>
                        <TrendingUp size={12} />
                        {stats.atRisk ? 'At Risk' : 'On Track'}
                    </span>
                </div>
            </div>

            <div className="roadmap-summary__stats">
                <div className="roadmap-summary__stat roadmap-summary__stat--success">
                    <CheckCircle size={14} />
                    <span className="roadmap-summary__stat-value">{stats.achieved}</span>
                    <span className="roadmap-summary__stat-label">Achieved</span>
                </div>
                <div className="roadmap-summary__stat roadmap-summary__stat--info">
                    <Zap size={14} />
                    <span className="roadmap-summary__stat-value">{stats.active}</span>
                    <span className="roadmap-summary__stat-label">Active</span>
                </div>
                <div className="roadmap-summary__stat roadmap-summary__stat--default">
                    <Clock size={14} />
                    <span className="roadmap-summary__stat-value">{stats.planned}</span>
                    <span className="roadmap-summary__stat-label">Planned</span>
                </div>
                {stats.blocked > 0 && (
                    <div className="roadmap-summary__stat roadmap-summary__stat--danger">
                        <AlertCircle size={14} />
                        <span className="roadmap-summary__stat-value">{stats.blocked}</span>
                        <span className="roadmap-summary__stat-label">Blocked</span>
                    </div>
                )}
            </div>
        </div>
    );
}

function MilestoneDependencyGraphComponent({ projectId }: MilestoneDependencyGraphProps) {
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const { data: milestonesData, isLoading: milestonesLoading } = useMilestones(projectId);
    const { data: graphData, isLoading: graphLoading } = useMilestoneDependencyGraph(projectId);

    const milestones = useMemo(() =>
        (milestonesData?.milestones ?? []) as Milestone[],
        [milestonesData?.milestones]
    );

    const dependencyGraph = useMemo(() =>
        (graphData?.graph ?? {}) as Record<string, string[]>,
        [graphData?.graph]
    );

    const criticalPath = useMemo(() => {
        const blockedIds = new Set(
            milestones
                .filter(m => getStatus(m) === 'blocked')
                .map(m => m.id)
        );

        const affectedIds = new Set<string>();
        milestones.forEach(m => {
            const deps = dependencyGraph[m.id] || [];
            if (deps.some(depId => blockedIds.has(depId))) {
                affectedIds.add(m.id);
            }
        });

        return new Set([...blockedIds, ...affectedIds]);
    }, [milestones, dependencyGraph]);

    const levels = useMemo(() => {
        const milestonesById = new Map(milestones.map(m => [m.id, m]));
        const depths = new Map<string, number>();

        const calculateDepth = (id: string, visited: Set<string> = new Set()): number => {
            if (visited.has(id)) return 0;
            if (depths.has(id)) return depths.get(id)!;

            visited.add(id);
            const deps = dependencyGraph[id] || [];
            if (deps.length === 0) {
                depths.set(id, 0);
                return 0;
            }

            const maxDepth = Math.max(...deps.map(depId => calculateDepth(depId, visited)));
            const depth = maxDepth + 1;
            depths.set(id, depth);
            return depth;
        };

        milestones.forEach(m => calculateDepth(m.id));

        const grouped: Milestone[][] = [];
        milestones.forEach(m => {
            const depth = depths.get(m.id) || 0;
            if (!grouped[depth]) grouped[depth] = [];
            grouped[depth].push(m);
        });

        return grouped.filter(level => level && level.length > 0);
    }, [milestones, dependencyGraph]);

    const isLoading = milestonesLoading || graphLoading;

    if (isLoading) {
        return (
            <div className="roadmap roadmap--loading">
                <div className="roadmap__skeleton" />
            </div>
        );
    }

    if (milestones.length === 0) {
        return null; // Don't show empty state - parent handles it
    }

    return (
        <div className="roadmap">
            <RoadmapSummary milestones={milestones} />

            <div className="roadmap__flow">
                <div className="roadmap__levels">
                    {levels.map((level, levelIndex) => (
                        <div key={levelIndex} className="roadmap__level">
                            <div className="roadmap__level-header">
                                <span className="roadmap__level-label">
                                    {levelIndex === 0 ? 'Foundation' : `Phase ${levelIndex + 1}`}
                                </span>
                            </div>
                            <div className="roadmap__nodes">
                                {level.map(milestone => (
                                    <MilestoneNode
                                        key={milestone.id}
                                        milestone={milestone}
                                        dependencies={dependencyGraph[milestone.id] || []}
                                        // isOnCriticalPath={criticalPath.has(milestone.id  )}
                                        onHover={setHoveredId}
                                        isHovered={hoveredId === milestone.id}
                                    />
                                ))}
                            </div>
                            {levelIndex < levels.length - 1 && (
                                <div className="roadmap__connector">
                                    <div className="roadmap__connector-line" />
                                    <ChevronRight size={16} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="roadmap__legend">
                <div className="roadmap__legend-item roadmap__legend-item--default">
                    <Clock size={12} /> Planned
                </div>
                <div className="roadmap__legend-item roadmap__legend-item--info">
                    <Zap size={12} /> Active
                </div>
                <div className="roadmap__legend-item roadmap__legend-item--success">
                    <CheckCircle size={12} /> Achieved
                </div>
                <div className="roadmap__legend-item roadmap__legend-item--danger">
                    <AlertCircle size={12} /> Blocked
                </div>
            </div>
        </div>
    );
}

export const MilestoneDependencyGraph = memo(MilestoneDependencyGraphComponent);

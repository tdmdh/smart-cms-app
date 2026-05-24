'use client';

import { memo, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
    CheckCircle,
    Clock,
    AlertCircle,
    Play,
    Target,
    Users,
    Calendar,
    TrendingUp,
    ArrowRight,
    Timer,
    ListTodo,
    Flag,
    Activity
} from 'lucide-react';
import { useProjectDashboard, useProjectMembers } from '@/src/hooks/queries/project-management';
import { useAppDispatch } from '@/src/store/hooks';
import { setSidebarView } from '@/src/store/slices/layoutSlice';
import {
    DashboardTask,
    DashboardMilestone,
    DashboardMember,
    DashboardProjectStats,
    toDashboardProjectStats,
    toDashboardMembers,
} from '@/src/types/dashboard';
import {
    Card,
    CardHeader,
    CardBody,
    Button,
    Alert,
    UserAvatar,
    Skeleton,
    Icon,
    EmptyState
} from '@/src/components/shared/ui';
import { TaskVelocityChart } from './TaskVelocityChart';

interface ProjectDashboardProps {
    projectId: string;
}

function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDueDate(dateStr: string): { text: string; isOverdue: boolean; isDueSoon: boolean } {
    const date = new Date(dateStr);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((date.getTime() - now.getTime()) / 86400000);

    if (diffDays < 0) {
        return { text: `${Math.abs(diffDays)}d overdue`, isOverdue: true, isDueSoon: false };
    }
    if (diffDays === 0) {
        return { text: 'Due today', isOverdue: false, isDueSoon: true };
    }
    if (diffDays === 1) {
        return { text: 'Due tomorrow', isOverdue: false, isDueSoon: true };
    }
    if (diffDays <= 7) {
        return { text: `Due in ${diffDays}d`, isOverdue: false, isDueSoon: true };
    }
    return {
        text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isOverdue: false,
        isDueSoon: false
    };
}

function getPriorityColor(priority?: string): string {
    switch (priority?.toLowerCase()) {
        case 'critical':
        case 'urgent':
            return 'text-red-500';
        case 'high':
            return 'text-orange-500';
        case 'medium':
            return 'text-yellow-500';
        default:
            return 'text-slate-400';
    }
}

function getStatusColor(status?: string): string {
    switch (status?.toLowerCase()) {
        case 'completed':
        case 'done':
            return 'bg-emerald-500';
        case 'in_progress':
        case 'in-progress':
            return 'bg-blue-500';
        case 'review':
        case 'in_review':
            return 'bg-purple-500';
        case 'blocked':
            return 'bg-red-500';
        default:
            return 'bg-slate-500';
    }
}

function ProjectDashboardComponent({ projectId }: ProjectDashboardProps) {
    const dispatch = useAppDispatch();

    useEffect(() => {
        sessionStorage.setItem('activeProjectId', projectId);
    }, [projectId]);

    const { data: dashboardData, isLoading: dashboardLoading } = useProjectDashboard(projectId);
    const { data: membersData } = useProjectMembers(projectId);

    const dashboard = toDashboardProjectStats(dashboardData);
    const members = toDashboardMembers(membersData?.members);

    const completionRate = useMemo(() => {
        if (!dashboard.total_tasks) return 0;
        return Math.round((dashboard.completed_tasks ?? 0) / dashboard.total_tasks * 100);
    }, [dashboard.total_tasks, dashboard.completed_tasks]);

    const hoursVariance = useMemo(() => {
        const estimated = dashboard.total_estimated_hours ?? 0;
        const actual = dashboard.total_actual_hours ?? 0;
        if (!estimated) return null;
        const variance = ((actual - estimated) / estimated) * 100;
        return {
            value: variance,
            isOver: variance > 0,
            text: `${Math.abs(variance).toFixed(0)}% ${variance > 0 ? 'over' : 'under'} estimate`
        };
    }, [dashboard.total_estimated_hours, dashboard.total_actual_hours]);

    const handleTaskClick = (taskId: string) => {
        dispatch(setSidebarView({ view: 'task-detail', data: { taskId }, width: 'xl' }));
    };

    const handleCreateTask = () => {
        dispatch(setSidebarView({ view: 'task-form', data: { projectId } }));
    };

    if (dashboardLoading) {
        return (
            <div className="project-dashboard">
                <div className="project-dashboard__stats">
                    {[1, 2, 3, 4].map(i => (
                        <Card key={i} variant="default">
                            <CardBody>
                                <Skeleton className="h-16 w-full rounded-lg" />
                            </CardBody>
                        </Card>
                    ))}
                </div>
                <div className="project-dashboard__grid">
                    <Card variant="default">
                        <CardBody>
                            <Skeleton className="h-48 w-full rounded-lg" />
                        </CardBody>
                    </Card>
                    <Card variant="default">
                        <CardBody>
                            <Skeleton className="h-48 w-full rounded-lg" />
                        </CardBody>
                    </Card>
                </div>
            </div>
        );
    }

    const overdueTasks = dashboard.overdue_tasks;
    const recentTasks = dashboard.recently_updated;
    const upcomingMilestones = dashboard.upcoming_milestones;

    return (
        <div>
            dashboard
        </div>
        // <div className="project-dashboard">
        //     {/* Overdue Tasks Alert */}
        //     {overdueTasks.length > 0 && (
        //         <Alert
        //             variant="warning"
        //             title={`${overdueTasks.length} Overdue Task${overdueTasks.length !== 1 ? 's' : ''}`}
        //             actions={
        //                 <Button
        //                     variant="ghost"
        //                     size="sm"
        //                     rightIcon="arrow-right"
        //                     onClick={() => dispatch(setSidebarView({ view: 'overdue-tasks', data: { projectId }, width: 'lg' }))}
        //                 >
        //                     View All
        //                 </Button>
        //             }
        //         >
        //             {overdueTasks.slice(0, 2).map(t => t.title).join(', ')}
        //             {overdueTasks.length > 2 && ` and ${overdueTasks.length - 2} more`}
        //         </Alert>
        //     )}

        //     {/* Stats Cards */}
        //     <div className="project-dashboard__stats">
        //         <Link href={`/dashboard/projects/${projectId}/board`} className="project-dashboard__stat-link">
        //             <Card variant="transparent" className="project-dashboard__stat-card">
        //                 <CardBody className="project-dashboard__stat-body">
        //                     <div className="project-dashboard__stat-icon project-dashboard__stat-icon--primary">
        //                         <ListTodo size={20} />
        //                     </div>
        //                     <div className="project-dashboard__stat-content">
        //                         <span className="project-dashboard__stat-value">{dashboard?.total_tasks ?? 0}</span>
        //                         <span className="project-dashboard__stat-label">Total Tasks</span>
        //                     </div>
        //                 </CardBody>
        //             </Card>
        //         </Link>

        //         <Card variant="transparent" className="project-dashboard__stat-card">
        //             <CardBody className="project-dashboard__stat-body">
        //                 <div className="project-dashboard__stat-icon project-dashboard__stat-icon--info">
        //                     <Play size={20} />
        //                 </div>
        //                 <div className="project-dashboard__stat-content">
        //                     <span className="project-dashboard__stat-value">{dashboard?.in_progress_tasks ?? 0}</span>
        //                     <span className="project-dashboard__stat-label">In Progress</span>
        //                 </div>
        //             </CardBody>
        //         </Card>

        //         <Card variant="transparent" className="project-dashboard__stat-card">
        //             <CardBody className="project-dashboard__stat-body">
        //                 <div className="project-dashboard__stat-icon project-dashboard__stat-icon--success">
        //                     <CheckCircle size={20} />
        //                 </div>
        //                 <div className="project-dashboard__stat-content">
        //                     <span className="project-dashboard__stat-value">{dashboard?.completed_tasks ?? 0}</span>
        //                     <span className="project-dashboard__stat-label">Completed</span>
        //                 </div>
        //             </CardBody>
        //         </Card>

        //         <Card variant="transparent" className="project-dashboard__stat-card">
        //             <CardBody className="project-dashboard__stat-body">
        //                 <div className="project-dashboard__stat-icon project-dashboard__stat-icon--error">
        //                     <AlertCircle size={20} />
        //                 </div>
        //                 <div className="project-dashboard__stat-content">
        //                     <span className="project-dashboard__stat-value">{dashboard?.blocked_tasks ?? 0}</span>
        //                     <span className="project-dashboard__stat-label">Blocked</span>
        //                 </div>
        //             </CardBody>
        //         </Card>
        //     </div>

        //     {/* Task Velocity Chart */}
        //     <TaskVelocityChart projectId={projectId} />

        //     {/* Main Grid */}
        //     <div className="project-dashboard__grid">
        //         {/* Progress Overview */}
        //         <Card variant="bordered">
        //             <CardHeader title="Progress Overview" />
        //             <CardBody>
        //                 <div className="project-dashboard__progress">
        //                     <div className="progress-ring">
        //                         <svg viewBox="0 0 100 100">
        //                             <circle
        //                                 className="progress-ring__bg"
        //                                 cx="50"
        //                                 cy="50"
        //                                 r="40"
        //                                 fill="none"
        //                                 strokeWidth="8"
        //                             />
        //                             <circle
        //                                 className="progress-ring__fill"
        //                                 cx="50"
        //                                 cy="50"
        //                                 r="40"
        //                                 fill="none"
        //                                 strokeWidth="8"
        //                                 strokeDasharray={`${completionRate * 2.51} 251`}
        //                                 transform="rotate(-90 50 50)"
        //                             />
        //                         </svg>
        //                         <div className="progress-ring__text">
        //                             <span className="progress-ring__value">{completionRate}%</span>
        //                             <span className="progress-ring__label">Complete</span>
        //                         </div>
        //                     </div>
        //                     <div className="progress-breakdown">
        //                         <div className="progress-breakdown__item">
        //                             <span className="progress-breakdown__dot progress-breakdown__dot--open" />
        //                             <span className="progress-breakdown__label">Open</span>
        //                             <span className="progress-breakdown__value">{dashboard?.open_tasks ?? 0}</span>
        //                         </div>
        //                         <div className="progress-breakdown__item">
        //                             <span className="progress-breakdown__dot progress-breakdown__dot--progress" />
        //                             <span className="progress-breakdown__label">In Progress</span>
        //                             <span className="progress-breakdown__value">{dashboard?.in_progress_tasks ?? 0}</span>
        //                         </div>
        //                         <div className="progress-breakdown__item">
        //                             <span className="progress-breakdown__dot progress-breakdown__dot--review" />
        //                             <span className="progress-breakdown__label">In Review</span>
        //                             <span className="progress-breakdown__value">{dashboard?.review_tasks ?? 0}</span>
        //                         </div>
        //                         <div className="progress-breakdown__item">
        //                             <span className="progress-breakdown__dot progress-breakdown__dot--done" />
        //                             <span className="progress-breakdown__label">Completed</span>
        //                             <span className="progress-breakdown__value">{dashboard?.completed_tasks ?? 0}</span>
        //                         </div>
        //                     </div>
        //                 </div>

        //                 {/* Time Tracking Summary */}
        //                 {(dashboard?.total_estimated_hours || dashboard?.total_actual_hours) && (
        //                     <div className="project-dashboard__hours">
        //                         <div className="project-dashboard__hours-row">
        //                             <div className="project-dashboard__hours-item">
        //                                 <Timer size={14} className="text-muted-foreground" />
        //                                 <span className="text-muted-foreground">Estimated:</span>
        //                                 <span className="font-medium">{dashboard.total_estimated_hours?.toFixed(1) ?? 0}h</span>
        //                             </div>
        //                             <div className="project-dashboard__hours-item">
        //                                 <Clock size={14} className="text-muted-foreground" />
        //                                 <span className="text-muted-foreground">Actual:</span>
        //                                 <span className="font-medium">{dashboard.total_actual_hours?.toFixed(1) ?? 0}h</span>
        //                             </div>
        //                         </div>
        //                         {hoursVariance && (
        //                             <div className={`project-dashboard__hours-variance ${hoursVariance.isOver ? 'text-orange-500' : 'text-emerald-500'}`}>
        //                                 <TrendingUp size={14} />
        //                                 {hoursVariance.text}
        //                             </div>
        //                         )}
        //                     </div>
        //                 )}
        //             </CardBody>
        //         </Card>

        //         {/* Upcoming Milestones */}
        //         <Card variant="bordered">
        //             <CardHeader
        //                 title="Upcoming Milestones"
        //                 action={
        //                     <Link href={`/dashboard/projects/${projectId}/milestones`}>
        //                         <Button variant="ghost" size="sm" rightIcon="arrow-right">
        //                             View All
        //                         </Button>
        //                     </Link>
        //                 }
        //             />
        //             <CardBody>
        //                 {upcomingMilestones.length > 0 ? (
        //                     <div className="project-dashboard__milestones">
        //                         {upcomingMilestones.slice(0, 4).map(milestone => {
        //                             const dueInfo = milestone.due_date ? formatDueDate(milestone.due_date) : null;
        //                             return (
        //                                 <div key={milestone.id} className="project-dashboard__milestone">
        //                                     <div className="project-dashboard__milestone-icon">
        //                                         <Target size={16} />
        //                                     </div>
        //                                     <div className="project-dashboard__milestone-content">
        //                                         <span className="project-dashboard__milestone-title">{milestone.title}</span>
        //                                         {dueInfo && (
        //                                             <span className={`project-dashboard__milestone-due ${dueInfo.isOverdue ? 'text-red-500' : dueInfo.isDueSoon ? 'text-orange-500' : 'text-muted-foreground'}`}>
        //                                                 <Calendar size={12} />
        //                                                 {dueInfo.text}
        //                                             </span>
        //                                         )}
        //                                     </div>
        //                                 </div>
        //                             );
        //                         })}
        //                     </div>
        //                 ) : (
        //                     <div className="py-6">
        //                         <EmptyState
        //                             icon="target"
        //                             title="No upcoming milestones"
        //                             size="compact"
        //                         />
        //                     </div>
        //                 )}
        //             </CardBody>
        //         </Card>

        //         {/* Recent Activity */}
        //         <Card variant="bordered">
        //             <CardHeader
        //                 title="Recent Activity"
        //                 action={
        //                     <Link href={`/dashboard/projects/${projectId}/board`}>
        //                         <Button variant="ghost" size="sm" rightIcon="arrow-right">
        //                             View Board
        //                         </Button>
        //                     </Link>
        //                 }
        //             />
        //             <CardBody>
        //                 {recentTasks.length > 0 ? (
        //                     <div className="project-dashboard__activity">
        //                         {recentTasks.slice(0, 5).map(task => (
        //                             <button
        //                                 key={task.id}
        //                                 type="button"
        //                                 className="project-dashboard__activity-item"
        //                                 onClick={() => handleTaskClick(task.id)}
        //                             >
        //                                 <div className={`project-dashboard__activity-status ${getStatusColor(task.status)}`} />
        //                                 <div className="project-dashboard__activity-content">
        //                                     <span className="project-dashboard__activity-title">{task.title}</span>
        //                                     <div className="project-dashboard__activity-meta">
        //                                         {task.priority && (
        //                                             <span className={getPriorityColor(task.priority)}>
        //                                                 <Flag size={10} />
        //                                                 {task.priority}
        //                                             </span>
        //                                         )}
        //                                         {task.updated_at && (
        //                                             <span className="text-muted-foreground">
        //                                                 {formatRelativeTime(task.updated_at)}
        //                                             </span>
        //                                         )}
        //                                     </div>
        //                                 </div>
        //                                 <ArrowRight size={14} className="project-dashboard__activity-arrow" />
        //                             </button>
        //                         ))}
        //                     </div>
        //                 ) : (
        //                     <div className="py-6">
        //                         <EmptyState
        //                             icon="activity"
        //                             title="No recent activity"
        //                             size="compact"
        //                             cta={{
        //                                 label: 'Create Task',
        //                                 onClick: handleCreateTask
        //                             }}
        //                         />
        //                     </div>
        //                 )}
        //             </CardBody>
        //         </Card>

        //         {/* Team Members */}
        //         <Card variant="bordered">
        //             <CardHeader
        //                 title="Team"
        //                 subtitle={`${members.length} member${members.length !== 1 ? 's' : ''}`}
        //                 action={
        //                     <Link href={`/dashboard/projects/${projectId}/team`}>
        //                         <Button variant="ghost" size="sm" rightIcon="arrow-right">
        //                             Manage
        //                         </Button>
        //                     </Link>
        //                 }
        //             />
        //             <CardBody>
        //                 {members.length > 0 ? (
        //                     <div className="project-dashboard__team">
        //                         <div className="project-dashboard__team-list">
        //                             {members.slice(0, 6).map(member => (
        //                                 <div key={member.user_id} className="project-dashboard__team-member">
        //                                     <UserAvatar
        //                                         name={member.name}
        //                                         email={member.email}
        //                                         avatarUrl={member.avatar_url}
        //                                         size="md"
        //                                     />
        //                                     <div className="project-dashboard__team-info">
        //                                         <span className="project-dashboard__team-name">
        //                                             {member.name || member.email}
        //                                         </span>
        //                                         <span className="project-dashboard__team-role">{member.role}</span>
        //                                     </div>
        //                                 </div>
        //                             ))}
        //                         </div>
        //                         {members.length > 6 && (
        //                             <Link
        //                                 href={`/dashboard/projects/${projectId}/team`}
        //                                 className="project-dashboard__team-more"
        //                             >
        //                                 +{members.length - 6} more members
        //                             </Link>
        //                         )}
        //                     </div>
        //                 ) : (
        //                     <div className="py-6">
        //                         <EmptyState
        //                             icon="users"
        //                             title="No team members yet"
        //                             size="compact"
        //                         />
        //                     </div>
        //                 )}
        //             </CardBody>
        //         </Card>
        //     </div>
        // </div>
    );
}

export const ProjectDashboard = memo(ProjectDashboardComponent);

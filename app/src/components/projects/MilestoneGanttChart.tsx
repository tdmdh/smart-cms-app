'use client';

import { memo, useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis, Cell, ReferenceLine } from 'recharts';
import { useMilestones } from '@/src/hooks/queries/project-management';
import { useAppDispatch } from '@/src/store/hooks';
import { setSidebarView } from '@/src/store/slices/layoutSlice';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartWrapper,
    ChartHeader,
    ChartBodyScrollable,
    ChartLegendItems,
    type ChartConfig
} from '@/src/components/shared/ui/Charts';
import type { MilestoneStatus } from '@/src/types/milestone';

interface MilestoneGanttChartProps {
    projectId: string;
}

interface Milestone {
    id: string;
    name?: string;
    title?: string;
    status?: MilestoneStatus;
    due_date?: string;
    start_date?: string;
    created_at?: string;
    total_tasks?: number;
    completed_tasks?: number;
}

interface GanttData {
    id: string;
    name: string;
    start: number;
    duration: number;
    progressDuration: number;
    remainingDuration: number;
    status: MilestoneStatus;
    dueDate: string;
    startDate: string;
    progress: number;
    totalTasks: number;
    completedTasks: number;
}

const statusColors: Record<MilestoneStatus, string> = {
    planned: '#94a3b8',
    active: '#4a7fb0',
    achieved: '#10b981',
    blocked: '#ef4444',
};

const chartConfig = {
    duration: {
        label: 'Duration',
        color: '#e2e8f0',
    },
    progressDuration: {
        label: 'Progress',
        color: '#10b981',
    },
    label: {
        color: '#ffffff',
    },
} satisfies ChartConfig;

function MilestoneGanttChartComponent({ projectId }: MilestoneGanttChartProps) {
    const dispatch = useAppDispatch();
    const { data: milestonesResponse, isLoading } = useMilestones(projectId);

    const { chartData, minDate, maxDate, todayOffset } = useMemo(() => {
        const milestones = ((milestonesResponse as { milestones?: Milestone[] } | undefined)?.milestones || []) as Milestone[];

        const withDates = milestones.filter(m => m.due_date);

        if (withDates.length === 0) {
            return { chartData: [], minDate: new Date(), maxDate: new Date(), todayOffset: 0 };
        }

        const dates = withDates.map(m => new Date(m.due_date!).getTime());
        const minTime = Math.min(...dates, ...withDates.map(m => m.created_at ? new Date(m.created_at).getTime() : Infinity));
        const maxTime = Math.max(...dates);

        const min = new Date(minTime);
        min.setHours(0, 0, 0, 0);
        min.setDate(min.getDate() - 7);

        const max = new Date(maxTime);
        max.setHours(23, 59, 59, 999);
        max.setDate(max.getDate() + 7);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayOff = Math.floor((today.getTime() - min.getTime()) / (1000 * 60 * 60 * 24));

        const data: GanttData[] = withDates
            .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
            .map(milestone => {
                const dueDate = new Date(milestone.due_date!);
                const startDate = milestone.created_at ? new Date(milestone.created_at) : new Date(dueDate);
                startDate.setDate(startDate.getDate() - 14);

                const startOffset = Math.max(0, Math.floor((startDate.getTime() - min.getTime()) / (1000 * 60 * 60 * 24)));
                const endOffset = Math.floor((dueDate.getTime() - min.getTime()) / (1000 * 60 * 60 * 24));
                const duration = Math.max(1, endOffset - startOffset);

                const progress = milestone.total_tasks && milestone.total_tasks > 0
                    ? Math.round((milestone.completed_tasks || 0) / milestone.total_tasks * 100)
                    : 0;

                const progressDuration = Math.round((duration * progress) / 100);
                const remainingDuration = duration - progressDuration;

                return {
                    id: milestone.id,
                    name: milestone.name || milestone.title || 'Milestone',
                    start: startOffset,
                    duration,
                    progressDuration,
                    remainingDuration,
                    status: milestone.status || 'planned',
                    dueDate: milestone.due_date!,
                    startDate: startDate.toISOString(),
                    progress,
                    totalTasks: milestone.total_tasks || 0,
                    completedTasks: milestone.completed_tasks || 0,
                };
            });

        return { chartData: data, minDate: min, maxDate: max, todayOffset: todayOff };
    }, [milestonesResponse]);

    const handleBarClick = (data: GanttData) => {
        dispatch(setSidebarView({ view: 'milestone-form', data: { milestoneId: data.id, projectId }, width: 'lg' }));
    };

    const totalDays = Math.floor((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));

    return (
        <ChartWrapper
            isLoading={isLoading}
            isEmpty={chartData.length === 0}
            emptyIcon={<Calendar size={32} />}
            emptyMessage="No milestones with due dates"
        >
            <ChartHeader title="Milestone Timeline" subtitle={`Total ${chartData.length} milestones`} />

            <ChartBodyScrollable>
                <ChartContainer config={chartConfig} style={{ height: chartData.length * 50 + 40, width: '100%' }}>
                    <BarChart
                        accessibilityLayer
                        data={chartData}
                        layout="vertical"
                        margin={{ right: 50, }}
                    >
                        <CartesianGrid horizontal={false} />
                        <YAxis
                            dataKey="name"
                            type="category"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            hide
                        />
                        <XAxis
                            dataKey="duration"
                            type="number"
                            hide
                        />
                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent
                                    hideIndicator
                                    labelFormatter={(_, payload) => {
                                        const data = payload?.[0]?.payload as unknown as GanttData;
                                        return data?.name || '';
                                    }}
                                    formatter={(value, name, item) => {
                                        const data = item?.payload as unknown as GanttData;
                                        if (name === 'remainingDuration') return null;
                                        if (name === 'progressDuration') {
                                            return (
                                                <div className="flex justify-between w-full gap-4">
                                                    <span className="text-muted-foreground">Progress:</span>
                                                    <span className="font-medium">{data.progress}%</span>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                    metadataFormatter={(payload) => {
                                        const data = payload as unknown as GanttData;
                                        const startFormatted = new Date(data.startDate).toLocaleDateString('en-US', {
                                            month: 'short', day: 'numeric'
                                        });
                                        const dueFormatted = new Date(data.dueDate).toLocaleDateString('en-US', {
                                            month: 'short', day: 'numeric'
                                        });
                                        const statusLabel = data.status.charAt(0).toUpperCase() + data.status.slice(1);
                                        return (
                                            <div className="space-y-1 text-sm">
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-muted-foreground">Status:</span>
                                                    <span className="font-medium" style={{ color: statusColors[data.status] }}>
                                                        {statusLabel}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-muted-foreground">Tasks:</span>
                                                    <span className="font-medium">{data.completedTasks} / {data.totalTasks}</span>
                                                </div>
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-muted-foreground">Start:</span>
                                                    <span className="font-medium">{startFormatted}</span>
                                                </div>
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-muted-foreground">Due:</span>
                                                    <span className="font-medium">{dueFormatted}</span>
                                                </div>
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-muted-foreground">Duration:</span>
                                                    <span className="font-medium">{data.duration} days</span>
                                                </div>
                                            </div>
                                        );
                                    }}
                                />
                            }
                        />

                        {todayOffset > 0 && todayOffset < totalDays && (
                            <ReferenceLine
                                x={todayOffset}
                                stroke="#fbbf24"
                                strokeDasharray="4 4"
                                strokeWidth={2}
                                label={{
                                    value: 'Today',
                                    position: 'top',
                                    fill: '#fbbf24',
                                    fontSize: 10,
                                }}
                            />
                        )}

                        <Bar
                            dataKey="progressDuration"
                            radius={14}
                            onClick={(data) => handleBarClick(data as unknown as GanttData)}
                            style={{ cursor: 'pointer' }}
                            stackId="milestone"
                        >
                            <LabelList
                                dataKey="name"
                                position="insideLeft"
                                offset={8}
                                className="fill-white"
                                fontSize={12}
                            />
                            {chartData.map((entry) => (
                                <Cell
                                    key={`progress-${entry.id}`}
                                    fill={statusColors[entry.status]}
                                />
                            ))}
                        </Bar>

                        <Bar
                            dataKey="remainingDuration"
                            radius={14}
                            onClick={(data) => handleBarClick(data as unknown as GanttData)}
                            style={{ cursor: 'pointer' }}
                            stackId="milestone"
                        >
                            <LabelList
                                dataKey="progress"
                                position="right"
                                offset={8}
                                className="fill-foreground"
                                fontSize={12}
                                formatter={(value) => (typeof value === 'number' ? `${value}%` : '')}
                            />
                            {chartData.map((entry) => (
                                <Cell
                                    key={`remaining-${entry.id}`}
                                    fill={statusColors[entry.status]}
                                    fillOpacity={0.3}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ChartContainer>
            </ChartBodyScrollable>

            <ChartLegendItems
                variant="bar"
                items={[
                    { label: 'Planned', color: statusColors.planned },
                    { label: 'Active', color: statusColors.active },
                    { label: 'Achieved', color: statusColors.achieved },
                    { label: 'Blocked', color: statusColors.blocked },
                ]}
            />
        </ChartWrapper>
    );
}

export const MilestoneGanttChart = memo(MilestoneGanttChartComponent);

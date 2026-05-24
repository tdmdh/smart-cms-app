'use client';

import { memo, useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { useTasks } from '@/src/hooks/queries/project-management';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Cell,
} from 'recharts';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartWrapper,
    ChartHeader,
    ChartBody,
    ChartLegendItems,
    type ChartConfig
} from '@/src/components/shared/ui/Charts';

interface TaskVelocityChartProps {
    projectId: string;
}

interface Task {
    id: string;
    status?: string;
    updated_at?: string;
    created_at?: string;
}

interface WeekData {
    week: string;
    weekLabel: string;
    weekStart: Date;
    weekEnd: Date;
    completed: number;
    created: number;
}

function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

function formatWeekLabel(date: Date): string {
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
}

const chartConfig = {
    completed: {
        label: 'Completed',
        color: '#10b981',
    },
    created: {
        label: 'Created',
        color: '#4a7fb0',
    },
} satisfies ChartConfig;

function TaskVelocityChartComponent({ projectId }: TaskVelocityChartProps) {
    const { data: tasksResponse, isLoading } = useTasks(projectId);

    const chartData = useMemo(() => {
        const tasks = ((tasksResponse as { tasks?: Task[] } | undefined)?.tasks || []) as Task[];

        const now = new Date();
        const weeks: WeekData[] = [];

        for (let i = 7; i >= 0; i--) {
            const weekStart = new Date(now);
            weekStart.setDate(weekStart.getDate() - (i * 7));
            const start = getWeekStart(weekStart);
            start.setHours(0, 0, 0, 0);

            const weekEnd = new Date(start);
            weekEnd.setDate(weekEnd.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);

            const completedCount = tasks.filter(task => {
                if (task.status !== 'completed') return false;
                if (!task.updated_at) return false;
                const updatedDate = new Date(task.updated_at);
                return updatedDate >= start && updatedDate <= weekEnd;
            }).length;

            const createdCount = tasks.filter(task => {
                if (!task.created_at) return false;
                const createdDate = new Date(task.created_at);
                return createdDate >= start && createdDate <= weekEnd;
            }).length;

            const endLabel = new Date(weekEnd);
            const weekLabel = `${formatWeekLabel(start)} - ${formatWeekLabel(endLabel)}`;

            weeks.push({
                week: formatWeekLabel(start),
                weekLabel,
                weekStart: start,
                weekEnd,
                completed: completedCount,
                created: createdCount,
            });
        }

        return weeks;
    }, [tasksResponse]);

    const totalCompleted = useMemo(() =>
        chartData.reduce((sum, week) => sum + week.completed, 0),
        [chartData]
    );

    const totalCreated = useMemo(() =>
        chartData.reduce((sum, week) => sum + week.created, 0),
        [chartData]
    );

    const avgPerWeek = useMemo(() =>
        chartData.length > 0 ? (totalCompleted / chartData.length).toFixed(1) : '0',
        [chartData, totalCompleted]
    );

    return (
        <ChartWrapper
            isLoading={isLoading}
            isEmpty={chartData.every(w => w.completed === 0 && w.created === 0)}
            emptyIcon={<BarChart3 size={32} />}
            emptyMessage="No task activity in the last 8 weeks"
        >
            <ChartHeader title="Task Velocity" subtitle={`${totalCompleted} completed · ${avgPerWeek} avg/week`} />

            <ChartBody>
                <ChartContainer config={chartConfig} style={{ height: 200, width: '100%' }}>
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="week"
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                        />
                        <ChartTooltip
                            cursor={{ fill: 'var(--surface-secondary)' }}
                            content={
                                <ChartTooltipContent
                                    hideIndicator
                                    labelFormatter={(_, payload) => {
                                        const data = payload?.[0]?.payload as unknown as WeekData;
                                        return data?.weekLabel || '';
                                    }}
                                    formatter={(value, name, item) => {
                                        const data = item?.payload as unknown as WeekData;
                                        if (name === 'completed') {
                                            return (
                                                <div className="flex justify-between w-full gap-4">
                                                    <span className="text-muted-foreground">Completed:</span>
                                                    <span className="font-medium text-emerald-500">{data.completed}</span>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                    metadataFormatter={(payload) => {
                                        const data = payload as unknown as WeekData;
                                        return (
                                            <div className="space-y-1 text-sm">
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-muted-foreground">Created:</span>
                                                    <span className="font-medium">{data.created}</span>
                                                </div>
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-muted-foreground">Net:</span>
                                                    <span className={`font-medium ${data.completed - data.created >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                        {data.completed - data.created >= 0 ? '+' : ''}{data.completed - data.created}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    }}
                                />
                            }
                        />
                        <Bar
                            dataKey="completed"
                            fill="#10b981"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={40}
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.completed > 0 ? '#10b981' : '#e2e8f0'}
                                    fillOpacity={entry.completed > 0 ? 1 : 0.3}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ChartContainer>
            </ChartBody>

            <ChartLegendItems
                variant="bar"
                items={[
                    { label: 'Completed', color: '#10b981' },
                ]}
            />
        </ChartWrapper>
    );
}

export const TaskVelocityChart = memo(TaskVelocityChartComponent);

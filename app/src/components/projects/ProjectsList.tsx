'use client';

import { memo, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjects } from '@/src/hooks/queries/project-management';

import { ProjectCard, type Project } from './ProjectCard';
import { useAppDispatch } from '@/src/store/hooks';
import { setSidebarView } from '@/src/store/slices/layoutSlice';
import { 
    EmptyState, Icon, Input, Select,
    SelectTrigger, SelectValue, SelectContent, 
    SelectItem, Button, Skeleton,
 } from '../shared/ui';

type ViewMode = 'grid' | 'list';
type StatusFilter = 'all' | 'active' | 'planning' | 'on_hold' | 'completed' | 'archived';

const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All Projects' },
    { value: 'active', label: 'Active' },
    { value: 'planning', label: 'Planning' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'completed', label: 'Completed' },
    { value: 'archived', label: 'Archived' },
];

function ProjectsListComponent() {
    const dispatch = useAppDispatch();
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const { data, isLoading, isError } = useProjects(
        statusFilter !== 'all' ? { status: statusFilter } : undefined
    );

    const projects = useMemo(() => {
        const list = (data?.projects ?? []) as Project[];

        if (!searchQuery.trim()) return list;

        const query = searchQuery.toLowerCase();
        return list.filter(
            (p) =>
                p.name.toLowerCase().includes(query) ||
                p.client_name?.toLowerCase().includes(query) ||
                p.description?.toLowerCase().includes(query)
        );
    }, [data?.projects, searchQuery]);

    const statusCounts = useMemo(() => {
        const all = (data?.projects ?? []) as Project[];
        return {
            active: all.filter(p => p.status === 'active').length,
            planning: all.filter(p => p.status === 'planning').length,
            on_hold: all.filter(p => p.status === 'on_hold').length,
            completed: all.filter(p => p.status === 'completed').length,
        };
    }, [data?.projects]);

    if (isError) {
        return (
            <EmptyState
                icon="error"
                title="Failed to load projects"
                description="Something went wrong. Please try again."
                color="error"
            />
        );
    }

    return (
        <div className="projects-list">
            <div className="project-team__header">
                <div className="project-team__header-left">
                    <div className="project-team__stats">
                        <span className="project-team__stat project-team__stat--default">
                            <Icon name="folder" size={12} />
                            {projects.length} project{projects.length !== 1 ? 's' : ''}
                        </span>
                        {statusCounts.active > 0 && (
                            <span className="project-team__stat project-team__stat--success">
                                <Icon name="activity" size={12} />
                                {statusCounts.active} active
                            </span>
                        )}
                        {statusCounts.planning > 0 && (
                            <span className="project-team__stat project-team__stat--info">
                                <Icon name="timeline" size={12} />
                                {statusCounts.planning} planning
                            </span>
                        )}
                        {statusCounts.on_hold > 0 && (
                            <span className="project-team__stat project-team__stat--warning">
                                <Icon name="ban" size={12} />
                                {statusCounts.on_hold} on hold
                            </span>
                        )}
                        {statusCounts.completed > 0 && (
                            <span className="project-team__stat project-team__stat--primary">
                                <Icon name="check" size={12} />
                                {statusCounts.completed} done
                            </span>
                        )}
                    </div>
                </div>

                <div className="project-team__header-actions">
                    <Input
                        leftIcon="search"
                        type="text"
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />

                    <Select
                        value={statusFilter}
                        onValueChange={(v) => setStatusFilter(v as StatusFilter)}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {statusOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="projects-list__view-toggle">
                        <Button
                            variant="ghost"
                            iconOnly
                            size='xs'
                            leftIcon="grid"
                            iconSize={14}
                            aria-label="Grid view"
                            aria-pressed={viewMode === 'grid'}
                            onClick={() => setViewMode('grid')}
                            className={viewMode === 'grid' ? 'is-active' : ''}
                        />
                        <Button
                            variant="ghost"
                            iconOnly
                            size='xs'
                            leftIcon="list"
                            iconSize={14}
                            aria-label="List view"
                            aria-pressed={viewMode === 'list'}
                            onClick={() => setViewMode('list')}
                            className={viewMode === 'list' ? 'is-active' : ''}
                        />
                    </div>

                    <Button variant="primary" size='xs' iconSize={14} onClick={() => dispatch(setSidebarView({ view: 'project-form', width: 'xl' }))} rightIcon="plus">
                        New Project
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className={`projects-list__grid projects-list__grid--${viewMode}`}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="project-card project-card--skeleton" />
                    ))}
                </div>
            ) : projects.length === 0 ? (
                <EmptyState
                    icon="folder"
                    title="No projects found"
                    description={
                        searchQuery
                            ? 'Try adjusting your search or filters'
                            : 'Create your first project to get started'
                    }
                    {...(!searchQuery && {
                        cta: {
                            label: 'Create Project',
                            onClick: () => dispatch(setSidebarView({ view: 'project-form', width: 'xl' })),
                        },
                    })}
                />
            ) : (
                <motion.div
                    className={`projects-list__grid projects-list__grid--${viewMode}`}
                    layout
                >
                    <AnimatePresence mode="popLayout">
                        {projects.map((project) => (
                            <motion.div
                                key={project.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ProjectCard project={project} variant={viewMode} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}
        </div>
    );
}

export const ProjectsList = memo(ProjectsListComponent);

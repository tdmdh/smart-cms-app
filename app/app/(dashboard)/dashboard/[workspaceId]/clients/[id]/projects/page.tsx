'use client';

import { use, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjects } from '@/src/hooks/queries/project-management';
import { useClient } from '@/src/hooks/queries/client-management';
import { useAppDispatch } from '@/src/store/hooks';
import { pushView } from '@/src/store/slices/layoutSlice';
import { ProjectCard, type Project } from '@/src/components/projects/ProjectCard';
import {
    Alert,
    Button,
    EmptyState,
    Icon,
    Input,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Skeleton,
} from '@/src/components/shared/ui';

interface ClientProjectsPageProps {
    params: Promise<{ id: string }>;
}

type StatusFilter = 'all' | 'active' | 'planning' | 'on_hold' | 'completed' | 'archived';
type ViewMode = 'grid' | 'list';

const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All Projects' },
    { value: 'active', label: 'Active' },
    { value: 'planning', label: 'Planning' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'completed', label: 'Completed' },
    { value: 'archived', label: 'Archived' },
];

export default function ClientProjectsPage({ params }: ClientProjectsPageProps) {
    const { id: clientId } = use(params);
    const dispatch = useAppDispatch();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');

    const { data: client } = useClient(clientId);
    const { data, isLoading, isError } = useProjects(
        statusFilter !== 'all'
            ? { client_id: clientId, status: statusFilter }
            : { client_id: clientId }
    );

    const allProjects = useMemo(() => (data?.projects ?? []) as Project[], [data?.projects]);

    const projects = useMemo(() => {
        if (!searchQuery.trim()) return allProjects;
        const q = searchQuery.toLowerCase();
        return allProjects.filter(
            p =>
                p.name?.toLowerCase().includes(q) ||
                p.description?.toLowerCase().includes(q)
        );
    }, [allProjects, searchQuery]);

    const statusCounts = useMemo(() => ({
        active: allProjects.filter(p => p.status === 'active').length,
        planning: allProjects.filter(p => p.status === 'planning').length,
        on_hold: allProjects.filter(p => p.status === 'on_hold').length,
        completed: allProjects.filter(p => p.status === 'completed').length,
    }), [allProjects]);

    const handleCreateProject = () => {
        dispatch(pushView({
            view: 'project-form',
            data: { clientId, clientName: client?.name }
        }));
    };

    if (isLoading) {
        return (
            <div className="client-projects">
                <div className="project-team__header">
                    <div className="project-team__header-left">
                        <Skeleton className="h-5 w-24 rounded-full" />
                    </div>
                    <div className="project-team__header-actions">
                        <Skeleton className="h-8 w-40 rounded" />
                        <Skeleton className="h-8 w-32 rounded" />
                        <Skeleton className="h-8 w-28 rounded" />
                    </div>
                </div>
                <div className="projects-list__grid projects-list__grid--grid">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="project-card project-card--skeleton" />
                    ))}
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="client-projects">
                <Alert variant="error" title="Failed to load projects">
                    We couldn&apos;t load the projects. Please try again.
                </Alert>
            </div>
        );
    }

    if (allProjects.length === 0) {
        return (
            <EmptyState
                icon="folder"
                title="No projects yet"
                description="Create a project to start managing work for this client."
                cta={{ label: 'Create Project', onClick: handleCreateProject }}
            />
        );
    }

    return (
        <div className="client-projects">
            {/* Header: stats + filters + actions */}
            <div className="project-team__header">
                <div className="project-team__header-left">
                    <div className="project-team__stats">
                        <span className="project-team__stat project-team__stat--default">
                            <Icon name="folder" size={12} />
                            {allProjects.length} project{allProjects.length !== 1 ? 's' : ''}
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
                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {statusOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="projects-list__view-toggle">
                        <Button
                            variant="ghost" iconOnly size="xs" leftIcon="grid" iconSize={14}
                            aria-label="Grid view" aria-pressed={viewMode === 'grid'}
                            onClick={() => setViewMode('grid')}
                            className={viewMode === 'grid' ? 'is-active' : ''}
                        />
                        <Button
                            variant="ghost" iconOnly size="xs" leftIcon="list" iconSize={14}
                            aria-label="List view" aria-pressed={viewMode === 'list'}
                            onClick={() => setViewMode('list')}
                            className={viewMode === 'list' ? 'is-active' : ''}
                        />
                    </div>
                    <Button variant="primary" size="xs" iconSize={14} rightIcon="plus" onClick={handleCreateProject}>
                        New Project
                    </Button>
                </div>
            </div>

            {projects.length === 0 ? (
                <EmptyState
                    icon="search"
                    title="No projects match"
                    description="Try adjusting your search or filters."
                    cta={{
                        label: 'Clear Filters',
                        onClick: () => { setSearchQuery(''); setStatusFilter('all'); },
                    }}
                />
            ) : (
                <motion.div className={`projects-list__grid projects-list__grid--${viewMode}`} layout>
                    <AnimatePresence mode="popLayout">
                        {projects.map(project => (
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
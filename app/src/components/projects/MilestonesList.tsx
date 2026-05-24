'use client';

import { memo, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMilestones, useUpdateMilestone, useDeleteMilestone, useOverrideMilestoneStatus } from '@/src/hooks/queries/project-management';
import { setSidebarView } from '@/src/store/slices/layoutSlice';
import { useDispatch } from 'react-redux';
import {
    Button,
    useToast,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Textarea,
    FormLabel,
    Icon,
    EmptyState,
} from '@/src/components/shared/ui';
import { Skeleton } from '@/src/components/shared/ui/Skeleton';

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { MilestoneStatus } from '@/src/types/milestone';
import { MilestoneCard, getStatus, type Milestone } from './MilestoneCard';
import { MilestoneTimeline } from './MilestoneTimeline';
import { MilestoneGanttChart } from './MilestoneGanttChart';

type ViewMode = 'list' | 'timeline' | 'gantt';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

interface MilestonesListProps {
    projectId: string;
}

// --------------------------------------------------------------------------
// Sub-components
// --------------------------------------------------------------------------


function MilestonesHeader({
    milestones,
    onAddMilestone,
    onViewRoadmap,
    viewMode,
    onViewModeChange,
}: {
    milestones: Milestone[];
    onAddMilestone: () => void;
    onViewRoadmap: () => void;
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
}) {
    const statusCounts = useMemo(() => {
        return milestones.reduce((acc, m) => {
            const status = getStatus(m);
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<MilestoneStatus, number>);
    }, [milestones]);

    return (
        <div className="milestones-list__header">
            <div className="milestones-list__header-left">
                {milestones.length > 0 && (
                    <div className="milestones-list__stats">
                        {statusCounts.achieved > 0 && (
                            <span className="milestones-list__stat milestones-list__stat--success">
                                <Icon name='success' size={12} />
                                {statusCounts.achieved}
                            </span>
                        )}
                        {statusCounts.active > 0 && (
                            <span className="milestones-list__stat milestones-list__stat--info">
                                <Icon name='zap' size={12} />
                                {statusCounts.active}
                            </span>
                        )}
                        {statusCounts.planned > 0 && (
                            <span className="milestones-list__stat milestones-list__stat--default">
                                <Icon name='clock' size={12} />
                                {statusCounts.planned}
                            </span>
                        )}
                        {statusCounts.blocked > 0 && (
                            <span className="milestones-list__stat milestones-list__stat--danger">
                                <Icon name='alert-circle' size={12} />
                                {statusCounts.blocked}
                            </span>
                        )}
                    </div>
                )}
            </div>
            <div className="milestones-list__header-actions">
                {/* View Mode Toggle */}
                <div className="milestones-list__view-toggle">
                    <button
                        className={`milestones-list__view-btn ${viewMode === 'list' ? 'milestones-list__view-btn--active' : ''}`}
                        onClick={() => onViewModeChange('list')}
                        aria-label="List view"
                        title="List view"
                    >
                        <Icon name="list" size={14} />
                    </button>
                    <button
                        className={`milestones-list__view-btn ${viewMode === 'timeline' ? 'milestones-list__view-btn--active' : ''}`}
                        onClick={() => onViewModeChange('timeline')}
                        aria-label="Timeline view"
                        title="Timeline view"
                    >
                        <Icon name="timeline" size={14} />
                    </button>
                    <button
                        className={`milestones-list__view-btn ${viewMode === 'gantt' ? 'milestones-list__view-btn--active' : ''}`}
                        onClick={() => onViewModeChange('gantt')}
                        aria-label="Gantt chart view"
                        title="Gantt chart view"
                    >
                        <Icon name="calendar-days" size={14} />
                    </button>
                </div>
                <Button
                    variant="ghost"
                    size="xs"
                    iconSize={14}
                    onClick={onViewRoadmap}
                    rightIcon={'git-branch'}
                >
                    View Roadmap
                </Button>
                <Button
                    variant="primary"
                    size="xs"
                    iconSize={14}
                    onClick={onAddMilestone}
                    rightIcon={'plus'}
                >
                    Add Milestone
                </Button>
            </div>
        </div>
    );
}

function MilestonesEmptyState({ onAddMilestone }: { onAddMilestone: () => void }) {
    return (
        <EmptyState
            icon="target"
            title="No milestones yet"
            description="Create milestones to track project progress"
            cta={{
                label: 'Create Milestone',
                onClick: onAddMilestone
            }}
        />
    );
}

function MilestonesLoadingState() {
    return (
        <div className="milestones-list__items">
            {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="milestone-card milestone-card--skeleton" />
            ))}
        </div>
    );
}

// --------------------------------------------------------------------------
// Main Component
// --------------------------------------------------------------------------

function MilestonesListComponent({ projectId }: MilestonesListProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [milestoneToDelete, setMilestoneToDelete] = useState<{ id: string; name: string } | null>(null);
    const [blockDialogOpen, setBlockDialogOpen] = useState(false);
    const [milestoneToBlock, setMilestoneToBlock] = useState<{ id: string; name: string } | null>(null);
    const [blockReason, setBlockReason] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const { data, isLoading } = useMilestones(projectId);
    const updateMilestone = useUpdateMilestone();
    const deleteMilestone = useDeleteMilestone();
    const overrideStatus = useOverrideMilestoneStatus();
    const dispatch = useDispatch();
    const toast = useToast();

    const milestones = useMemo(() => {
        const raw = (data?.milestones ?? []) as Milestone[];
        return [...raw].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    }, [data?.milestones]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // --------------------------------------------------------------------------
    // Handlers
    // --------------------------------------------------------------------------

    const handleToggle = (id: string) => {
        setExpandedId(current => current === id ? null : id);
    };

    const handleAddMilestone = () => {
        dispatch(setSidebarView({ view: 'milestone-form', data: { projectId } }));
    };

    const handleViewRoadmap = () => {
        dispatch(setSidebarView({ view: 'milestone-roadmap', data: { projectId } }));
    };

    const handleEditMilestone = (milestoneId: string) => {
        dispatch(setSidebarView({ view: 'milestone-form-edit', data: { projectId, milestoneId } }));
    };

    const handleDeleteMilestone = (milestoneId: string, milestoneName: string) => {
        setMilestoneToDelete({ id: milestoneId, name: milestoneName });
        setDeleteDialogOpen(true);
    };

    const confirmDeleteMilestone = () => {
        if (!milestoneToDelete) return;

        deleteMilestone.mutate(milestoneToDelete.id, {
            onSuccess: () => {
                toast.success(`"${milestoneToDelete.name}" deleted successfully`);
                setDeleteDialogOpen(false);
                setMilestoneToDelete(null);
            },
            onError: (error) => {
                toast.error(error.message || 'Failed to delete milestone');
            }
        });
    };

    const handleOverrideStatus = (milestoneId: string, status: MilestoneStatus, reason: string) => {
        if (status === 'blocked' && !reason) {
            const milestone = milestones.find(m => m.id === milestoneId);
            if (milestone) {
                setMilestoneToBlock({ id: milestone.id, name: milestone.name || milestone.title || 'Milestone' });
                setBlockReason('');
                setBlockDialogOpen(true);
            }
            return;
        }

        overrideStatus.mutate(
            { id: milestoneId, status, reason },
            {
                onSuccess: () => {
                    toast.success(`Milestone marked as ${status}`);
                    if (status === 'blocked') {
                        setBlockDialogOpen(false);
                        setMilestoneToBlock(null);
                        setBlockReason('');
                    }
                },
                onError: (error) => {
                    toast.error(error.message || 'Failed to update milestone status');
                }
            }
        );
    };

    const confirmBlockMilestone = () => {
        if (!milestoneToBlock || !blockReason.trim()) return;
        handleOverrideStatus(milestoneToBlock.id, 'blocked', blockReason);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = milestones.findIndex(m => m.id === active.id);
            const newIndex = milestones.findIndex(m => m.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newOrder = arrayMove(milestones, oldIndex, newIndex);

                newOrder.forEach((milestone, index) => {
                    if (milestone.sort_order !== index) {
                        updateMilestone.mutate({
                            id: milestone.id,
                            data: { sort_order: index }
                        });
                    }
                });
            }
        }
    };

    // --------------------------------------------------------------------------
    // Render
    // --------------------------------------------------------------------------

    return (
        <div className="milestones-list">
            <MilestonesHeader
                milestones={milestones}
                onAddMilestone={handleAddMilestone}
                onViewRoadmap={handleViewRoadmap}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
            />

            {isLoading ? (
                <MilestonesLoadingState />
            ) : milestones.length === 0 ? (
                <MilestonesEmptyState onAddMilestone={handleAddMilestone} />
            ) : viewMode === 'timeline' ? (
                <MilestoneTimeline projectId={projectId} />
            ) : viewMode === 'gantt' ? (
                <MilestoneGanttChart projectId={projectId} />
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={milestones.map(m => m.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <motion.div className="milestones-list__items" layout>
                            <AnimatePresence mode="popLayout">
                                {milestones.map(milestone => (
                                    <motion.div
                                        key={milestone.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <MilestoneCard
                                            milestone={milestone}
                                            isExpanded={expandedId === milestone.id}
                                            onToggle={() => handleToggle(milestone.id)}
                                            onEdit={() => handleEditMilestone(milestone.id)}
                                            onDelete={() => handleDeleteMilestone(milestone.id, milestone.name || milestone.title || 'Milestone')}
                                            onOverrideStatus={(status, reason) => handleOverrideStatus(milestone.id, status, reason)}
                                        />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    </SortableContext>
                </DndContext>
            )}

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Milestone</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <span className="font-semibold text-white">"{milestoneToDelete?.name}"</span>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setDeleteDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            onClick={confirmDeleteMilestone}
                            loading={deleteMilestone.isPending}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Block Milestone</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for blocking <span className="font-semibold text-white">"{milestoneToBlock?.name}"</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <FormLabel htmlFor="block-reason" required>Reason</FormLabel>
                        <Textarea
                            id="block-reason"
                            value={blockReason}
                            onChange={(e) => setBlockReason(e.target.value)}
                            placeholder="e.g., Waiting for design approval..."
                            rows={3}
                            className="mt-2"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setBlockDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            onClick={confirmBlockMilestone}
                            loading={overrideStatus.isPending}
                            disabled={!blockReason.trim()}
                        >
                            Block Milestone
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export const MilestonesList = memo(MilestonesListComponent);

'use client';

import { useAppSelector } from '@/src/store/hooks';
import { selectSidebarViewData } from '@/src/store/slices/layoutSlice';
import { MilestoneDependencyGraph } from '@/src/components/projects/MilestoneDependencyGraph';

import { useProjectWebSocket } from '@/src/providers/WebSocketProvider';

interface RoadmapViewData {
    projectId: string;
}

export default function MilestoneRoadmapView() {
    const viewData = useAppSelector(selectSidebarViewData) as RoadmapViewData | null;

    // Ensure we are subscribed to project updates
    useProjectWebSocket(viewData?.projectId || null);

    if (!viewData?.projectId) {
        return (
            <div className="sidebar-view__empty">
                <p>No project selected</p>
            </div>
        );
    }

    return (
        <div className="milestone-roadmap-view">
            <MilestoneDependencyGraph projectId={viewData.projectId} />
        </div>
    );
}

'use client';

import { useParams } from 'next/navigation';
import { useAppSelector } from '@/src/store/hooks';
import { selectCurrentWorkspaceId } from '@/src/store/slices/workspaceSlice';

/**
 * Returns the active workspace ID.
 * URL param (`[workspaceId]`) is the source of truth when available;
 * falls back to the Redux-persisted value (e.g. in components rendered
 * outside the `[workspaceId]` layout).
 */
export function useWorkspaceId(): string | null {
    const params = useParams<{ workspaceId?: string }>();
    const reduxWorkspaceId = useAppSelector(selectCurrentWorkspaceId);
    return params?.workspaceId ?? reduxWorkspaceId;
}

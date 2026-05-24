'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWebSocketContext } from '@/src/providers/WebSocketProvider';
import { cosignApi, ListCoSignFilters, CoSignRequest } from '@/src/api/cosign';

export * from '@/src/api/cosign';

export const cosignKeys = {
    all:          (wid: string) => ['cosign', wid] as const,
    list:         (wid: string, f: ListCoSignFilters) => ['cosign', wid, 'list', f] as const,
    request:      (wid: string, id: string) => ['cosign', wid, 'request', id] as const,
    pendingCount: (wid: string) => ['cosign', wid, 'pending-count'] as const,
};

export function useCoSignRequests(workspaceId: string, filters: ListCoSignFilters = {}) {
    const queryClient = useQueryClient();
    const { isConnected, subscribe, unsubscribe, onMessage } = useWebSocketContext();

    useEffect(() => {
        if (!workspaceId || !isConnected) return;
        const channel = `workspace:${workspaceId}`;
        subscribe(channel);
        const off = onMessage((msg) => {
            if (
                msg.type === 'cosign.request_created' ||
                msg.type === 'cosign.approved' ||
                msg.type === 'cosign.rejected'
            ) {
                void queryClient.invalidateQueries({ queryKey: cosignKeys.all(workspaceId) });
            }
        });
        return () => { unsubscribe(channel); off(); };
    }, [workspaceId, isConnected, subscribe, unsubscribe, onMessage, queryClient]);

    return useQuery({
        queryKey: cosignKeys.list(workspaceId, filters),
        queryFn: () => cosignApi.list(workspaceId, filters),
        enabled: !!workspaceId,
        staleTime: 15_000,
    });
}

export function useCoSignPendingCount(workspaceId: string) {
    const queryClient = useQueryClient();
    const { isConnected, subscribe, unsubscribe, onMessage } = useWebSocketContext();

    useEffect(() => {
        if (!workspaceId || !isConnected) return;
        const channel = `workspace:${workspaceId}`;
        subscribe(channel);
        const off = onMessage((msg) => {
            if (
                msg.type === 'cosign.request_created' ||
                msg.type === 'cosign.approved' ||
                msg.type === 'cosign.rejected'
            ) {
                void queryClient.invalidateQueries({ queryKey: cosignKeys.pendingCount(workspaceId) });
            }
        });
        return () => { unsubscribe(channel); off(); };
    }, [workspaceId, isConnected, subscribe, unsubscribe, onMessage, queryClient]);

    return useQuery({
        queryKey: cosignKeys.pendingCount(workspaceId),
        queryFn: () => cosignApi.getPendingCount(workspaceId),
        enabled: !!workspaceId,
        staleTime: 10_000,
        refetchInterval: 60_000,
    });
}

export function useCoSignRequest(workspaceId: string, id: string) {
    return useQuery({
        queryKey: cosignKeys.request(workspaceId, id),
        queryFn: () => cosignApi.get(workspaceId, id),
        enabled: !!workspaceId && !!id,
        staleTime: 30_000,
    });
}

export function useApproveCoSign(workspaceId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => cosignApi.approve(workspaceId, id),
        onSuccess: (data: CoSignRequest) => {
            void queryClient.invalidateQueries({ queryKey: cosignKeys.all(workspaceId) });
            queryClient.setQueryData(cosignKeys.request(workspaceId, data.id), data);
        },
    });
}

export function useRejectCoSign(workspaceId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) =>
            cosignApi.reject(workspaceId, id, reason),
        onSuccess: (data: CoSignRequest) => {
            void queryClient.invalidateQueries({ queryKey: cosignKeys.all(workspaceId) });
            queryClient.setQueryData(cosignKeys.request(workspaceId, data.id), data);
        },
    });
}

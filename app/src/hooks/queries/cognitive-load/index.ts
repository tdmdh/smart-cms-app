'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWebSocketContext } from '@/src/providers/WebSocketProvider';
import { useWorkspaceId } from '@/src/hooks/useWorkspaceId';
import { cognitiveLoadApi } from './config';

export * from './config';

const cognitiveLoadKeys = {
    load: (workspaceId: string | null) => ['cognitive-load', workspaceId] as const,
    fluidScope: (workspaceId: string | null) => ['cognitive-load', 'fluid-scope', workspaceId] as const,
    threshold: (workspaceId: string | null) => ['cognitive-load', 'threshold', workspaceId] as const,
};

export function useCognitiveLoad(workspaceId: string | null) {
    const queryClient = useQueryClient();
    const { isConnected, subscribe, unsubscribe, onMessage } = useWebSocketContext();

    useEffect(() => {
        if (!workspaceId || !isConnected) return;
        const channel = `workspace:${workspaceId}`;
        subscribe(channel);
        const off = onMessage((msg) => {
            if (msg.type === 'cognitive_load.updated') {
                void queryClient.invalidateQueries({ queryKey: cognitiveLoadKeys.load(workspaceId) });
            }
        });
        return () => { unsubscribe(channel); off(); };
    }, [workspaceId, isConnected, subscribe, unsubscribe, onMessage, queryClient]);

    return useQuery({
        queryKey: cognitiveLoadKeys.load(workspaceId),
        queryFn: () => cognitiveLoadApi.getCognitiveLoad(workspaceId!),
        enabled: !!workspaceId,
        staleTime: 30_000,
    });
}

export function useFluidScope() {
    const workspaceId = useWorkspaceId();
    return useQuery({
        queryKey: cognitiveLoadKeys.fluidScope(workspaceId),
        queryFn: () => cognitiveLoadApi.getFluidScope(workspaceId!),
        enabled: !!workspaceId,
    });
}

export function useUpdateFluidScope() {
    const queryClient = useQueryClient();
    const hookWorkspaceId = useWorkspaceId();
    return useMutation({
        mutationFn: ({ workspaceId: argWorkspaceId, body }: { workspaceId?: string; body: string }) =>
            cognitiveLoadApi.updateFluidScope(argWorkspaceId ?? hookWorkspaceId ?? '', body),
        onSuccess: (_data, variables) => {
            const wid = variables.workspaceId ?? hookWorkspaceId;
            void queryClient.invalidateQueries({ queryKey: cognitiveLoadKeys.fluidScope(wid) });
        },
    });
}

export function useCognitiveThreshold() {
    const workspaceId = useWorkspaceId();
    return useQuery({
        queryKey: cognitiveLoadKeys.threshold(workspaceId),
        queryFn: () => cognitiveLoadApi.getThreshold(workspaceId!),
        enabled: !!workspaceId,
    });
}

export function useSetCognitiveThreshold() {
    const queryClient = useQueryClient();
    const workspaceId = useWorkspaceId();
    return useMutation({
        mutationFn: (threshold: number) => cognitiveLoadApi.setThreshold(workspaceId ?? '', threshold),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: cognitiveLoadKeys.threshold(workspaceId) });
        },
    });
}

export function useEnqueueILCalculation() {
    const workspaceId = useWorkspaceId();
    return useMutation({
        mutationFn: ({ taskId, title, description }: { taskId: string; title?: string; description?: string }) =>
            cognitiveLoadApi.enqueueILCalculation(taskId, workspaceId ?? '', title, description),
    });
}

export function useSubmitTriageRequest() {
    const workspaceId = useWorkspaceId();
    return useMutation({
        mutationFn: (requestText: string) =>
            cognitiveLoadApi.submitTriageRequest(workspaceId ?? '', requestText),
    });
}

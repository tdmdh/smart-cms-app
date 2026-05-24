'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWebSocketContext } from '@/src/providers/WebSocketProvider';
import { archetypeApi, CreateArchetypeBody, UpdateArchetypeBody } from '@/src/api/knowledge/archetypes';

export * from '@/src/api/knowledge/archetypes';

export const archetypeKeys = {
    all: (projectId: string) => ['archetypes', projectId] as const,
    list: (projectId: string) => ['archetypes', projectId, 'list'] as const,
    detail: (projectId: string, id: string) => ['archetypes', projectId, 'detail', id] as const,
    livingDoc: (projectId: string, archetypeId: string) => ['archetypes', projectId, archetypeId, 'living'] as const,
};

export function useArchetypes(projectId: string) {
    return useQuery({
        queryKey: archetypeKeys.list(projectId),
        queryFn: () => archetypeApi.list(projectId),
        enabled: !!projectId,
        staleTime: 60_000,
        select: (data) => data.archetypes ?? [],
    });
}

export function useArchetype(projectId: string, archetypeId: string) {
    return useQuery({
        queryKey: archetypeKeys.detail(projectId, archetypeId),
        queryFn: () => archetypeApi.get(projectId, archetypeId),
        enabled: !!projectId && !!archetypeId,
    });
}

export function useCreateArchetype(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: CreateArchetypeBody) => archetypeApi.create(projectId, body),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: archetypeKeys.all(projectId) });
        },
    });
}

export function useUpdateArchetype(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, body }: { id: string; body: UpdateArchetypeBody }) =>
            archetypeApi.update(projectId, id, body),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: archetypeKeys.all(projectId) });
        },
    });
}

export function useDeleteArchetype(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => archetypeApi.delete(projectId, id),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: archetypeKeys.all(projectId) });
        },
    });
}

export function useArchetypeLivingDoc(projectId: string, archetypeId: string) {
    const queryClient = useQueryClient();
    const { isConnected, subscribe, unsubscribe, onMessage } = useWebSocketContext();

    useEffect(() => {
        if (!projectId || !isConnected) return;
        const channel = `project:${projectId}`;
        subscribe(channel);
        const off = onMessage((msg) => {
            if (
                msg.type === 'knowledge.archetype_living_doc_updated' &&
                msg.payload?.project_id === projectId &&
                msg.payload?.archetype_id === archetypeId
            ) {
                void queryClient.invalidateQueries({
                    queryKey: archetypeKeys.livingDoc(projectId, archetypeId),
                });
            }
        });
        return () => { unsubscribe(channel); off(); };
    }, [projectId, archetypeId, isConnected, subscribe, unsubscribe, onMessage, queryClient]);

    return useQuery({
        queryKey: archetypeKeys.livingDoc(projectId, archetypeId),
        queryFn: () => archetypeApi.getLivingDoc(projectId, archetypeId),
        enabled: !!projectId && !!archetypeId,
        staleTime: 60_000,
    });
}

'use client';

import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWebSocketContext } from '@/src/providers/WebSocketProvider';
import { knowledgeApi, KnowledgeDoc, ListDocsFilters } from '@/src/api/knowledge';
import { syncKnowledgeIDB, readAllForProject, upsertDocIDB } from '@/src/store/knowledge-idb';

export * from '@/src/api/knowledge';

export const knowledgeKeys = {
    all: (projectId: string) => ['knowledge-docs', projectId] as const,
    list: (projectId: string, filters: ListDocsFilters) => ['knowledge-docs', projectId, 'list', filters] as const,
    doc: (projectId: string, id: string) => ['knowledge-docs', projectId, 'doc', id] as const,
    search: (projectId: string, query: string) => ['knowledge-docs', projectId, 'search', query] as const,
    living: (projectId: string) => ['knowledge-docs', projectId, 'living'] as const,
};

export function useKnowledgeDocs(projectId: string, filters: ListDocsFilters = {}) {
    const queryClient = useQueryClient();
    const { isConnected, subscribe, unsubscribe, onMessage } = useWebSocketContext();
    const filtersRef = useRef(filters);
    filtersRef.current = filters;

    useEffect(() => {
        if (!projectId || !isConnected) return;
        const channel = `project:${projectId}`;
        subscribe(channel);
        const off = onMessage((msg) => {
            if (msg.type === 'knowledge.draft_created') {
                void queryClient.invalidateQueries({ queryKey: knowledgeKeys.all(projectId) });
            }
        });
        return () => { unsubscribe(channel); off(); };
    }, [projectId, isConnected, subscribe, unsubscribe, onMessage, queryClient]);

    return useQuery({
        queryKey: knowledgeKeys.list(projectId, filters),
        queryFn: async () => {
            const data = await knowledgeApi.list(projectId, filters);
            void Promise.all(data.docs.map((d) => upsertDocIDB(projectId, d)));
            return data;
        },
        enabled: !!projectId,
        staleTime: 30_000,
    });
}

export function useKnowledgeDoc(projectId: string, id: string) {
    return useQuery({
        queryKey: knowledgeKeys.doc(projectId, id),
        queryFn: () => knowledgeApi.get(projectId, id),
        enabled: !!projectId && !!id,
    });
}

export function useSearchKnowledge(projectId: string, query: string, topK = 10) {
    return useQuery({
        queryKey: knowledgeKeys.search(projectId, query),
        queryFn: () => knowledgeApi.search(projectId, query, topK),
        enabled: !!projectId && query.trim().length > 1,
        staleTime: 60_000,
    });
}

export function useUploadKnowledgeDoc(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ file, archetypeId }: { file: File; archetypeId?: string }) =>
            knowledgeApi.upload(projectId, file, archetypeId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: knowledgeKeys.all(projectId) });
        },
    });
}

export function useCreateKnowledgeDoc(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: { source_type: string; source_ref: string; title: string; body: string }) =>
            knowledgeApi.create(projectId, body),
        onSuccess: (doc) => {
            void upsertDocIDB(projectId, doc);
            void queryClient.invalidateQueries({ queryKey: knowledgeKeys.all(projectId) });
        },
    });
}

export function useUpdateKnowledgeDoc(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, title, body }: { id: string; title: string; body: string }) =>
            knowledgeApi.update(projectId, id, { title, body }),
        onSuccess: (doc) => {
            void upsertDocIDB(projectId, doc);
            queryClient.setQueryData(knowledgeKeys.doc(projectId, doc.id), doc);
            void queryClient.invalidateQueries({ queryKey: knowledgeKeys.all(projectId) });
        },
    });
}

export function usePublishKnowledgeDoc(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => knowledgeApi.publish(projectId, id),
        onSuccess: (doc) => {
            void upsertDocIDB(projectId, doc);
            queryClient.setQueryData(knowledgeKeys.doc(projectId, doc.id), doc);
            void queryClient.invalidateQueries({ queryKey: knowledgeKeys.all(projectId) });
        },
    });
}

export function useRejectKnowledgeDraft(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
            knowledgeApi.reject(projectId, id, reason),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: knowledgeKeys.all(projectId) });
        },
    });
}

export function useLivingDoc(projectId: string) {
    const queryClient = useQueryClient();
    const { isConnected, subscribe, unsubscribe, onMessage } = useWebSocketContext();

    useEffect(() => {
        if (!projectId || !isConnected) return;
        const channel = `project:${projectId}`;
        subscribe(channel);
        const off = onMessage((msg) => {
            if (msg.type === 'knowledge.living_doc_updated' && msg.payload?.project_id === projectId) {
                void queryClient.invalidateQueries({ queryKey: knowledgeKeys.living(projectId) });
            }
        });
        return () => { unsubscribe(channel); off(); };
    }, [projectId, isConnected, subscribe, unsubscribe, onMessage, queryClient]);

    return useQuery({
        queryKey: knowledgeKeys.living(projectId),
        queryFn: () => knowledgeApi.getLivingDoc(projectId),
        enabled: !!projectId,
        staleTime: 60_000,
    });
}

const STOP_WORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'it',
    'its', 'this', 'that', 'as', 'up', 'if', 'so', 'not', 'no',
]);

// Synchronous offline search over React Query cache (Context Sidebar fallback).
// Title matches weighted 3× over body; partial prefix matching via includes().
export function useLocalKnowledgeSearch(projectId: string, query: string): KnowledgeDoc[] {
    const queryClient = useQueryClient();
    const cached = queryClient.getQueryData<{ docs: KnowledgeDoc[] }>(
        knowledgeKeys.list(projectId, { status: 'published' })
    );
    if (!cached?.docs || !query.trim()) return [];
    const tokens = query.toLowerCase().split(/\W+/).filter((t) => t.length > 1 && !STOP_WORDS.has(t));
    if (tokens.length === 0) return [];
    return cached.docs
        .map((doc) => {
            const title = doc.title.toLowerCase();
            const body = doc.body.toLowerCase();
            let score = 0;
            for (const t of tokens) {
                if (title.includes(t)) score += 3;
                if (body.includes(t)) score += 1;
            }
            return { doc, score };
        })
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map(({ doc }) => doc);
}

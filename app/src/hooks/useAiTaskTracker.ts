'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useWebSocketContext } from '@/src/providers/WebSocketProvider';

export type AiTaskType = 'doc_gen' | 'living_doc';

export interface AiTask {
    id: string;
    type: AiTaskType;
    label: string;
}

const TASK_TIMEOUT_MS = 90_000;

// Maps WebSocket completion events to the task types they resolve.
const WS_COMPLETION: Record<string, AiTaskType> = {
    'knowledge.draft_created':      'doc_gen',
    'knowledge.living_doc_updated': 'living_doc',
};

// projectId is reserved for future scoped WS filtering (e.g. multi-project views)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useAiTaskTracker(_projectId: string) {
    const [tasks, setTasks] = useState<AiTask[]>([]);
    const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
    const { onMessage } = useWebSocketContext();

    const removeByType = useCallback((type: AiTaskType) => {
        setTasks((prev) => {
            const removed = prev.filter((t) => t.type === type);
            removed.forEach((t) => {
                const timer = timers.current.get(t.id);
                if (timer) { clearTimeout(timer); timers.current.delete(t.id); }
            });
            return prev.filter((t) => t.type !== type);
        });
    }, []);

    const addTask = useCallback((task: AiTask) => {
        setTasks((prev) => {
            // Replace any existing task with the same id (idempotent re-trigger)
            const filtered = prev.filter((t) => t.id !== task.id);
            return [...filtered, task];
        });
        // Safety: clear if the completion WS event never arrives
        const existing = timers.current.get(task.id);
        if (existing) clearTimeout(existing);
        timers.current.set(task.id, setTimeout(() => {
            setTasks((prev) => prev.filter((t) => t.id !== task.id));
            timers.current.delete(task.id);
        }, TASK_TIMEOUT_MS));
    }, []);

    // Clear tasks when the corresponding WS completion event arrives.
    useEffect(() => {
        const off = onMessage((msg) => {
            const completedType = WS_COMPLETION[msg.type];
            if (completedType) removeByType(completedType);
        });
        return () => off();
    }, [onMessage, removeByType]);

    // Cleanup all timers on unmount.
    useEffect(() => {
        const map = timers.current;
        return () => { map.forEach(clearTimeout); map.clear(); };
    }, []);

    return { tasks, addTask };
}

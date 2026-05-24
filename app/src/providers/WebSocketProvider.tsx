'use client';

import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useWebSocket, type WebSocketMessage } from '@/src/hooks/useWebSocket';

interface WebSocketContextValue {
    isConnected: boolean;
    connectionState: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
    subscribe: (channel: string) => void;
    unsubscribe: (channel: string) => void;
    onMessage: (handler: (msg: WebSocketMessage) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

interface WebSocketProviderProps {
    children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
    const ws = useWebSocket({ autoConnect: true });

    return (
        <WebSocketContext.Provider value={ws}>
            {children}
        </WebSocketContext.Provider>
    );
}

export function useWebSocketContext() {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocketContext must be used within a WebSocketProvider');
    }
    return context;
}

export function useProjectWebSocket(projectId: string | null) {
    const ws = useWebSocketContext();
    const { isConnected, subscribe, unsubscribe } = ws;

    useEffect(() => {
        if (projectId && isConnected) {
            const channel = `project:${projectId}`;
            subscribe(channel);

            return () => {
                unsubscribe(channel);
            };
        }
    }, [projectId, isConnected, subscribe, unsubscribe]);

    return ws;
}

export function useTaskWebSocket(taskId: string | null) {
    const ws = useWebSocketContext();
    const { isConnected, subscribe, unsubscribe } = ws;

    useEffect(() => {
        if (taskId && isConnected) {
            const channel = `task:${taskId}`;
            subscribe(channel);

            return () => {
                unsubscribe(channel);
            };
        }
    }, [taskId, isConnected, subscribe, unsubscribe]);

    return ws;
}

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const EventTypes = {
    TASK_CREATED: 'task.created',
    TASK_UPDATED: 'task.updated',
    TASK_MOVED: 'task.moved',
    TASK_DELETED: 'task.deleted',
    MILESTONE_CREATED: 'milestone.created',
    MILESTONE_UPDATED: 'milestone.updated',
    MILESTONE_DELETED: 'milestone.deleted',
    COMMENT_CREATED: 'comment.created',
    COMMENT_UPDATED: 'comment.updated',
    COMMENT_DELETED: 'comment.deleted',
    NOTIFICATION_NEW: 'notification.new',
    NOTIFICATION_READ: 'notification.read',
    COGNITIVE_LOAD_UPDATED: 'cognitive_load.updated',
    KNOWLEDGE_DRAFT_CREATED: 'knowledge.draft_created',
    KNOWLEDGE_LIVING_DOC_UPDATED: 'knowledge.living_doc_updated',
    COSIGN_REQUEST_CREATED: 'cosign.request_created',
    COSIGN_APPROVED: 'cosign.approved',
    COSIGN_REJECTED: 'cosign.rejected',
} as const;

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export interface WebSocketMessage {
    type: string;
    channel: string;
    payload: Record<string, unknown>;
    timestamp: number;
}

interface UseWebSocketOptions {
    autoConnect?: boolean;
    reconnectAttempts?: number;
    reconnectInterval?: number;
}

interface WebSocketHookReturn {
    isConnected: boolean;
    connectionState: ConnectionState;
    subscribe: (channel: string) => void;
    unsubscribe: (channel: string) => void;
    onMessage: (handler: (msg: WebSocketMessage) => void) => () => void;
    connect: () => void;
    disconnect: () => void;
}

// Send a client-side ping every 30s to keep the connection alive through proxies
// and to reset the server-side read deadline (server resets on any received frame).
const HEARTBEAT_INTERVAL_MS = 30_000;

export function useWebSocket(options: UseWebSocketOptions = {}): WebSocketHookReturn {
    const {
        autoConnect = true,
        reconnectAttempts = 5,
        reconnectInterval = 3000,
    } = options;

    const queryClient = useQueryClient();
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectCountRef = useRef(0);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
    const connectRef = useRef<() => void>(() => undefined);
    const subscribedChannelsRef = useRef<Set<string>>(new Set());
    const listenersRef = useRef<Set<(msg: WebSocketMessage) => void>>(new Set());

    const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
    const intentionalDisconnectRef = useRef(false);

    const getWSConfig = useCallback(async (): Promise<{ wsUrl: string; token: string } | null> => {
        try {
            const response = await fetch('/api/ws/connect');
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Failed to get WebSocket config:', error);
        }
        return null;
    }, []);

    const stopHeartbeat = useCallback(() => {
        if (heartbeatRef.current) {
            clearInterval(heartbeatRef.current);
            heartbeatRef.current = null;
        }
    }, []);

    const startHeartbeat = useCallback((ws: WebSocket) => {
        stopHeartbeat();
        heartbeatRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ action: 'ping' }));
            }
        }, HEARTBEAT_INTERVAL_MS);
    }, [stopHeartbeat]);

    const handleMessage = useCallback((event: MessageEvent) => {
        const lines = (event.data as string).split('\n').filter(Boolean);
        for (const line of lines) {
            try {
                const message: WebSocketMessage = JSON.parse(line);
                switch (message.type) {
                    case EventTypes.TASK_CREATED:
                    case EventTypes.TASK_UPDATED:
                    case EventTypes.TASK_MOVED:
                    case EventTypes.TASK_DELETED:
                        queryClient.invalidateQueries({ queryKey: ['projects', 'kanban'] });
                        queryClient.invalidateQueries({ queryKey: ['tasks'] });
                        queryClient.invalidateQueries({ queryKey: ['projects', 'dashboard'] });
                        queryClient.invalidateQueries({ queryKey: ['milestones'] });
                        break;

                    case EventTypes.COMMENT_CREATED:
                    case EventTypes.COMMENT_UPDATED:
                    case EventTypes.COMMENT_DELETED:
                        if (message.payload?.task_id) {
                            queryClient.invalidateQueries({
                                queryKey: ['comments', message.payload.task_id]
                            });
                        }
                        break;

                    case EventTypes.MILESTONE_CREATED:
                    case EventTypes.MILESTONE_UPDATED:
                    case EventTypes.MILESTONE_DELETED:
                        queryClient.invalidateQueries({ queryKey: ['milestones'] });
                        queryClient.invalidateQueries({ queryKey: ['projects', 'dashboard'] });
                        break;

                    case EventTypes.NOTIFICATION_NEW:
                    case EventTypes.NOTIFICATION_READ:
                        queryClient.invalidateQueries({ queryKey: ['notifications'] });
                        break;

                    case EventTypes.COGNITIVE_LOAD_UPDATED:
                        queryClient.invalidateQueries({ queryKey: ['cognitive-load'] });
                        break;

                    case EventTypes.KNOWLEDGE_DRAFT_CREATED:
                        queryClient.invalidateQueries({ queryKey: ['knowledge-docs'] });
                        queryClient.invalidateQueries({ queryKey: ['notifications'] });
                        break;

                    case EventTypes.COSIGN_REQUEST_CREATED:
                    case EventTypes.COSIGN_APPROVED:
                    case EventTypes.COSIGN_REJECTED: {
                        const wid = message.payload?.workspace_id as string | undefined;
                        if (wid) {
                            queryClient.invalidateQueries({ queryKey: ['cosign', wid] });
                        }
                        break;
                    }
                }

                listenersRef.current.forEach(listener => listener(message));
            } catch (error) {
                console.error('[WS] Failed to parse message:', error);
            }
        }
    }, [queryClient]);

    const scheduleReconnect = useCallback((delayMs: number) => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
            connectRef.current();
        }, delayMs);
    }, []);

    const connect = useCallback(async () => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return;
        }

        intentionalDisconnectRef.current = false;
        setConnectionState('connecting');

        const config = await getWSConfig();

        // Abort if disconnect was called while fetching config
        if (intentionalDisconnectRef.current) {
            setConnectionState('disconnected');
            return;
        }

        if (!config) {
            console.warn('[WS] No config available, will retry');
            setConnectionState('reconnecting');
            // Still schedule a retry — don't silently give up on config fetch failures
            if (reconnectCountRef.current < reconnectAttempts) {
                reconnectCountRef.current++;
                const delay = Math.min(reconnectInterval * reconnectCountRef.current, 30_000);
                scheduleReconnect(delay);
            } else {
                setConnectionState('disconnected');
            }
            return;
        }

        try {
            const wsUrl = `${config.wsUrl}?token=${encodeURIComponent(config.token)}`;
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                setConnectionState('connected');
                reconnectCountRef.current = 0;

                subscribedChannelsRef.current.forEach(channel => {
                    ws.send(JSON.stringify({ action: 'subscribe', channel }));
                });

                startHeartbeat(ws);
            };

            ws.onmessage = handleMessage;

            ws.onerror = () => {
                if (!intentionalDisconnectRef.current) {
                    console.warn('[WS] Connection error');
                }
            };

            ws.onclose = (event) => {
                stopHeartbeat();
                wsRef.current = null;

                if (!intentionalDisconnectRef.current) {
                    console.log('[WS] Disconnected:', event.code, event.reason);
                }
                setConnectionState('disconnected');

                if (!intentionalDisconnectRef.current && event.code !== 1000) {
                    if (reconnectCountRef.current < reconnectAttempts) {
                        setConnectionState('reconnecting');
                        reconnectCountRef.current++;
                        const delay = Math.min(reconnectInterval * reconnectCountRef.current, 30_000);
                        console.log(`[WS] Reconnecting in ${delay}ms (attempt ${reconnectCountRef.current}/${reconnectAttempts})`);
                        scheduleReconnect(delay);
                    } else {
                        console.warn('[WS] Reconnect attempts exhausted — will retry on next tab focus');
                    }
                }
            };

            wsRef.current = ws;
        } catch (error) {
            console.error('[WS] Connection failed:', error);
            setConnectionState('disconnected');
        }
    }, [getWSConfig, handleMessage, reconnectAttempts, reconnectInterval, scheduleReconnect, startHeartbeat, stopHeartbeat]);

    useEffect(() => {
        connectRef.current = () => {
            void connect();
        };
    }, [connect]);

    const disconnect = useCallback(() => {
        intentionalDisconnectRef.current = true;
        stopHeartbeat();

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        reconnectCountRef.current = reconnectAttempts;

        if (wsRef.current) {
            wsRef.current.close(1000, 'User disconnect');
            wsRef.current = null;
        }
        setConnectionState('disconnected');
    }, [reconnectAttempts, stopHeartbeat]);

    const subscribe = useCallback((channel: string) => {
        subscribedChannelsRef.current.add(channel);

        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ action: 'subscribe', channel }));
        }
    }, []);

    const onMessage = useCallback((handler: (msg: WebSocketMessage) => void): (() => void) => {
        listenersRef.current.add(handler);
        return () => {
            listenersRef.current.delete(handler);
        };
    }, []);

    const unsubscribe = useCallback((channel: string) => {
        subscribedChannelsRef.current.delete(channel);

        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ action: 'unsubscribe', channel }));
            console.log('[WS] Unsubscribed from:', channel);
        }
    }, []);

    // Re-attempt connection when the tab becomes visible after being backgrounded.
    // This resets the counter so the user gets fresh reconnect attempts on focus.
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                const state = wsRef.current?.readyState;
                if (state !== WebSocket.OPEN && state !== WebSocket.CONNECTING) {
                    reconnectCountRef.current = 0;
                    if (reconnectTimeoutRef.current) {
                        clearTimeout(reconnectTimeoutRef.current);
                        reconnectTimeoutRef.current = null;
                    }
                    connectRef.current();
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    useEffect(() => {
        if (autoConnect) {
            const connectTimer = setTimeout(() => {
                connectRef.current();
            }, 0);

            return () => {
                clearTimeout(connectTimer);
                disconnect();
            };
        }

        return () => {
            disconnect();
        };
    }, [autoConnect, disconnect]);

    return {
        isConnected: connectionState === 'connected',
        connectionState,
        subscribe,
        unsubscribe,
        onMessage,
        connect,
        disconnect,
    };
}

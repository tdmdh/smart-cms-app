'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { setDeepWorkProtection } from '@/src/store/slices/layoutSlice';
import { selectUser } from '@/src/store/slices/authSlice';
import { useWebSocketContext } from '@/src/providers/WebSocketProvider';
import type { WebSocketMessage } from '@/src/hooks/useWebSocket';

interface Props {
    workspaceId: string;
}

interface MemberCLMsg {
    user_id: string;
    deep_work_protection: boolean;
}

export function DeepWorkProtectionListener({ workspaceId }: Props) {
    const dispatch = useAppDispatch();
    const user = useAppSelector(selectUser);
    const userId = user?.id ?? '';
    const { isConnected, subscribe, unsubscribe, onMessage } = useWebSocketContext();

    useEffect(() => {
        if (!workspaceId || !isConnected || !userId) return;
        const channel = `workspace:${workspaceId}`;
        subscribe(channel);
        const off = onMessage((msg: WebSocketMessage) => {
            if (msg.type !== 'cognitive_load.updated') return;
            const members = (msg.payload?.members ?? []) as MemberCLMsg[];
            const me = members.find((m) => m.user_id === userId);
            if (me !== undefined) {
                dispatch(setDeepWorkProtection(me.deep_work_protection));
            }
        });
        return () => {
            unsubscribe(channel);
            off();
        };
    }, [workspaceId, userId, isConnected, subscribe, unsubscribe, onMessage, dispatch]);

    return null;
}

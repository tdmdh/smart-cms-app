'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useWebSocketContext } from '@/src/providers/WebSocketProvider';
import { useMessages, useMarkRead, chatKeys } from '@/src/hooks/queries/chat';
import type { ChatMessage, MessagesListResponse } from '@/src/hooks/queries/chat';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';
import { ConversationHeader } from './ConversationHeader';
import { EmptyState } from '../shared/ui';

interface Props {
    workspaceId: string;
    conversationId: string;
}

export function MessageThread({ workspaceId, conversationId }: Props) {
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useMessages(
        workspaceId,
        conversationId
    );
    const markRead = useMarkRead(workspaceId);
    const { isConnected, subscribe, unsubscribe, onMessage } = useWebSocketContext();
    const queryClient = useQueryClient();
    const bottomRef = useRef<HTMLDivElement>(null);
    const messagesRef = useRef<HTMLDivElement>(null);
    const savedScrollRef = useRef<{ scrollHeight: number; scrollTop: number } | null>(null);
    const restoredScrollRef = useRef(false);

    const normalizeCreatedAt = (value: unknown): string => {
        if (typeof value === 'number' && Number.isFinite(value)) {
            return new Date(value).toISOString();
        }
        if (typeof value === 'string' && value.trim()) {
            return value;
        }
        return new Date().toISOString();
    };

    const normalizeMessageType = (value: unknown): ChatMessage['type'] | null => {
        if (value === 'text' || value === 'task_ref' || value === 'asset_ref' || value === 'attachment') {
            return value;
        }
        return null;
    };

    const normalizeChatMessage = (value: unknown): ChatMessage | null => {
        if (!value || typeof value !== 'object') return null;
        const raw = value as Record<string, unknown>;

        const id = (raw.id as string | undefined) || (raw.message_id as string | undefined);
        const normalizedType = normalizeMessageType(raw.type);
        const conversationID =
            (raw.conversation_id as string | undefined) ||
            (raw.conversationId as string | undefined);
        const senderID =
            (raw.sender_id as string | undefined) ||
            (raw.senderId as string | undefined);

        if (!id || !normalizedType || !conversationID || !senderID) return null;

        return {
            id,
            conversation_id: conversationID,
            sender_id: senderID,
            sender_name:
                (raw.sender_name as string | undefined) ||
                (raw.senderName as string | undefined) ||
                'Unknown',
            type: normalizedType,
            body: (raw.body as string | undefined) || '',
            ref_id: (raw.ref_id as string | undefined) || (raw.refId as string | undefined),
            media_url:
                (raw.media_url as string | undefined) ||
                (raw.mediaUrl as string | undefined),
            edited_at:
                (raw.edited_at as string | undefined) ||
                (raw.editedAt as string | undefined),
            created_at: normalizeCreatedAt(raw.created_at ?? raw.createdAt),
        };
    };

    const hasSenderName = (value: unknown): boolean => {
        if (!value || typeof value !== 'object') return false;
        const raw = value as Record<string, unknown>;
        const senderName =
            (raw.sender_name as string | undefined) ||
            (raw.senderName as string | undefined);
        return typeof senderName === 'string' && senderName.trim().length > 0;
    };

    const normalizePageMessages = (page: unknown): ChatMessage[] => {
        if (!page || typeof page !== 'object') return [];
        const directMessages = (page as { messages?: unknown }).messages;
        if (Array.isArray(directMessages)) {
            return directMessages
                .map((message) => normalizeChatMessage(message))
                .filter((message): message is ChatMessage => message !== null);
        }
        if (directMessages && typeof directMessages === 'object') {
            const nested = (directMessages as { messages?: unknown }).messages;
            if (Array.isArray(nested)) {
                return nested
                    .map((message) => normalizeChatMessage(message))
                    .filter((message): message is ChatMessage => message !== null);
            }
        }
        return [];
    };

    const allMessages = [...(data?.pages ?? [])].reverse().flatMap((p) =>
        [...normalizePageMessages(p)].reverse()
    );

    useEffect(() => {
        markRead.mutate(conversationId);
    }, [conversationId]);

    useEffect(() => {
        if (!isConnected || !conversationId) return;
        const channel = `chat:${conversationId}`;
        subscribe(channel);
        const off = onMessage((msg) => {
            if (msg.type === 'chat.message.created') {
                const incoming = normalizeChatMessage(msg.payload);

                if (!incoming || !hasSenderName(msg.payload)) {
                    queryClient.invalidateQueries({ queryKey: chatKeys.messages(workspaceId, conversationId) });
                    queryClient.invalidateQueries({ queryKey: chatKeys.conversations(workspaceId) });
                    return;
                }

                queryClient.setQueryData<InfiniteData<MessagesListResponse>>(
                    chatKeys.messages(workspaceId, conversationId),
                    (old) => {
                        if (!old?.pages.length) return old;

                        const [first, ...rest] = old.pages;
                        const firstMessages = normalizePageMessages(first);
                        const alreadyExists = firstMessages.some((message) => message.id === incoming.id);

                        return {
                            ...old,
                            pages: [
                                {
                                    ...first,
                                    messages: alreadyExists ? firstMessages : [incoming, ...firstMessages],
                                },
                                ...rest,
                            ],
                        };
                    }
                );

                queryClient.invalidateQueries({ queryKey: chatKeys.conversations(workspaceId) });
            }

            if (msg.type === 'chat.message.updated' || msg.type === 'chat.message.deleted') {
                queryClient.invalidateQueries({ queryKey: chatKeys.messages(workspaceId, conversationId) });
                queryClient.invalidateQueries({ queryKey: chatKeys.conversations(workspaceId) });
            }
        });
        return () => { unsubscribe(channel); off(); };
    }, [isConnected, conversationId, workspaceId, subscribe, unsubscribe, onMessage, queryClient]);

    const handleLoadMore = () => {
        if (messagesRef.current) {
            savedScrollRef.current = {
                scrollHeight: messagesRef.current.scrollHeight,
                scrollTop: messagesRef.current.scrollTop,
            };
        }
        fetchNextPage();
    };

    useLayoutEffect(() => {
        if (!isFetchingNextPage && savedScrollRef.current && messagesRef.current) {
            const { scrollHeight: prevHeight, scrollTop: prevScrollTop } = savedScrollRef.current;
            messagesRef.current.scrollTop = messagesRef.current.scrollHeight - prevHeight + prevScrollTop;
            savedScrollRef.current = null;
            restoredScrollRef.current = true;
        }
    }, [isFetchingNextPage]);

    useEffect(() => {
        if (restoredScrollRef.current) {
            restoredScrollRef.current = false;
            return;
        }
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [allMessages.length]);

    return (
        <div className="message-thread">
            <ConversationHeader workspaceId={workspaceId} conversationId={conversationId} />

            <div className="message-thread__messages" ref={messagesRef} role="log" aria-live="polite" aria-label="Messages">
                {hasNextPage && (
                    <button
                        className="message-thread__load-more"
                        onClick={handleLoadMore}
                        disabled={isFetchingNextPage}
                    >
                        {isFetchingNextPage ? 'Loading…' : 'Load older messages'}
                    </button>
                )}
                {allMessages.length === 0 && (
                    <div className="message-thread__empty">
                        <EmptyState
                            icon={'message-square'}
                            title="No messages"
                            description="Start the conversation below."
                        />
                    </div>
                )}
                {allMessages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                ))}
                <div ref={bottomRef} />
            </div>

            <MessageComposer workspaceId={workspaceId} conversationId={conversationId} />
        </div>
    );
}

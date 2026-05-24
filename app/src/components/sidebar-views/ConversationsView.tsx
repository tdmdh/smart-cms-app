'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icon, Badge, Button, EmptyState, AvatarGroup, UserAvatar, Avatar, AvatarGroupCount } from '@/src/components/shared/ui';
import { useAppSelector } from '@/src/store/hooks';
import { selectSidebarViewData } from '@/src/store/slices/layoutSlice';
import { useConversations } from '@/src/hooks/queries/chat';
import { useAuth } from '@/src/hooks/auth';
import { NewConversationModal } from '@/src/components/chat/NewConversationModal';
import type { Conversation } from '@/src/hooks/queries/chat';

// ── Helpers ────────────────────────────────────────────────────────

function formatTime(isoString?: string): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatPreview(msg: Conversation['last_message']): string {
    if (!msg) return '';
    switch (msg.type) {
        case 'attachment': return 'Attachment';
        case 'task_ref':   return 'Task reference';
        case 'asset_ref':  return 'Asset reference';
        default:           return msg.body;
    }
}

// ── Conversation item ───────────────────────────────────────────────

interface ConversationItemProps {
    conv: Conversation;
    isActive: boolean;
    workspaceId: string;
    currentUserId?: string;
    onClick: () => void;
}

const normalizeUuid = (id?: string) => id?.replace(/-/g, '').toLowerCase() ?? '';

function ConversationItem({ conv, isActive, workspaceId: _workspaceId, currentUserId, onClick }: ConversationItemProps) {
    const normalizedCurrentId = normalizeUuid(currentUserId);
    const otherParty = conv.type === 'direct' && normalizedCurrentId
        ? (conv.participants ?? []).find((p) => normalizeUuid(p.user_id) !== normalizedCurrentId) ?? null
        : null;

    const displayName = conv.type === 'direct'
        ? (otherParty
            ? (otherParty.name || otherParty.username || otherParty.email)
            : (conv.name || 'Direct Message'))
        : (conv.name || 'Group Chat');

    const preview = formatPreview(conv.last_message);
    const time = formatTime(conv.last_message?.created_at ?? conv.updated_at);
    const hasUnread = conv.unread_count > 0;

    return (
        <button
            className={`conversations-view__item${isActive ? ' conversations-view__item--active' : ''}`}
            onClick={onClick}
        >
            {/* Avatar */}
            {conv.type === 'direct' ? (
                <UserAvatar
                    name={otherParty?.name}
                    email={otherParty?.email}
                    username={otherParty?.username}
                    size="sm"
                    className="conversations-view__item-avatar-user"
                />
            ) : (
                <AvatarGroup>
                    {conv.participants.slice(0, 2).map((participant, index) => (
                        <UserAvatar key={index} name={participant.name} email={participant.email} username={participant.username} size="sm" />
                    ))}
                    {conv.participants.length > 2 && (
                        <AvatarGroupCount>+{conv.participants.length - 2}</AvatarGroupCount>
                    )}
                </AvatarGroup>
            )}

            {/* Body */}
            <div className="conversations-view__item-body">
                <div className="conversations-view__item-row">
                    <span className="conversations-view__item-name">{displayName}</span>
                    {time && (
                        <span className="conversations-view__item-time">{time}</span>
                    )}
                </div>
                <div className="conversations-view__item-row">
                    {preview ? (
                        <span className={`conversations-view__item-preview${hasUnread ? ' conversations-view__item-preview--unread' : ''}`}>
                            {preview}
                        </span>
                    ) : (
                        <span className="conversations-view__item-preview conversations-view__item-preview--empty">
                            No messages yet
                        </span>
                    )}
                    {hasUnread && (
                        <Badge size="xs" variant="primary">{conv.unread_count}</Badge>
                    )}
                </div>
            </div>
        </button>
    );
}

// ── Skeleton ────────────────────────────────────────────────────────

function ConversationSkeleton() {
    return (
        <div className="conversations-view__skeleton">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="conversations-view__skeleton-item" />
            ))}
        </div>
    );
}

// ── Main view ───────────────────────────────────────────────────────

export default function ConversationsView() {
    const viewData = useAppSelector(selectSidebarViewData) as { workspaceId: string } | null;
    const workspaceId = viewData?.workspaceId ?? '';
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeId = searchParams.get('conversation');
    const [showNew, setShowNew] = useState(false);
    const { user } = useAuth();

    const { data, isLoading } = useConversations(workspaceId);
    const conversations = data?.conversations ?? [];

    const selectConversation = (id: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('conversation', id);
        router.push(`?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="conversations-view">
            {isLoading ? (
                <ConversationSkeleton />
            ) : conversations.length === 0 ? (
                <EmptyState
                    icon="message-square"
                    title="No conversations"
                    description="Start a new conversation above."
                />
            ) : (
                <div className="conversations-view__list">
                    {conversations.map((conv) => (
                        <ConversationItem
                            key={conv.id}
                            conv={conv}
                            isActive={conv.id === activeId}
                            workspaceId={workspaceId}
                            currentUserId={user?.id}
                            onClick={() => selectConversation(conv.id)}
                        />
                    ))}
                </div>
            )}

            {showNew && workspaceId && (
                <NewConversationModal
                    workspaceId={workspaceId}
                    onClose={() => setShowNew(false)}
                    onCreated={(id) => {
                        setShowNew(false);
                        selectConversation(id);
                    }}
                />
            )}
        </div>
    );
}

'use client';

import React from 'react';
import { Icon } from '@/src/components/shared/ui';
import { UserAvatar } from '@/src/components/shared/ui/Avatar';
import { useAppSelector } from '@/src/store/hooks';
import { selectUser } from '@/src/store/slices/authSlice';
import { useTask } from '@/src/hooks/queries/project-management';
import type { ChatMessage } from '@/src/hooks/queries/chat';

function relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60_000) return 'just now';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return `${Math.floor(diff / 86_400_000)}d ago`;
}

const URL_REGEX = /(https?:\/\/[^\s]+)/gi;

function linkifyText(text: string): React.ReactNode[] {
  const parts = text.split(URL_REGEX);

  return parts.map((part, i) => {
    if (part.match(URL_REGEX)) {
      try {
        const url = new URL(part);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
          return part;
        }

        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="message-bubble__link"
          >
            {part}
            <Icon name="external-link" size={12} className="message-bubble__link-icon" />
          </a>
        );
      } catch (e) {
        return part;
      }
    }
    return part;
  });
}
function TaskRefCard({ refId }: { refId: string }) {
    const { data, isLoading } = useTask(refId);
    const task = data?.task as { title?: string } | undefined;

    return (
        <div className="message-ref-card">
            <Icon name="list-checks" size={16} className="message-ref-card__icon" />
            <div className="message-ref-card__body">
                <span className="message-ref-card__label">
                    {isLoading ? 'Loading task...' : (task?.title ?? 'Task')}
                </span>
                <span className="message-ref-card__sub">Task reference</span>
            </div>
        </div>
    );
}

function AssetRefCard({ refId, body }: { refId: string; body?: string }) {
    return (
        <div className="message-ref-card">
            <Icon name="file" size={16} className="message-ref-card__icon" />
            <div className="message-ref-card__body">
                <span className="message-ref-card__label">{body || 'Asset'}</span>
                <span className="message-ref-card__sub">Asset reference · {refId.slice(0, 8)}</span>
            </div>
        </div>
    );
}

function AttachmentCard({ mediaUrl, body }: { mediaUrl: string; body?: string }) {
    const isImage = /\.(png|jpg|jpeg|gif|webp|avif|svg)(\?|$)/i.test(mediaUrl);
    return (
        <a
            href={mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="message-attachment"
        >
            {isImage ? (
                <img src={mediaUrl} alt={body || 'attachment'} className="message-attachment__img" />
            ) : (
                <Icon name="clipboard" size={16} className="message-attachment__icon" />
            )}
            <span className="message-attachment__label">{body || 'Attachment'}</span>
        </a>
    );
}

interface Props {
    message: ChatMessage;
}

export function MessageBubble({ message }: Props) {
    const user = useAppSelector(selectUser);

    const normalizeIdentity = (value: unknown): string =>
        typeof value === 'string' ? value.trim().toLowerCase() : '';

    const senderId = normalizeIdentity(message.sender_id);
    const userId = normalizeIdentity((user as { id?: string; user_id?: string } | null)?.id);
    const legacyUserId = normalizeIdentity((user as { id?: string; user_id?: string } | null)?.user_id);
    const senderName = normalizeIdentity(message.sender_name);
    const userName = normalizeIdentity((user as { name?: string } | null)?.name);
    const username = normalizeIdentity((user as { username?: string } | null)?.username);
    const userEmail = normalizeIdentity((user as { email?: string } | null)?.email);

    const isOwn = !!user && (
        (senderId !== '' && senderId === userId) ||
        (senderId !== '' && senderId === legacyUserId) ||
        (senderName !== '' && (senderName === userName || senderName === username || senderName === userEmail))
    );

    return (
        <div className={`message-bubble${isOwn ? ' message-bubble--own' : ''}`}>
            <UserAvatar
                name={message.sender_name}
                size="xs"
                className="message-bubble__avatar"
            />
            <div className="message-bubble__body">
                {!isOwn && (
                    <span className="message-bubble__sender">{message.sender_name}</span>
                )}
                <div className="message-bubble__content">
                    {message.type === 'text' && (
                        <p className="message-bubble__text">{linkifyText(message.body)}</p>
                    )}
                    {message.type === 'task_ref' && message.ref_id && (
                        <TaskRefCard refId={message.ref_id} />
                    )}
                    {message.type === 'asset_ref' && message.ref_id && (
                        <AssetRefCard refId={message.ref_id} body={message.body} />
                    )}
                    {message.type === 'attachment' && message.media_url && (
                        <AttachmentCard mediaUrl={message.media_url} body={message.body} />
                    )}
                </div>
                <span className="message-bubble__time">{relativeTime(message.created_at)}</span>
            </div>
        </div>
    );
}

'use client';

import { Icon } from '@/src/components/shared/ui';
import { UserAvatar, AvatarGroupCount, AvatarGroup, AvatarFallback, AvatarImage, Avatar } from '@/src/components/shared/ui/Avatar';
import { useConversation, useConversationParticipants } from '@/src/hooks/queries/chat';
import { useAuth } from '@/src/hooks/auth';


interface Props {
    workspaceId: string;
    conversationId: string;
}

export function ConversationHeader({ workspaceId, conversationId }: Props) {
    const { data, isLoading } = useConversation(workspaceId, conversationId);
    const { user } = useAuth();
    const { data: participantsData } = useConversationParticipants(workspaceId, conversationId);
    const conv = data?.conversation;

    if (isLoading) {
        return <div className="conversation-header conversation-header--skeleton" aria-hidden />;
    }

    if (!conv) return null;

    const displayName = conv.name || (conv.type === 'direct' ? 'Direct Message' : 'Group Chat');
    const participantsCount = participantsData?.participants.length ?? 0;

    const normalizeUuid = (id?: string) => id?.replace(/-/g, '').toLowerCase() ?? '';
    const normalizedUserId = normalizeUuid(user?.id);
    const otherParty = conv.type === 'direct' || conv.type === 'group'
        ? participantsData?.participants.find((p) => normalizeUuid(p.user_id) !== normalizedUserId) ?? null
        : null;

    return (
        <header className="conversation-header" aria-label={`Conversation: ${displayName}`}>
            {otherParty && (
                <div className="conversation-header__user">
                    {conv.type === 'direct' ? (
                        <UserAvatar
                            name={otherParty.name}
                            email={otherParty.email}
                            username={otherParty.username}
                            size="sm"
                        />
                    ) : (
                        <AvatarGroup className="conversation-header__avatar-group">
                            {participantsData?.participants.slice(0, 3).map((participant) => (
                                <Avatar key={participant.user_id}>
                                    <AvatarImage
                                        // src={participant.avatar_url}
                                        alt={participant.name || participant.username || participant.email}
                                    />
                                    <AvatarFallback>
                                        <UserAvatar
                                            name={participant.name}
                                            email={participant.email}
                                            username={participant.username}
                                            size="xs"
                                        />
                                    </AvatarFallback>
                                </Avatar>
                            ))}
                            {participantsCount > 4 && (
                                <AvatarGroupCount>+{participantsCount - 3}</AvatarGroupCount>
                            )}
                        </AvatarGroup>
                    )}
                    {conv.type === 'direct' ? (
                        <div className="conversation-header__user-info">
                            <span className="conversation-header__user-name">
                                {otherParty.name || otherParty.username || otherParty.email}
                            </span>
                            <span className="conversation-header__user-email">{otherParty.email}</span>
                        </div>
                    ) : (
                        <div className="conversation-header__user-info">
                            <span className="conversation-header__user-name">
                                {conv.name}
                            </span>
                            <span className="conversation-header__user-email">{participantsCount} participants</span>
                        </div>
                    )}
                </div>
            )}
        </header>
    );
}

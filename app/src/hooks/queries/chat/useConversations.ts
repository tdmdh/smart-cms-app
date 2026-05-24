import { useQuery } from '@tanstack/react-query';
import { chatApi } from './config';

export const chatKeys = {
    conversations: (workspaceId: string) => ['chat', 'conversations', workspaceId] as const,
    messages: (workspaceId: string, conversationId: string) =>
        ['chat', 'messages', workspaceId, conversationId] as const,
};

export function useConversations(workspaceId: string) {
    return useQuery({
        queryKey: chatKeys.conversations(workspaceId),
        queryFn: () => chatApi.conversations.list(workspaceId),
        enabled: !!workspaceId,
    });
}

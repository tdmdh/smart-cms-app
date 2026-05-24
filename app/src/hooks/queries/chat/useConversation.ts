import { useQuery } from '@tanstack/react-query';
import { chatApi } from './config';
import { chatKeys } from './useConversations';

export function useConversation(workspaceId: string, conversationId: string) {
    return useQuery({
        queryKey: [...chatKeys.conversations(workspaceId), conversationId],
        queryFn: () => chatApi.conversations.get(workspaceId, conversationId),
        enabled: !!workspaceId && !!conversationId,
        staleTime: 30_000,
    });
}


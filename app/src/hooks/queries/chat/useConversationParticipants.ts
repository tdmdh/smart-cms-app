import { useQuery } from '@tanstack/react-query';
import { chatApi } from './config';
import { chatKeys } from './useConversations';

export function useConversationParticipants(workspaceId: string, conversationId: string) {
    return useQuery({
        queryKey: [...chatKeys.conversations(workspaceId), conversationId, 'participants'],
        queryFn: () => chatApi.conversations.listParticipants(workspaceId, conversationId),
        enabled: !!workspaceId && !!conversationId,
        staleTime: 60_000,
    });
}

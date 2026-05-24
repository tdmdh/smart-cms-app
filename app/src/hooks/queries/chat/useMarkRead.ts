import { useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from './config';
import { chatKeys } from './useConversations';

export function useMarkRead(workspaceId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (conversationId: string) =>
            chatApi.conversations.markRead(workspaceId, conversationId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: chatKeys.conversations(workspaceId),
            });
        },
    });
}

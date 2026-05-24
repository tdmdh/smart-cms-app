import { useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from './config';
import { chatKeys } from './useConversations';

export function useDeleteConversation(workspaceId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (conversationId: string) =>
            chatApi.conversations.delete(workspaceId, conversationId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: chatKeys.conversations(workspaceId),
            });
        },
    });
}

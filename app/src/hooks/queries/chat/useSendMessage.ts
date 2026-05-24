import { useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi, type SendMessageBody } from './config';
import { chatKeys } from './useConversations';

export function useSendMessage(workspaceId: string, conversationId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: SendMessageBody) =>
            chatApi.messages.send(workspaceId, conversationId, body),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: chatKeys.messages(workspaceId, conversationId),
            });
            queryClient.invalidateQueries({
                queryKey: chatKeys.conversations(workspaceId),
            });
        },
    });
}

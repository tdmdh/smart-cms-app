import { useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi, type CreateConversationBody } from './config';
import { chatKeys } from './useConversations';

export function useCreateConversation(workspaceId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: CreateConversationBody) =>
            chatApi.conversations.create(workspaceId, body),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: chatKeys.conversations(workspaceId),
            });
        },
    });
}

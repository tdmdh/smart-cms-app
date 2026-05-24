import { useInfiniteQuery } from '@tanstack/react-query';
import { chatApi } from './config';
import { chatKeys } from './useConversations';

export function useMessages(workspaceId: string, conversationId: string) {
    return useInfiniteQuery({
        queryKey: chatKeys.messages(workspaceId, conversationId),
        queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
            chatApi.messages.list(workspaceId, conversationId, {
                before_id: pageParam,
                limit: 50,
            }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (last) => last.next_cursor || undefined,
        enabled: !!conversationId && !!workspaceId,
    });
}

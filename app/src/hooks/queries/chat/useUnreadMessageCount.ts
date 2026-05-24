import { useConversations } from './useConversations';

export function useUnreadMessageCount(workspaceId: string) {
    const { data } = useConversations(workspaceId);
    return (data?.conversations ?? []).reduce((sum, c) => sum + (c.unread_count ?? 0), 0);
}

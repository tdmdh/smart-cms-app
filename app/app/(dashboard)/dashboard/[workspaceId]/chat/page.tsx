'use client';

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { MessageThread } from '@/src/components/chat/MessageThread';
import { NewConversationModal } from '@/src/components/chat/NewConversationModal';
import { EmptyState } from '@/src/components/shared/ui';
import { useAppSelector, useAppDispatch } from '@/src/store/hooks';
import { selectOpenModal, closeModal, setSidebarView } from '@/src/store/slices/layoutSlice';

export default function ChatPage() {
    const params = useParams<{ workspaceId: string }>();
    const workspaceId = params.workspaceId;
    const searchParams = useSearchParams();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const activeConversationId = searchParams.get('conversation');
    const openModalId = useAppSelector(selectOpenModal);

    const handleConversationCreated = (conversationId: string) => {
        dispatch(closeModal());
        dispatch(setSidebarView({ view: 'conversations', data: { workspaceId }, width: 'md' }));
        const params = new URLSearchParams(searchParams.toString());
        params.set('conversation', conversationId);
        router.push(`?${params.toString()}`, { scroll: false });
    };

    return (
        <>
            {activeConversationId ? (
                <MessageThread workspaceId={workspaceId} conversationId={activeConversationId} />
            ) : (
                <EmptyState
                    icon="message-square"
                    title="Select a conversation"
                    description="Pick a conversation from the sidebar panel, or create a new one."
                />
            )}

            {openModalId === 'new-conversation' && (
                <NewConversationModal
                    workspaceId={workspaceId}
                    onClose={() => dispatch(closeModal())}
                    onCreated={handleConversationCreated}
                />
            )}
        </>
    );
}
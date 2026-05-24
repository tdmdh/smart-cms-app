'use client';

import { useState } from 'react';
import { Icon, Button, Input } from '@/src/components/shared/ui';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/src/components/shared/ui';
import { useWorkspaceMembers } from '@/src/hooks/queries/workspace-management';
import { useCreateConversation } from '@/src/hooks/queries/chat';

interface Props {
    workspaceId: string;
    onClose: () => void;
    onCreated: (conversationId: string) => void;
}

export function NewConversationModal({ workspaceId, onClose, onCreated }: Props) {
    const [type, setType] = useState<'direct' | 'group'>('direct');
    const [name, setName] = useState('');
    const [search, setSearch] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const { data: membersData } = useWorkspaceMembers(workspaceId);
    const createConversation = useCreateConversation(workspaceId);
    const members = (membersData?.members ?? []).filter((m) => {
        const label = m.name || m.username || m.email || '';
        return label.toLowerCase().includes(search.toLowerCase());
    });

    const toggleMember = (userId: string) => {
        setSelectedUserIds((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        );
    };

    const handleCreate = () => {
        createConversation.mutate(
            { type, name: type === 'group' ? name : undefined, participant_ids: selectedUserIds },
            { onSuccess: (data) => onCreated(data.conversation.id) }
        );
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>New Conversation</DialogTitle>
                </DialogHeader>
                <div className="new-conversation-modal">
                    <div className="new-conversation-modal__type-toggle">
                        <button
                            className={`new-conversation-modal__type-btn ${type === 'direct' ? 'new-conversation-modal__type-btn--active' : ''}`}
                            onClick={() => setType('direct')}
                        >
                            <Icon name="user" size={14} />
                            {' '}Direct
                        </button>
                        <button
                            className={`new-conversation-modal__type-btn ${type === 'group' ? 'new-conversation-modal__type-btn--active' : ''}`}
                            onClick={() => setType('group')}
                        >
                            <Icon name="users" size={14} />
                            {' '}Group
                        </button>
                    </div>

                    {type === 'group' && (
                        <Input
                            placeholder="Group name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    )}

                    <Input
                        placeholder="Search members..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <div className="new-conversation-modal__member-list">
                        {members.map((member) => {
                            const label = member.name || member.username || member.email || member.user_id;
                            const selected = selectedUserIds.includes(member.user_id);
                            return (
                                <button
                                    key={member.user_id}
                                    className={`new-conversation-modal__member-item ${selected ? 'new-conversation-modal__member-item--selected' : ''}`}
                                    onClick={() => toggleMember(member.user_id)}
                                >
                                    {selected && <Icon name="check" size={14} />}
                                    <span className="new-conversation-modal__member-name">{label}</span>
                                </button>
                            );
                        })}
                        {members.length === 0 && (
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', padding: '0.5rem', margin: 0 }}>
                                No members found
                            </p>
                        )}
                    </div>

                    <div className="new-conversation-modal__footer">
                        <Button size="sm" variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            variant="primary"
                            onClick={handleCreate}
                            loading={createConversation.isPending}
                            disabled={selectedUserIds.length === 0 || createConversation.isPending}
                        >
                            Create
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

'use client';

import { memo, useState } from 'react';
import { Send, Trash2, Edit2, MoreVertical } from 'lucide-react';
import { useComments, useCreateComment, useUpdateComment, useDeleteComment } from '@/src/hooks/queries/project-management';
import { Button, Form, Icon, Input, Textarea, UserAvatar } from '../shared/ui';

interface CommentsSectionProps {
    taskId: string;
}

interface Comment {
    id: string;
    content: string;
    user_id: string;
    username?: string;
    name?: string;
    created_at: string;
    updated_at?: string;
    avatar_url?: string;
    
}

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

function CommentItem({
    comment,
    taskId,
    onEdit,
    onDelete
}: {
    comment: Comment;
    taskId: string;
    onEdit: (id: string, content: string) => void;
    onDelete: (id: string) => void;
}) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="comment-item">
            <UserAvatar
                key={comment.user_id}
                name={comment.name}
                username={comment.username}
                avatarUrl={comment.avatar_url}
                size="xs"
            />
            <div className="comment-item__content">
                <div className="comment-item__header">
                    <span className="comment-item__author">{comment.name || 'Unknown'}</span>
                    <span className="comment-item__time">{formatTimeAgo(comment.created_at)}</span>
                    <div className="comment-item__actions">
                        <button
                            className="comment-item__menu"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            <MoreVertical size={14} />
                        </button>
                        {isMenuOpen && (
                            <div className="comment-item__dropdown">
                                <button onClick={() => { onEdit(comment.id, comment.content); setIsMenuOpen(false); }}>
                                    <Edit2 size={12} /> Edit
                                </button>
                                <button onClick={() => { onDelete(comment.id); setIsMenuOpen(false); }} className="comment-item__dropdown-danger">
                                    <Trash2 size={12} /> Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <p className="comment-item__text">{comment.content}</p>
            </div>
        </div>
    );
}

function CommentsSectionComponent({ taskId }: CommentsSectionProps) {
    const [newComment, setNewComment] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');

    const { data, isLoading } = useComments(taskId);
    const createComment = useCreateComment();
    const updateComment = useUpdateComment();
    const deleteComment = useDeleteComment();

    const comments = (data?.comments ?? []) as Comment[];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        createComment.mutate(
            { taskId, data: { content: newComment } },
            { onSuccess: () => setNewComment('') }
        );
    };

    const handleEdit = (id: string, content: string) => {
        setEditingId(id);
        setEditContent(content);
    };

    const handleSaveEdit = () => {
        if (!editingId || !editContent.trim()) return;
        updateComment.mutate(
            { id: editingId, taskId, data: { content: editContent } },
            { onSuccess: () => { setEditingId(null); setEditContent(''); } }
        );
    };

    const handleDelete = (id: string) => {
        if (confirm('Delete this comment?')) {
            deleteComment.mutate({ id, taskId });
        }
    };

    if (isLoading) {
        return (
            <div className="comments-section comments-section--loading">
                <div className="comments-section__skeleton" />
                <div className="comments-section__skeleton" />
            </div>
        );
    }

    return (
        <div className="comments-section">
            <h4 className="comments-section__title">
                Comments
                {comments.length > 0 && <span className="comments-section__count">{comments.length}</span>}
            </h4>

            <div className="comments-section__list">
                {comments.length === 0 ? (
                    <div className="comments-section__empty">No comments yet</div>
                ) : (
                    comments.map(comment => (
                        editingId === comment.id ? (
                            <div key={comment.id} className="comment-edit">
                                <Textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                />
                                <div className="comment-edit__actions">
                                    <Button variant="ghost" onClick={() => setEditingId(null)} size="sm">Cancel</Button>
                                    <Button onClick={handleSaveEdit} size="sm">Save</Button>
                                </div>
                            </div>
                        ) : (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                taskId={taskId}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        )
                    ))
                )}
            </div>

            <Form 
            onSubmit={handleSubmit} 
            className='flex items-center gap-2'
            >
                <Input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                />
                <Button
                    type="submit"
                    iconOnly
                    size="sm"

                    disabled={!newComment.trim() || createComment.isPending}
                >
                    <Icon dynamicIcon={{
                        conditions: [
                            { when: createComment.isPending, icon: 'loader' },
                            { when: !createComment.isPending, icon: 'send' },
                        ],
                        fallback: 'send'
                    }} size={16} />
                </Button>
            </Form>
        </div>
    );
}

export const CommentsSection = memo(CommentsSectionComponent);

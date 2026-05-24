'use client';

import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Textarea, useToast } from '@/src/components/shared/ui';
import { useSendMessage, chatApi, chatKeys } from '@/src/hooks/queries/chat';
import { TaskPicker } from './TaskPicker';
import { AssetPicker } from './AssetPicker';

interface Props {
    workspaceId: string;
    conversationId: string;
}

export function MessageComposer({ workspaceId, conversationId }: Props) {
    const [text, setText] = useState('');
    const [showTaskPicker, setShowTaskPicker] = useState(false);
    const [showAssetPicker, setShowAssetPicker] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const send = useSendMessage(workspaceId, conversationId);
    const queryClient = useQueryClient();
    const  toast  = useToast();

    const handleSendText = () => {
        if (!text.trim() || send.isPending) return;
        send.mutate({ type: 'text', body: text.trim() });
        setText('');
    };

    const handleSendTaskRef = (taskId: string) => {
        send.mutate({ type: 'task_ref', ref_id: taskId });
        setShowTaskPicker(false);
    };

    const handleSendAssetRef = (assetId: string) => {
        send.mutate({ type: 'asset_ref', ref_id: assetId });
        setShowAssetPicker(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            await chatApi.messages.sendAttachment(workspaceId, conversationId, file);
            queryClient.invalidateQueries({
                queryKey: chatKeys.messages(workspaceId, conversationId),
            });
            queryClient.invalidateQueries({
                queryKey: chatKeys.conversations(workspaceId),
            });
        } catch (err: any) {
            toast.error(err.message || "Failed to upload")
        }
        e.target.value = '';
    };

    return (
        <div className="message-composer">
            <div className="message-composer__toolbar">
                <Button
                    size="xs"
                    variant="ghost"
                    leftIcon="list-checks"
                    iconSize={14}
                    onClick={() => setShowTaskPicker(true)}
                >
                    Task
                </Button>
                <Button
                    size="xs"
                    variant="ghost"
                    leftIcon="image"
                    iconSize={14}
                    onClick={() => setShowAssetPicker(true)}
                >
                    File
                </Button>
                <Button
                    size="xs"
                    variant="ghost"
                    leftIcon="upload"
                    iconSize={14}
                    onClick={() => fileInputRef.current?.click()}
                >
                    Upload
                </Button>
                <input
                    ref={fileInputRef}
                    type="file"
                    className="sr-only"
                    aria-hidden
                    onChange={handleFileUpload}
                />
            </div>
            <div className="message-composer__row">
                <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendText();
                        }
                    }}
                    placeholder="Write a message… (Enter sends)"
                    rows={1}
                />
                <Button
                    size="sm"
                    variant="primary"
                    leftIcon="send"
                    iconSize={18}
                    iconOnly
                    onClick={handleSendText}
                    loading={send.isPending}
                    disabled={!text.trim()}
                />
            </div>

            {showTaskPicker && (
                <TaskPicker
                    onSelect={handleSendTaskRef}
                    onClose={() => setShowTaskPicker(false)}
                />
            )}
            {showAssetPicker && (
                <AssetPicker
                    workspaceId={workspaceId}
                    onSelect={handleSendAssetRef}
                    onClose={() => setShowAssetPicker(false)}
                />
            )}
        </div>
    );
}

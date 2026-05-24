'use client';

import { useState } from 'react';
import { DialogFooter, Icon, Input } from '@/src/components/shared/ui';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    Button,
} from '@/src/components/shared/ui';

interface Props {
    workspaceId: string;
    onSelect: (assetId: string) => void;
    onClose: () => void;
}

export function AssetPicker({ onSelect, onClose }: Props) {
    const [assetId, setAssetId] = useState('');

    const handleSubmit = () => {
        const trimmed = assetId.trim();
        if (!trimmed) return;
        onSelect(trimmed);
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Attach an asset</DialogTitle>
                </DialogHeader>
                <div className="picker-modal">
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Enter the asset ID to attach it to this message.
                    </p>
                    <Input
                        placeholder="Asset ID..."
                        value={assetId}
                        onChange={(e) => setAssetId(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSubmit();
                            if (e.key === 'Escape') onClose();
                        }}
                    />
                    <DialogFooter  style={{ gap: '0.5rem', display: 'flex' }}>
                        <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button size="sm" iconSize={12} leftIcon='clipboard' variant="primary" onClick={handleSubmit} disabled={!assetId.trim()}>
                            Attach
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}

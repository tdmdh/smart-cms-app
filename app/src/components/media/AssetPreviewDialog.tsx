'use client';

import Image from 'next/image';
import { Button } from '@/src/components/shared/ui';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/src/components/shared/ui/Dialog';
import { Icon } from '@/src/components/shared/ui';
import type { AssetItem } from './AssetCard';

interface AssetPreviewDialogProps {
    asset: AssetItem | null;
    open: boolean;
    onClose: () => void;
}

export function AssetPreviewDialog({
    asset,
    open,
    onClose,
}: AssetPreviewDialogProps) {
    if (!asset) return null;

    const isImage = asset.assetType === 'image' && (asset.thumbnailUrl || asset.url);
    const isVideo = asset.assetType === 'video' && (asset.thumbnailUrl || asset.url);
    const isPdf = asset.mimeType === 'application/pdf' && asset.url;
    const hasUrl = !!asset.url;

    const handleDownload = () => {
        if (asset.url) {
            const link = document.createElement('a');
            link.href = asset.url;
            link.download = asset.name;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleOpenInNewTab = () => {
        if (asset.url) {
            window.open(asset.url, '_blank');
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="asset-preview-dialog">
                <DialogHeader>
                    <DialogTitle>{asset.name}</DialogTitle>
                    <DialogDescription>
                        {asset.mimeType} • {formatBytes(asset.sizeBytes)}
                    </DialogDescription>
                </DialogHeader>

                <div className="asset-preview-dialog__content">
                    {isImage ? (
                        <div className="asset-preview-dialog__image-container">
                            <Image
                                src={asset.url || asset.thumbnailUrl!}
                                alt={asset.name}
                                fill
                                className="asset-preview-dialog__image"
                                sizes="(max-width: 768px) 100vw, 800px"
                            />
                        </div>
                    ) : isVideo ? (
                        <video
                            src={asset.url || asset.thumbnailUrl}
                            controls
                            className="asset-preview-dialog__video"
                        />
                    ) : isPdf ? (
                        <div className="asset-preview-dialog__pdf-container">
                            <iframe
                                src={`${asset.url}#toolbar=1`}
                                className="asset-preview-dialog__pdf"
                                title={asset.name}
                            />
                        </div>
                    ) : (
                        <div className="asset-preview-dialog__placeholder">
                            <Icon name="file" size={96} />
                            <p>{asset.name}</p>
                            <p className="text-muted">{asset.mimeType}</p>
                            {hasUrl && (
                                <p className="text-sm mt-2">Click Download to access this file</p>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {hasUrl && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleOpenInNewTab}
                                leftIcon="external-link"
                            >
                                Open
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleDownload}
                                leftIcon="download"
                            >
                                Download
                            </Button>
                        </>
                    )}
                    <Button variant="secondary" size="sm" onClick={onClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function formatBytes(bytes: number): string {
    if (!bytes || bytes === 0 || isNaN(bytes)) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default AssetPreviewDialog;

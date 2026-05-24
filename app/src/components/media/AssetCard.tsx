'use client';

import { memo } from 'react';
import Image from 'next/image';
import { Icon } from '@/src/components/shared/ui';
import type { IconName } from '@/src/components/shared/ui';

export interface AssetItem {
    id: string;
    name: string;
    thumbnailUrl?: string;
    url?: string; // Original file URL for download/preview
    mimeType: string;
    sizeBytes: number;
    createdAt: string;
    assetType: 'image' | 'video' | 'document' | 'audio' | 'other';
}

export interface AssetCardProps {
    asset: AssetItem;
    selected?: boolean;
    onSelect?: (asset: AssetItem, addToSelection?: boolean) => void;
    onClick?: (asset: AssetItem) => void;
}

const assetTypeIcons: Record<AssetItem['assetType'], IconName> = {
    image: 'image',
    video: 'video',
    document: 'file',
    audio: 'audio',
    other: 'file',
};

function AssetCardComponent({
    asset,
    selected = false,
    onSelect,
    onClick,
}: AssetCardProps) {
    const handleClick = (e: React.MouseEvent) => {
        // Ctrl/Cmd+click toggles selection
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onSelect?.(asset, true);
        } else {
            // Normal click opens preview
            onClick?.(asset);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.(asset);
        }
    };

    const handleCheckboxClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect?.(asset, true);
    };

    const cardClasses = [
        'asset-card',
        selected && 'asset-card--selected',
    ]
        .filter(Boolean)
        .join(' ');

    const isImage = asset.assetType === 'image' && asset.thumbnailUrl;

    return (
        <div
            className={cardClasses}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            aria-selected={selected}
        >
            <div className="asset-card__preview">
                {isImage ? (
                    <Image
                        src={asset.thumbnailUrl!}
                        alt={asset.name}
                        fill
                        className="asset-card__image"
                        sizes="(max-width: 768px) 50vw, 200px"
                    />
                ) : (
                    <div className="asset-card__icon">
                        <Icon name={assetTypeIcons[asset.assetType]} size={48} />
                    </div>
                )}

                {/* Selection checkbox */}
                <div
                    className={`asset-card__checkbox ${selected ? 'asset-card__checkbox--checked' : ''}`}
                    onClick={handleCheckboxClick}
                >
                    {selected && <Icon name="check" size={12} />}
                </div>
            </div>

            <div className="asset-card__info">
                <p className="asset-card__name" title={asset.name}>
                    {asset.name}
                </p>
                <p className="asset-card__meta">
                    {formatBytes(asset.sizeBytes)}
                </p>
            </div>
        </div>
    );
}

function formatBytes(bytes: number): string {
    if (!bytes || bytes === 0 || isNaN(bytes)) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export const AssetCard = memo(AssetCardComponent);
AssetCard.displayName = 'AssetCard';

export default AssetCard;


'use client';

import { memo } from 'react';
import { Icon } from '@/src/components/shared/ui';
import type { IconName } from '@/src/components/shared/ui';
import {
    TableRow,
    TableCell,
} from '@/src/components/shared/ui';
import type { AssetItem } from './AssetCard';

// ==========================================================================
// TYPES
// ==========================================================================

export type AssetRowItem =
    | { type: 'asset'; data: AssetItem }
    | { type: 'folder'; data: FolderItem };

export interface FolderItem {
    id: string;
    name: string;
    assetCount: number;
    createdAt?: string;
}

export interface AssetRowProps {
    item: AssetRowItem;
    selected?: boolean;
    onSelect?: (item: AssetRowItem, addToSelection?: boolean) => void;
    onClick?: (item: AssetRowItem) => void;
}

// ==========================================================================
// ICONS
// ==========================================================================

const assetTypeIcons: Record<AssetItem['assetType'], IconName> = {
    image: 'image',
    video: 'video',
    document: 'file',
    audio: 'audio',
    other: 'file',
};

// ==========================================================================
// HELPERS
// ==========================================================================

function formatBytes(bytes: number): string {
    if (!bytes || bytes === 0 || isNaN(bytes)) return '—';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(dateString?: string): string {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

// ==========================================================================
// ASSET ROW COMPONENT (Table-based)
// ==========================================================================

function AssetRowComponent({
    item,
    selected = false,
    onSelect,
    onClick,
}: AssetRowProps) {
    const handleClick = (e: React.MouseEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onSelect?.(item, true);
        } else {
            onClick?.(item);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.(item);
        }
    };

    const handleCheckboxClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect?.(item, true);
    };

    const isFolder = item.type === 'folder';

    // ---- Folder row ----
    if (isFolder) {
        const folder = item.data;
        return (
            <TableRow
                className={[
                    'asset-table__row',
                    'asset-table__row--folder',
                    selected && 'asset-table__row--selected',
                ].filter(Boolean).join(' ')}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                tabIndex={0}
            >
                <TableCell variant="checkbox">
                    <div
                        className={`asset-table__checkbox ${selected ? 'asset-table__checkbox--checked' : ''}`}
                        onClick={handleCheckboxClick}
                    >
                        {selected && <Icon name="check" size={8} />}
                    </div>
                </TableCell>
                <TableCell>
                    <Icon name="folder" size={20} className="asset-table__icon asset-table__icon--folder" />
                </TableCell>
                <TableCell>
                    <span className="asset-table__name">{folder.name}</span>
                </TableCell>
                <TableCell>
                    <span className="asset-table__type">Folder</span>
                </TableCell>
                <TableCell>
                    <span className="asset-table__size">
                        {folder.assetCount} item{folder.assetCount !== 1 ? 's' : ''}
                    </span>
                </TableCell>
                <TableCell>
                    <span className="asset-table__date">{formatDate(folder.createdAt)}</span>
                </TableCell>
            </TableRow>
        );
    }

    // ---- Asset row ----
    const asset = item.data as AssetItem;
    return (
        <TableRow
            className={[
                'asset-table__row',
                selected && 'asset-table__row--selected',
            ].filter(Boolean).join(' ')}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            tabIndex={0}
        >
            <TableCell variant="checkbox">
                <div
                    className={`asset-table__checkbox ${selected ? 'asset-table__checkbox--checked' : ''}`}
                    onClick={handleCheckboxClick}
                >
                    {selected && <Icon name="check" size={8} />}
                </div>
            </TableCell>
            <TableCell>
                <Icon name={assetTypeIcons[asset.assetType]} size={20} className="asset-table__icon" />
            </TableCell>
            <TableCell>
                <span className="asset-table__name">{asset.name}</span>
            </TableCell>
            <TableCell>
                <span className="asset-table__type">{asset.assetType}</span>
            </TableCell>
            <TableCell>
                <span className="asset-table__size">{formatBytes(asset.sizeBytes)}</span>
            </TableCell>
            <TableCell>
                <span className="asset-table__date">{formatDate(asset.createdAt)}</span>
            </TableCell>
        </TableRow>
    );
}

export const AssetRow = memo(AssetRowComponent);
AssetRow.displayName = 'AssetRow';

export default AssetRow;


'use client';

import { ReactNode, memo, useState, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@/src/components/shared/ui';
import { Button } from '@/src/components/shared/ui/Button';

export interface BulkAction {
    label: string;
    icon?: string;
    variant?: 'primary' | 'danger' | 'ghost';
    onClick: (selectedIds: string[]) => void;
}

interface DashboardListPageProps {
    /** Stats pills for the header-left area */
    stats?: ReactNode;
    /** Actions for the header-right area (search, filters, buttons) */
    actions?: ReactNode;
    /** The list content */
    children: ReactNode;
    /** Enable bulk selection mode */
    bulkActions?: BulkAction[];
    /** Currently selected IDs (controlled) */
    selectedIds?: string[];
    /** Selection change handler */
    onSelectionChange?: (ids: string[]) => void;
    /** Total selectable item count (for "select all") */
    totalItems?: number;
    /** All selectable item IDs */
    allItemIds?: string[];
}

function DashboardListPageComponent({
    stats,
    actions,
    children,
    bulkActions,
    selectedIds = [],
    onSelectionChange,
    totalItems = 0,
    allItemIds = [],
}: DashboardListPageProps) {
    const hasBulkSelection = bulkActions && bulkActions.length > 0;
    const hasSelection = selectedIds.length > 0;
    const allSelected = allItemIds.length > 0 && selectedIds.length === allItemIds.length;

    const handleSelectAll = useCallback(() => {
        if (allSelected) {
            onSelectionChange?.([]);
        } else {
            onSelectionChange?.([...allItemIds]);
        }
    }, [allSelected, allItemIds, onSelectionChange]);

    const handleClearSelection = useCallback(() => {
        onSelectionChange?.([]);
    }, [onSelectionChange]);

    return (
        <div className="dashboard-list">
            {/* Header with stats + actions */}
            <div className="project-team__header">
                <div className="project-team__header-left">
                    {stats && (
                        <div className="project-team__stats">
                            {stats}
                        </div>
                    )}
                </div>
                <div className="project-team__header-actions">
                    {actions}
                </div>
            </div>

            {/* Content */}
            {children}

            {/* Floating bulk action bar */}
            <AnimatePresence>
                {hasBulkSelection && hasSelection && (
                    <motion.div
                        className="bulk-action-bar"
                        initial={{ y: 80, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 80, opacity: 0 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    >
                        <div className="bulk-action-bar__info">
                            <button
                                className="bulk-action-bar__checkbox"
                                onClick={handleSelectAll}
                                aria-label={allSelected ? 'Deselect all' : 'Select all'}
                            >
                                <Icon name={allSelected ? 'check' : 'minus'} size={14} />
                            </button>
                            <span className="bulk-action-bar__count">
                                {selectedIds.length} selected
                            </span>
                        </div>

                        <div className="bulk-action-bar__actions">
                            {bulkActions.map((action) => (
                                <Button
                                    key={action.label}
                                    variant={action.variant || 'ghost'}
                                    size="xs"
                                    onClick={() => action.onClick(selectedIds)}
                                >
                                    {action.label}
                                </Button>
                            ))}
                            <Button
                                variant="ghost"
                                size="xs"
                                onClick={handleClearSelection}
                            >
                                Cancel
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export const DashboardListPage = memo(DashboardListPageComponent);

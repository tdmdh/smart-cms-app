'use client';

import { memo } from 'react';
import { Search, X } from 'lucide-react';
import { Button, Input } from '@/src/components/shared/ui';

interface ClientFiltersProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    statusFilter?: string;
    onStatusChange?: (status: string) => void;
    totalCount?: number;
    filteredCount?: number;
}

function ClientFiltersComponent({
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusChange,
    totalCount,
    filteredCount,
}: ClientFiltersProps) {
    const hasActiveFilters = searchQuery || statusFilter;
    const showingFiltered = totalCount !== undefined && filteredCount !== undefined && totalCount !== filteredCount;

    return (
        <div className="clients-filters">
            <div className="clients-filters__search">
                <Search size={16} className="clients-filters__search-icon" />
                <input
                    type="text"
                    placeholder="Search clients..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="clients-filters__input"
                />
                {searchQuery && (
                    <button
                        type="button"
                        className="clients-filters__clear"
                        onClick={() => onSearchChange('')}
                        aria-label="Clear search"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            <div className="clients-filters__controls">
                {onStatusChange && (
                    <div className="clients-filters__status">
                        <select
                            value={statusFilter || ''}
                            onChange={(e) => onStatusChange(e.target.value)}
                            className="clients-filters__select"
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                )}

                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            onSearchChange('');
                            onStatusChange?.('');
                        }}
                    >
                        Clear All
                    </Button>
                )}
            </div>

            {showingFiltered && (
                <div className="clients-filters__count">
                    Showing {filteredCount} of {totalCount} clients
                </div>
            )}
        </div>
    );
}

export const ClientFilters = memo(ClientFiltersComponent);

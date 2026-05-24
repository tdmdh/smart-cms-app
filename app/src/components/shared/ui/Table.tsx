'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

// ==========================================================================
// TYPES
// ==========================================================================

export type TableVariant = 'default' | 'striped' | 'borderless' | 'compact' | 'transparent';
export type SortDirection = 'asc' | 'desc' | null;

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
    variant?: TableVariant;
}

export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> { }

export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> { }

export interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> { }

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
    selected?: boolean;
}

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
    sortable?: boolean;
    sortDirection?: SortDirection;
    onSort?: () => void;
}

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
    variant?: 'default' | 'actions' | 'checkbox' | 'avatar' | 'badge' | 'truncate';
}

export interface TableCaptionProps extends React.HTMLAttributes<HTMLTableCaptionElement> { }

export interface TableContainerProps extends React.HTMLAttributes<HTMLDivElement> { }

export interface TableEmptyProps extends React.HTMLAttributes<HTMLDivElement> {
    icon?: React.ReactNode;
    title?: string;
    description?: string;
}

export interface TablePaginationProps extends React.HTMLAttributes<HTMLDivElement> {
    currentPage: number;
    totalPages: number;
    totalItems?: number;
    pageSize?: number;
    onPageChange: (page: number) => void;
    showInfo?: boolean;
}

// ==========================================================================
// VARIANT MAPPINGS
// ==========================================================================

const variantClasses: Record<TableVariant, string> = {
    default: 'table',
    striped: 'table table--striped',
    borderless: 'table table--borderless',
    compact: 'table table--compact',
    transparent: 'table table--transparent',
};

const cellVariantClasses: Record<NonNullable<TableCellProps['variant']>, string> = {
    default: '',
    actions: 'table-cell--actions',
    checkbox: 'table-cell--checkbox',
    avatar: 'table-cell--avatar',
    badge: 'table-cell--badge',
    truncate: 'table-cell--truncate',
};

// ==========================================================================
// TABLE CONTAINER
// ==========================================================================

export const TableContainer = React.forwardRef<HTMLDivElement, TableContainerProps>(
    ({ className = '', children, ...props }, ref) => {
        const classes = ['table-container', className].filter(Boolean).join(' ');

        return (
            <div ref={ref} className={classes} {...props}>
                {children}
            </div>
        );
    }
);
TableContainer.displayName = 'TableContainer';

// ==========================================================================
// TABLE
// ==========================================================================

export const Table = React.forwardRef<HTMLTableElement, TableProps>(
    ({ className = '', variant = 'default', ...props }, ref) => {
        const classes = [variantClasses[variant], className].filter(Boolean).join(' ');

        return (
            <table ref={ref} className={classes} {...props} />
        );
    }
);
Table.displayName = 'Table';

// ==========================================================================
// TABLE HEADER
// ==========================================================================

export const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
    ({ className = '', ...props }, ref) => {
        const classes = ['table__header', className].filter(Boolean).join(' ');

        return <thead ref={ref} className={classes} {...props} />;
    }
);
TableHeader.displayName = 'TableHeader';

// ==========================================================================
// TABLE BODY
// ==========================================================================

export const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
    ({ className = '', ...props }, ref) => {
        const classes = ['table__body', className].filter(Boolean).join(' ');

        return <tbody ref={ref} className={classes} {...props} />;
    }
);
TableBody.displayName = 'TableBody';

// ==========================================================================
// TABLE FOOTER
// ==========================================================================

export const TableFooter = React.forwardRef<HTMLTableSectionElement, TableFooterProps>(
    ({ className = '', ...props }, ref) => {
        const classes = ['table__footer', className].filter(Boolean).join(' ');

        return <tfoot ref={ref} className={classes} {...props} />;
    }
);
TableFooter.displayName = 'TableFooter';

// ==========================================================================
// TABLE ROW
// ==========================================================================

export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
    ({ className = '', selected, ...props }, ref) => {
        const classes = [
            'table__row',
            selected && 'table__row--selected',
            className,
        ].filter(Boolean).join(' ');

        return <tr ref={ref} className={classes} data-selected={selected || undefined} {...props} />;
    }
);
TableRow.displayName = 'TableRow';

// ==========================================================================
// TABLE HEAD CELL
// ==========================================================================

export const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
    ({ className = '', sortable, sortDirection, onSort, children, ...props }, ref) => {
        const classes = ['table__head', className].filter(Boolean).join(' ');

        if (sortable) {
            const sortClasses = [
                'table__sortable',
                sortDirection && 'is-active',
            ].filter(Boolean).join(' ');

            const SortIcon = sortDirection === 'asc'
                ? ArrowUp
                : sortDirection === 'desc'
                    ? ArrowDown
                    : ArrowUpDown;

            return (
                // eslint-disable-next-line jsx-a11y/no-interactive-element-to-noninteractive-role
                <th
                    ref={ref}
                    className={classes}
                    {...props}
                >
                    <button
                        type="button"
                        className={sortClasses}
                        onClick={onSort}
                    >
                        {children}
                        <SortIcon />
                    </button>
                </th>
            );
        }

        return <th ref={ref} className={classes} {...props}>{children}</th>;
    }
);
TableHead.displayName = 'TableHead';

// ==========================================================================
// TABLE CELL
// ==========================================================================

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
    ({ className = '', variant = 'default', ...props }, ref) => {
        const classes = [
            cellVariantClasses[variant],
            className,
        ].filter(Boolean).join(' ');

        return <td ref={ref} className={classes || undefined} {...props} />;
    }
);
TableCell.displayName = 'TableCell';

// ==========================================================================
// TABLE CAPTION
// ==========================================================================

export const TableCaption = React.forwardRef<HTMLTableCaptionElement, TableCaptionProps>(
    ({ className = '', ...props }, ref) => {
        const classes = ['table__caption', className].filter(Boolean).join(' ');

        return <caption ref={ref} className={classes} {...props} />;
    }
);
TableCaption.displayName = 'TableCaption';

// ==========================================================================
// TABLE EMPTY STATE
// ==========================================================================

export const TableEmpty = React.forwardRef<HTMLDivElement, TableEmptyProps>(
    ({ className = '', icon, title, description, children, ...props }, ref) => {
        const classes = ['table-empty', className].filter(Boolean).join(' ');

        if (children) {
            return (
                <div ref={ref} className={classes} {...props}>
                    {children}
                </div>
            );
        }

        return (
            <div ref={ref} className={classes} {...props}>
                {icon && <div className="table-empty__icon">{icon}</div>}
                {title && <h3 className="table-empty__title">{title}</h3>}
                {description && <p className="table-empty__description">{description}</p>}
            </div>
        );
    }
);
TableEmpty.displayName = 'TableEmpty';

// ==========================================================================
// TABLE PAGINATION
// ==========================================================================

export const TablePagination = React.forwardRef<HTMLDivElement, TablePaginationProps>(
    ({
        className = '',
        currentPage,
        totalPages,
        totalItems,
        pageSize,
        onPageChange,
        showInfo = true,
        ...props
    }, ref) => {
        const classes = ['table-pagination', className].filter(Boolean).join(' ');

        const startItem = totalItems ? (currentPage - 1) * (pageSize || 10) + 1 : 0;
        const endItem = totalItems
            ? Math.min(currentPage * (pageSize || 10), totalItems)
            : 0;

        const pages = React.useMemo(() => {
            const items: (number | 'ellipsis')[] = [];
            const maxVisible = 5;

            if (totalPages <= maxVisible) {
                for (let i = 1; i <= totalPages; i++) items.push(i);
            } else {
                items.push(1);

                if (currentPage > 3) items.push('ellipsis');

                const start = Math.max(2, currentPage - 1);
                const end = Math.min(totalPages - 1, currentPage + 1);

                for (let i = start; i <= end; i++) items.push(i);

                if (currentPage < totalPages - 2) items.push('ellipsis');

                items.push(totalPages);
            }

            return items;
        }, [currentPage, totalPages]);

        return (
            <div ref={ref} className={classes} {...props}>
                {showInfo && totalItems !== undefined && (
                    <span className="table-pagination__info">
                        Showing {startItem}–{endItem} of {totalItems}
                    </span>
                )}

                <div className="table-pagination__controls">
                    <button
                        type="button"
                        className="table-pagination__btn"
                        onClick={() => onPageChange(1)}
                        disabled={currentPage <= 1}
                        aria-label="First page"
                    >
                        <ChevronsLeft />
                    </button>

                    <button
                        type="button"
                        className="table-pagination__btn"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                        aria-label="Previous page"
                    >
                        <ChevronLeft />
                    </button>

                    <div className="table-pagination__pages">
                        {pages.map((page, i) =>
                            page === 'ellipsis' ? (
                                <span key={`ellipsis-${i}`} className="table-pagination__ellipsis">
                                    &hellip;
                                </span>
                            ) : (
                                <button
                                    key={page}
                                    type="button"
                                    className={[
                                        'table-pagination__page',
                                        page === currentPage && 'is-active',
                                    ].filter(Boolean).join(' ')}
                                    onClick={() => onPageChange(page)}
                                    aria-current={page === currentPage ? 'page' : undefined}
                                >
                                    {page}
                                </button>
                            )
                        )}
                    </div>

                    <button
                        type="button"
                        className="table-pagination__btn"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        aria-label="Next page"
                    >
                        <ChevronRight />
                    </button>

                    <button
                        type="button"
                        className="table-pagination__btn"
                        onClick={() => onPageChange(totalPages)}
                        disabled={currentPage >= totalPages}
                        aria-label="Last page"
                    >
                        <ChevronsRight />
                    </button>
                </div>
            </div>
        );
    }
);
TablePagination.displayName = 'TablePagination';

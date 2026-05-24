'use client';

import { memo } from 'react';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import {
    toggleSidebar,
    closeAllViews,
    selectSidebarCollapsed,
    selectHasView,
} from '@/src/store/slices/layoutSlice';
import { Icon } from '@/src/components/shared/ui';

interface SidebarToggleProps {
    className?: string;
    hasActions?: boolean;
}

function SidebarToggleComponent({ className = '', hasActions = false }: SidebarToggleProps) {
    const dispatch = useAppDispatch();
    const isCollapsed = useAppSelector(selectSidebarCollapsed);
    const hasView = useAppSelector(selectHasView);

    const handleClick = () => {
        if (hasView) {
            dispatch(closeAllViews());
        } else {
            dispatch(toggleSidebar());
        }
    };

    const ariaLabel = hasView
        ? 'Close view'
        : (isCollapsed ? 'Expand sidebar' : 'Collapse sidebar');

    const toggleClasses = [
        'sidebar-toggle',
        hasView ? 'sidebar-toggle--close' : '',
        isCollapsed ? 'sidebar-toggle--collapsed' : '',
        hasActions ? 'sidebar-toggle--has-actions' : 'sidebar-toggle--no-actions',
        className,
    ].filter(Boolean).join(' ');

    return (
        <button
            type="button"
            className={toggleClasses}
            onClick={handleClick}
            aria-label={ariaLabel}
            aria-expanded={!isCollapsed}
        >
            <Icon
                dynamicIcon={{
                    conditions: [
                        { when: hasView, icon: 'close' },
                        { when: isCollapsed, icon: 'fold-vertical' }
                    ],
                    fallback: 'fold-horizontal',
                }}
                size={16}
                className="sidebar-toggle__icon"
            />
        </button>
    );
}

export const SidebarToggle = memo(SidebarToggleComponent);



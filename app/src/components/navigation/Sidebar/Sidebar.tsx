'use client';

import { memo, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import {
    selectSidebarCollapsed,
    selectSidebarVisible,
    selectHasView,
    toggleSidebar,
    closeAllViews,
    setSidebarView,
} from '@/src/store/slices/layoutSlice';
import { getConfigForPath } from '@/src/config/pageActions.config';
import { SidebarToggle } from './SidebarToggle';
import { SidebarActions } from './SidebarActions';
import { SidebarNav } from './SidebarNav';
import { SidebarView } from './SidebarView';
import { SidebarUserProfile } from './SidebarUserProfile';

function SidebarComponent() {
    const dispatch = useAppDispatch();
    const pathname = usePathname();
    const isCollapsed = useAppSelector(selectSidebarCollapsed);
    const isVisible = useAppSelector(selectSidebarVisible);
    const hasView = useAppSelector(selectHasView);
    const pageConfig = getConfigForPath(pathname);
    const hasActions = Boolean(pageConfig?.actions?.length || pageConfig?.dynamicActions);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                dispatch(toggleSidebar());
            }
            if (e.key === 'Escape' && hasView) {
                e.preventDefault();
                dispatch(closeAllViews());
            }
        },
        [dispatch, hasView]
    );

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const handleOpenSettings = () => {
        dispatch(setSidebarView({ view: 'settings', width: 'md' }));
    };

    const sidebarClasses = [
        'sidebar',
        isCollapsed && !hasView ? 'is-collapsed' : '',
        !isVisible ? 'is-hidden' : '',
        hasView ? 'has-view' : '',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <aside className={sidebarClasses} role="navigation" aria-label="Main sidebar">
            <div className={isCollapsed ? 'sidebar__header sidebar__header--collapsed' : 'sidebar__header'}>
                <SidebarToggle hasActions={hasActions} />
                <SidebarActions />
            </div>
            <div className="sidebar__wrapper">
                <div className="sidebar__content">
                    <AnimatePresence mode="wait">
                        {hasView ? (
                            <SidebarView key="view" />
                        ) : (
                            <SidebarNav key="nav" />
                        )}
                    </AnimatePresence>
                </div>

                {!hasView && (
                    <div className="sidebar__footer">
                        <SidebarUserProfile />
                    </div>
                )}
            </div>
        </aside>
    );
}

export const Sidebar = memo(SidebarComponent);


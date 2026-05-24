'use client';

import { memo, useMemo, useCallback, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import {
    selectSidebarCollapsed,
    selectSidebarVisible,
    selectHasView,
    toggleSidebar,
    closeAllViews,
} from '@/src/store/slices/layoutSlice';
import { SidebarToggle, SidebarItem } from '@/src/components/navigation';
import { createPortalNavigation } from '@/src/config/portal-navigation.config';
import '@/src/styles/layout/_sidebar.scss';

interface PortalSidebarProps {
    clientSlug: string;
}

function PortalSidebarComponent({ clientSlug }: PortalSidebarProps) {
    const dispatch = useAppDispatch();
    const isCollapsed = useAppSelector(selectSidebarCollapsed);
    const isVisible = useAppSelector(selectSidebarVisible);
    const hasView = useAppSelector(selectHasView);

    const navigation = useMemo(
        () => createPortalNavigation(clientSlug),
        [clientSlug]
    );

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

    const sidebarClasses = [
        'sidebar',
        isCollapsed && !hasView ? 'is-collapsed' : '',
        !isVisible ? 'is-hidden' : '',
        hasView ? 'has-view' : '',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <aside className={sidebarClasses} role="navigation" aria-label="Portal sidebar">
            <div className="sidebar__header">
                <SidebarToggle />
            </div>
            <div className="sidebar__wrapper">
                <div className="sidebar__content">
                    <nav className="sidebar-nav" aria-label="Portal navigation">
                        {navigation.map((section, sectionIndex) => (
                            <div key={sectionIndex} className="sidebar-nav__section">
                                {section.title && !isCollapsed && (
                                    <h3 className="sidebar-nav__section-title">
                                        {section.title}
                                    </h3>
                                )}
                                <ul className="sidebar-nav__list">
                                    {section.links.map((link) => (
                                        <li key={link.label}>
                                            <SidebarItem link={link} />
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </nav>
                </div>
            </div>
        </aside>
    );
}

export const PortalSidebar = memo(PortalSidebarComponent);

'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import {
    selectSidebarVisible,
    selectTopbarVisible,
    selectSidebarView,
    selectIsMobile,
    setSidebarVisible,
    setTopbarVisible,
} from '@/src/store/slices/layoutSlice';
import { AUTO_HIDE_CONFIG } from '@/src/config/layout';

/**
 * Hook that manages auto-hide behavior for sidebar and topbar.
 * Shows elements when mouse is near edges, hides after inactivity.
 */
export function useAutoHide() {
    const dispatch = useAppDispatch();
    const isSidebarVisible = useAppSelector(selectSidebarVisible);
    const isTopbarVisible = useAppSelector(selectTopbarVisible);
    const sidebarView = useAppSelector(selectSidebarView);
    const isMobile = useAppSelector(selectIsMobile);

    const sidebarTimerRef = useRef<NodeJS.Timeout | null>(null);
    const topbarTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastMoveRef = useRef<number>(0);

    // Clear timers on unmount
    useEffect(() => {
        return () => {
            if (sidebarTimerRef.current) clearTimeout(sidebarTimerRef.current);
            if (topbarTimerRef.current) clearTimeout(topbarTimerRef.current);
        };
    }, []);

    // Keep sidebar visible when a view is open
    useEffect(() => {
        if (sidebarView) {
            dispatch(setSidebarVisible(true));
            if (sidebarTimerRef.current) {
                clearTimeout(sidebarTimerRef.current);
                sidebarTimerRef.current = null;
            }
        }
    }, [sidebarView, dispatch]);

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            // Throttle
            const now = Date.now();
            if (now - lastMoveRef.current < AUTO_HIDE_CONFIG.THROTTLE) return;
            lastMoveRef.current = now;

            const { clientX, clientY } = e;
            const isInTopZone = clientY <= AUTO_HIDE_CONFIG.EDGE_ZONE.TOP;

            // Check if mouse is over sidebar (use the actual sidebar element)
            const sidebarEl = document.querySelector('.sidebar');
            const isOverSidebar = sidebarEl
                ? clientX <= sidebarEl.getBoundingClientRect().right
                : clientX <= AUTO_HIDE_CONFIG.EDGE_ZONE.LEFT;

            // Skip on mobile
            if (isMobile) return;

            // Sidebar visibility logic
            if (sidebarView) {
                dispatch(setSidebarVisible(true));
            } else {
                if (isOverSidebar) {
                    // Clear hide timer when over sidebar
                    if (sidebarTimerRef.current) {
                        clearTimeout(sidebarTimerRef.current);
                        sidebarTimerRef.current = null;
                    }
                    // Show sidebar
                    if (!isSidebarVisible) {
                        dispatch(setSidebarVisible(true));
                    }
                } else if (isSidebarVisible) {
                    // Start hide timer when mouse leaves sidebar area
                    if (!sidebarTimerRef.current) {
                        sidebarTimerRef.current = setTimeout(() => {
                            dispatch(setSidebarVisible(false));
                            sidebarTimerRef.current = null;
                        }, AUTO_HIDE_CONFIG.DELAY);
                    }
                }
            }

            // Topbar visibility logic
            if (isInTopZone) {
                if (topbarTimerRef.current) {
                    clearTimeout(topbarTimerRef.current);
                    topbarTimerRef.current = null;
                }
                if (!isTopbarVisible) {
                    dispatch(setTopbarVisible(true));
                }
            } else if (isTopbarVisible) {
                if (!topbarTimerRef.current) {
                    topbarTimerRef.current = setTimeout(() => {
                        dispatch(setTopbarVisible(false));
                        topbarTimerRef.current = null;
                    }, AUTO_HIDE_CONFIG.DELAY);
                }
            }
        },
        [dispatch, isSidebarVisible, isTopbarVisible, sidebarView, isMobile]
    );

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [handleMouseMove]);

    return {
        isSidebarVisible,
        isTopbarVisible,
    };
}

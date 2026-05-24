'use client';

import { memo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import {
    closeAllViews,
    popView,
    selectCurrentView,
    selectCanGoBack,
    selectTransitionDirection,
} from '@/src/store/slices/layoutSlice';
import { getViewConfig, getViewWidth } from '@/src/config/sidebarViews.config';

const springConfig = {
    type: 'spring' as const,
    stiffness: 350,
    damping: 35,
    mass: 0.8,
};

const slideVariants = {
    enter: (direction: 'forward' | 'back') => ({
        x: direction === 'forward' ? 40 : -40,
        opacity: 0,
    }),
    center: {
        x: 0,
        opacity: 1,
    },
    exit: (direction: 'forward' | 'back') => ({
        x: direction === 'forward' ? -40 : 40,
        opacity: 0,
    }),
};

function ViewLoader() {
    return (
        <div className="sidebar-view__loader">
            <div className="sidebar-view__spinner" />
        </div>
    );
}

function SidebarViewComponent() {
    const dispatch = useAppDispatch();
    const currentView = useAppSelector(selectCurrentView);
    const canGoBack = useAppSelector(selectCanGoBack);
    const direction = useAppSelector(selectTransitionDirection);

    if (!currentView) return null;

    const viewConfig = getViewConfig(currentView.view);
    const ViewComponent = viewConfig?.component;
    const title = viewConfig?.title ?? currentView.view;
    const width = getViewWidth(currentView.width ?? viewConfig?.width ?? 'md');

    const handleClose = () => {
        dispatch(closeAllViews());
    };

    const handleBack = () => {
        dispatch(popView());
    };

    return (
        <motion.div
            className="sidebar-view"
            style={{ minWidth: width }}
            initial={false}
            animate={{ width }}
            transition={springConfig}
        >
            <div className="sidebar-view__header">
                <div className="sidebar-view__header-left">
                    {canGoBack && (
                        <button
                            onClick={handleBack}
                            aria-label="Go back"
                            className="sidebar-view__back"
                        >
                            <ArrowLeft size={18} />
                        </button>
                    )}
                    <h4 className="sidebar-view__title">{title}</h4>
                </div>
            </div>

            <div className="sidebar-view__body">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={currentView.view}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={springConfig}
                        className="sidebar-view__content"
                    >
                        <Suspense fallback={<ViewLoader />}>
                            {ViewComponent && <ViewComponent />}
                        </Suspense>
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

export const SidebarView = memo(SidebarViewComponent);


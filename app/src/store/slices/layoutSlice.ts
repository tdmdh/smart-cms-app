import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ViewWidth } from '@/src/config/sidebarViews.config';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

interface ViewStackItem {
    view: string;
    data?: unknown;
    width?: ViewWidth;
}

interface LayoutState {
    // Sidebar state
    isSidebarCollapsed: boolean;
    isMobile: boolean;

    // View stack for navigation
    viewStack: ViewStackItem[];
    transitionDirection: 'forward' | 'back';

    // Auto-hide visibility
    isSidebarVisible: boolean;
    isTopbarVisible: boolean;

    // Modal
    openModal: string | null;

    // Cognitive Load — Deep Work Protection flag
    deepWorkProtection: boolean;
}

// --------------------------------------------------------------------------
// Initial State
// --------------------------------------------------------------------------

const initialState: LayoutState = {
    isSidebarCollapsed: false,
    isMobile: false,
    viewStack: [],
    transitionDirection: 'forward',
    isSidebarVisible: true,
    isTopbarVisible: true,
    openModal: null,
    deepWorkProtection: false,
};

// --------------------------------------------------------------------------
// Slice
// --------------------------------------------------------------------------

const layoutSlice = createSlice({
    name: 'layout',
    initialState,
    reducers: {
        // Sidebar collapse
        toggleSidebar: (state) => {
            state.isSidebarCollapsed = !state.isSidebarCollapsed;
        },
        setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
            state.isSidebarCollapsed = action.payload;
        },

        // Mobile detection
        setMobile: (state, action: PayloadAction<boolean>) => {
            state.isMobile = action.payload;
            // Auto-collapse on mobile
            if (action.payload && !state.isSidebarCollapsed) {
                state.isSidebarCollapsed = true;
            }
        },

        // View stack management
        pushView: (state, action: PayloadAction<ViewStackItem>) => {
            state.transitionDirection = 'forward';
            state.viewStack.push(action.payload);
            // Expand sidebar when opening a view
            if (state.isSidebarCollapsed) {
                state.isSidebarCollapsed = false;
            }
        },
        popView: (state) => {
            if (state.viewStack.length > 0) {
                state.transitionDirection = 'back';
                state.viewStack.pop();
            }
        },
        closeAllViews: (state) => {
            state.transitionDirection = 'back';
            state.viewStack = [];
        },
        replaceView: (state, action: PayloadAction<ViewStackItem>) => {
            state.transitionDirection = 'forward';
            if (state.viewStack.length > 0) {
                state.viewStack[state.viewStack.length - 1] = action.payload;
            } else {
                state.viewStack.push(action.payload);
            }
        },

        setSidebarView: (state, action: PayloadAction<{ view: string; data?: unknown; width?: ViewWidth }>) => {
            state.transitionDirection = 'forward';
            state.viewStack = [{
                view: action.payload.view,
                data: action.payload.data,
                width: action.payload.width,
            }];
            if (state.isSidebarCollapsed) {
                state.isSidebarCollapsed = false;
            }
        },
        closeSidebarView: (state) => {
            state.transitionDirection = 'back';
            state.viewStack = [];
        },

        // Modal
        openModal: (state, action: PayloadAction<string>) => {
            state.openModal = action.payload;
        },
        closeModal: (state) => {
            state.openModal = null;
        },

        // Auto-hide visibility
        setSidebarVisible: (state, action: PayloadAction<boolean>) => {
            state.isSidebarVisible = action.payload;
        },
        setTopbarVisible: (state, action: PayloadAction<boolean>) => {
            state.isTopbarVisible = action.payload;
        },

        // Cognitive Load — Deep Work Protection
        setDeepWorkProtection: (state, action: PayloadAction<boolean>) => {
            state.deepWorkProtection = action.payload;
        },
    },
});

// --------------------------------------------------------------------------
// Exports
// --------------------------------------------------------------------------

export const {
    toggleSidebar,
    setSidebarCollapsed,
    setMobile,
    pushView,
    popView,
    closeAllViews,
    replaceView,
    setSidebarView,
    closeSidebarView,
    setSidebarVisible,
    setTopbarVisible,
    openModal,
    closeModal,
    setDeepWorkProtection,
} = layoutSlice.actions;

export default layoutSlice.reducer;

// --------------------------------------------------------------------------
// Selectors
// --------------------------------------------------------------------------

type RootState = { layout: LayoutState };

export const selectSidebarCollapsed = (state: RootState) => state.layout.isSidebarCollapsed;
export const selectIsMobile = (state: RootState) => state.layout.isMobile;
export const selectSidebarVisible = (state: RootState) => state.layout.isSidebarVisible;
export const selectTopbarVisible = (state: RootState) => state.layout.isTopbarVisible;

export const selectViewStack = (state: RootState) => state.layout.viewStack;
export const selectCurrentView = (state: RootState) => {
    const stack = state.layout?.viewStack || [];
    return stack.length > 0 ? stack[stack.length - 1] : null;
};
export const selectSidebarView = (state: RootState) => {
    const current = selectCurrentView(state);
    return current?.view ?? null;
};
export const selectSidebarViewData = (state: RootState) => {
    const current = selectCurrentView(state);
    return current?.data ?? null;
};
export const selectCurrentViewWidth = (state: RootState) => {
    const current = selectCurrentView(state);
    return current?.width;
};
export const selectCanGoBack = (state: RootState) => state.layout.viewStack.length > 1;
export const selectHasView = (state: RootState) => state.layout.viewStack.length > 0;
export const selectTransitionDirection = (state: RootState) => state.layout.transitionDirection;
export const selectOpenModal = (state: RootState) => state.layout.openModal;
export const selectDeepWorkProtection = (state: RootState) => state.layout.deepWorkProtection;


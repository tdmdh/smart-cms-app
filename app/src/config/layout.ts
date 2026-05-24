// ==========================================================================
// LAYOUT CONFIGURATION
// ==========================================================================
// Centralized layout constants for animations and breakpoints.
// Sidebar uses fit-content sizing, no fixed widths needed.
// ==========================================================================

export const SIDEBAR_CONFIG = {
    ANIMATION: {
        DURATION: 0.3,
        EASING: [0.4, 0, 0.2, 1] as const,
        CSS_EASING: 'cubic-bezier(0.4, 0, 0.2, 1)',
        LABEL_DELAY: 200, // ms delay before showing labels
        LABEL_DURATION: 0.15,
    },
} as const;

export const HEADER_CONFIG = {
    HEIGHT: 60,
} as const;

export const BREAKPOINTS = {
    MOBILE: 1024,
    SMALL_MOBILE: 640,
} as const;

export const AUTO_HIDE_CONFIG = {
    EDGE_ZONE: {
        LEFT: 50,
        TOP: 50,
    },
    DELAY: 5000, // 5 seconds
    PEEK_DELAY: 50,
    THROTTLE: 100, // ms
} as const;

export type SidebarConfig = typeof SIDEBAR_CONFIG;
export type BreakpointsConfig = typeof BREAKPOINTS;


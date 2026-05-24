/**
 * Utility to reliably get the current workspace ID for API requests.
 * Prioritizes the URL (standard in App Router) before falling back to localStorage.
 */
export function getActiveWorkspaceId(): string | null {
    if (typeof window === 'undefined') {
        return null;
    }

    // 1. Try URL first (The source of truth for current context)
    // Format: /dashboard/[workspaceId]/...
    const pathParts = window.location.pathname.split('/');
    const dashboardIdx = pathParts.indexOf('dashboard');
    if (dashboardIdx !== -1 && pathParts[dashboardIdx + 1]) {
        const idFromUrl = pathParts[dashboardIdx + 1];
        // Ignore static path segments that aren't workspace IDs
        if (idFromUrl && idFromUrl !== 'pages' && idFromUrl !== 'settings' && idFromUrl !== 'clients' && idFromUrl !== 'projects' && idFromUrl !== 'tasks') {
            return idFromUrl;
        }
    }

    // 2. Try localStorage (Redux Persist fallback)
    try {
        const persistedRoot = window.localStorage.getItem('persist:root');
        if (persistedRoot) {
            const root = JSON.parse(persistedRoot) as Record<string, string>;
            if (root.workspace) {
                const workspaceState = JSON.parse(root.workspace) as { currentWorkspaceId?: string | null };
                return workspaceState.currentWorkspaceId ?? null;
            }
        }
    } catch {}

    return null;
}

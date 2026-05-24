
export const routes = {
    public: [
        '/home',
        '/about',
        '/pricing',
        '/contact',
        '/verify-email',
    ],
    auth: [
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
    ],
    protected: [
        '/dashboard',
        '/settings',
        '/projects',
        '/profile',
        '/onboarding',
    ],
    api: ['/api'],
    static: ['/_next', '/favicon.ico'],
    afterLogin: '/dashboard',
    afterRegister: '/verify-email',
    afterVerification: '/onboarding',
    afterLogout: '/login',
} as const;


export function matchesRoutes(pathname: string, routePatterns: readonly string[]): boolean {
    return routePatterns.some(pattern => {
        if (pathname === pattern) return true;
        if (pathname.startsWith(pattern + '/')) return true;
        return false;
    });
}

export function isApiRoute(pathname: string): boolean {
    return pathname.startsWith('/api');
}

export function isStaticAsset(pathname: string): boolean {
    return (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$/i.test(pathname)
    );
}

export type Routes = typeof routes;

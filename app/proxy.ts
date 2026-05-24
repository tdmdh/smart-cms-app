import { NextRequest, NextResponse } from 'next/server';
import {
    routes,
    matchesRoutes,
    isApiRoute,
    isStaticAsset,
} from '@/src/config/proxy.config';

export default function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (isStaticAsset(pathname)) {
        return NextResponse.next();
    }

    if (isApiRoute(pathname)) {
        return NextResponse.next();
    }

    const accessToken = request.cookies.get('access_token');
    const refreshToken = request.cookies.get('refresh_token');
    const isAuthenticated = !!accessToken?.value || !!refreshToken?.value;

    if (isAuthenticated && matchesRoutes(pathname, routes.auth)) {
        const url = request.nextUrl.clone();
        url.pathname = routes.afterLogin;
        return NextResponse.redirect(url);
    }

    if (!isAuthenticated && matchesRoutes(pathname, routes.protected)) {
        const url = request.nextUrl.clone();
        url.pathname = routes.afterLogout;

        if (pathname !== routes.afterLogin) {
            url.searchParams.set('returnTo', pathname);
        }

        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)',
    ],
};


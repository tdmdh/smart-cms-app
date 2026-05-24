/**
 * HTTP-only cookie helpers for auth tokens used by the Next.js route handlers.
 *
 * - setAuthCookies  — writes access_token (15 min) and refresh_token (7 days)
 *                     as httpOnly, secure, SameSite=Lax cookies on a NextResponse
 * - clearAuthCookies — expires both cookies immediately (used on logout)
 *
 * The route handlers that called these helpers have been removed after
 * migrating to TanStack Query. This file is kept as reference.
 */

import { NextResponse } from "next/server";

const COOKIE_CONFIG = {
    accessToken: {
        name: "access_token",
        maxAge: 60 * 15,
    },
    refreshToken: {
        name: "refresh_token",
        maxAge: 60 * 60 * 24 * 7,
    },
} as const;

const getCookieOptions = (maxAge: number) => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge,
    path: "/",
});

interface AuthTokens {
    access_token?: string;
    refresh_token?: string;
}

export function setAuthCookies(response: NextResponse, tokens: AuthTokens): void {
    if (tokens.access_token) {
        response.cookies.set(
            COOKIE_CONFIG.accessToken.name,
            tokens.access_token,
            getCookieOptions(COOKIE_CONFIG.accessToken.maxAge)
        );
    }

    if (tokens.refresh_token) {
        response.cookies.set(
            COOKIE_CONFIG.refreshToken.name,
            tokens.refresh_token,
            getCookieOptions(COOKIE_CONFIG.refreshToken.maxAge)
        );
    }
}

export function clearAuthCookies(response: NextResponse): void {
    response.cookies.set(COOKIE_CONFIG.accessToken.name, "", {
        ...getCookieOptions(0),
        maxAge: 0,
    });
    response.cookies.set(COOKIE_CONFIG.refreshToken.name, "", {
        ...getCookieOptions(0),
        maxAge: 0,
    });
}

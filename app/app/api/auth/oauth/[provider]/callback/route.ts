import { NextRequest, NextResponse } from "next/server";
import { auth, LoginResponse } from "@/src/api/auth/config";
import { client } from "@/src/api/client";
import { setAuthCookies } from "@/src/api/cookies";
import { routes } from "@/src/config/proxy.config";

interface RouteParams {
    params: Promise<{ provider: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { provider } = await params;
        const url = new URL(request.url);

        if (!provider) {
            return NextResponse.redirect(new URL(routes.afterLogout, url.origin));
        }

        // Forward query params (code, state, etc.) to the backend
        const endpoint = auth.oauth.finish(provider);
        const queryString = url.search;

        const result = await client.request<void, LoginResponse>(
            { ...endpoint, endpoint: `${endpoint.endpoint}${queryString}` },
            {}
        );

        if (!result.success || !result.data) {
            console.error("OAuth callback failed:", result.error);
            return NextResponse.redirect(new URL(routes.afterLogout, url.origin));
        }

        const data = result.data;

        const response = NextResponse.redirect(new URL(routes.afterRegister, url.origin));

        setAuthCookies(response, {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
        });

        return response;
    } catch (error) {
        console.error("OAuth callback error:", error);
        const url = new URL(request.url);
        return NextResponse.redirect(new URL(routes.afterLogout, url.origin));
    }
}

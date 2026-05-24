import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/api/auth/config";
import { client } from "@/src/api/client";
import { routes } from "@/src/config/proxy.config";

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const token = url.searchParams.get("token");

        if (!token) {
            return NextResponse.redirect(
                new URL(`${routes.afterLogout}?error=invalid_token`, url.origin)
            );
        }

        const endpoint = auth.emailVerification.finish();
        const result = await client.request(
            { ...endpoint, endpoint: `${endpoint.endpoint}?token=${token}` },
            {}
        );

        if (!result.success) {
            return NextResponse.redirect(
                new URL(`${routes.afterLogout}?error=verification_failed`, url.origin)
            );
        }

        return NextResponse.redirect(
            new URL(`${routes.afterLogin}?verified=true`, url.origin)
        );
    } catch (error) {
        console.error("Email verification error:", error);
        const url = new URL(request.url);
        return NextResponse.redirect(
            new URL(`${routes.afterLogout}?error=internal_error`, url.origin)
        );
    }
}

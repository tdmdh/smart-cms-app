import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/api/auth/config";
import { client } from "@/src/api/client";
import { setAuthCookies } from "@/src/api/cookies";
import type { ErrorResponse } from "@/src/api/responses";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const refreshToken = cookieStore.get("refresh_token");

        if (!refreshToken?.value) {
            return NextResponse.json<ErrorResponse>(
                { error: "No refresh token" },
                { status: 401 }
            );
        }

        const result = await client.request(auth.user.refresh(), {
            body: { refresh_token: refreshToken.value },
        });

        if (!result.success || !result.data) {
            return NextResponse.json<ErrorResponse>(
                { error: result.error || "Token refresh failed" },
                { status: result.status ?? 500 }
            );
        }

        const data = result.data;

        const response = NextResponse.json(
            { message: "Token refreshed successfully" },
            { status: 200 }
        );

        setAuthCookies(response, {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
        });

        return response;
    } catch (error) {
        console.error("Token refresh error:", error);
        return NextResponse.json<ErrorResponse>(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

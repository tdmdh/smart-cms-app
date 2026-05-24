import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/api/auth/config";
import { client } from "@/src/api/client";
import type { ErrorResponse } from "@/src/api/responses";
import { clearAuthCookies } from "@/src/api/cookies";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const refreshToken = cookieStore.get("refresh_token");

        if (refreshToken?.value) {
            await client.request(auth.user.logout(), {
                body: { refresh_token: refreshToken.value },
                cookies: cookieStore,
            });
        }

        const response = NextResponse.json(
            { message: "Logged out successfully" },
            { status: 200 }
        );

        clearAuthCookies(response);

        return response;
    } catch (error) {
        console.error("Logout error:", error);

        const response = NextResponse.json<ErrorResponse>(
            { error: "Logout failed, but session cleared" },
            { status: 200 }
        );

        clearAuthCookies(response);

        return response;
    }
}

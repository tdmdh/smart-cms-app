import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/api/auth/config";
import { client } from "@/src/api/client";
import type { ErrorResponse } from "@/src/api/responses";
import { setAuthCookies } from "@/src/api/cookies";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        let accessToken = cookieStore.get("access_token");
        const refreshToken = cookieStore.get("refresh_token");

        // Debug: Log cookie status
        // console.log("[/api/auth/me] Cookie check:", {
        //     hasAccessToken: !!accessToken?.value,
        //     hasRefreshToken: !!refreshToken?.value,
        //     accessTokenLength: accessToken?.value?.length ?? 0,
        //     refreshTokenLength: refreshToken?.value?.length ?? 0,
        // });

        if (!accessToken?.value && refreshToken?.value) {
            const refreshResult = await client.request(auth.user.refresh(), {
                body: { refresh_token: refreshToken.value },
            });

            if (refreshResult.success && refreshResult.data) {
                const result = await client.request(auth.user.profile(), {
                    cookies: cookieStore,
                    headers: {
                        'Authorization': `Bearer ${refreshResult.data.access_token}`,
                    },
                });

                if (!result.success || !result.data) {
                    return NextResponse.json<ErrorResponse>(
                        { error: result.error || "Failed to fetch profile" },
                        { status: result.status ?? 500 }
                    );
                }

                const response = NextResponse.json(
                    { user: result.data.user },
                    { status: 200 }
                );

                setAuthCookies(response, {
                    access_token: refreshResult.data.access_token,
                    refresh_token: refreshResult.data.refresh_token,
                });

                return response;
            } else {
                return NextResponse.json<ErrorResponse>(
                    { error: "Session expired, please login again" },
                    { status: 401 }
                );
            }
        }

        if (!accessToken?.value) {
            return NextResponse.json<ErrorResponse>(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        const result = await client.request(auth.user.profile(), {
            cookies: cookieStore,
        });

        if (!result.success || !result.data) {
            return NextResponse.json<ErrorResponse>(
                { error: result.error || "Failed to fetch profile" },
                { status: result.status ?? 500 }
            );
        }

        return NextResponse.json(
            { user: result.data.user },
            { status: 200 }
        );
    } catch (error) {
        console.error("Profile fetch error:", error);
        return NextResponse.json<ErrorResponse>(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}


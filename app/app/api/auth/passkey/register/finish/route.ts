import { NextRequest, NextResponse } from "next/server";
import { auth, FinishPasskeyRegRequest } from "@/src/api/auth/config";
import { client } from "@/src/api/client";
import { setAuthCookies } from "@/src/api/cookies";
import type { ErrorResponse } from "@/src/api/responses";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get("access_token");

        if (!accessToken?.value) {
            return NextResponse.json<ErrorResponse>(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        const body = (await request.json()) as FinishPasskeyRegRequest;

        const result = await client.request(auth.passkey.register.finish(), {
            body,
            cookies: cookieStore,
        });

        if (!result.success || !result.data) {
            return NextResponse.json<ErrorResponse>(
                { error: result.error || "Passkey registration failed" },
                { status: result.status ?? 500 }
            );
        }

        const data = result.data;

        const response = NextResponse.json(
            { user: data.user },
            { status: 201 }
        );

        setAuthCookies(response, {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
        });

        return response;
    } catch (error) {
        console.error("Passkey register finish error:", error);
        return NextResponse.json<ErrorResponse>(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

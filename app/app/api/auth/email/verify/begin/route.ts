import { NextRequest, NextResponse } from "next/server";
import { auth, BeginEmailVerificationRequest } from "@/src/api/auth/config";
import { client } from "@/src/api/client";
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

        const body = (await request.json()) as BeginEmailVerificationRequest;

        const result = await client.request(auth.emailVerification.begin(), {
            body,
            cookies: cookieStore,
        });

        if (!result.success || !result.data) {
            return NextResponse.json<ErrorResponse>(
                { error: result.error || "Failed to send verification email" },
                { status: result.status ?? 500 }
            );
        }

        return NextResponse.json(result.data, { status: 200 });
    } catch (error) {
        console.error("Email verification begin error:", error);
        return NextResponse.json<ErrorResponse>(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

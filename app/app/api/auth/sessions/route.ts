import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/api/auth/config";
import { client } from "@/src/api/client";
import type { ErrorResponse } from "@/src/api/responses";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get("access_token");

        if (!accessToken?.value) {
            return NextResponse.json<ErrorResponse>(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        const result = await client.request(auth.user.sessions(), {
            cookies: cookieStore,
        });

        if (!result.success || !result.data) {
            return NextResponse.json<ErrorResponse>(
                { error: result.error || "Failed to fetch sessions" },
                { status: result.status ?? 500 }
            );
        }

        return NextResponse.json(
            { sessions: result.data.sessions },
            { status: 200 }
        );
    } catch (error) {
        console.error("Sessions fetch error:", error);
        return NextResponse.json<ErrorResponse>(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

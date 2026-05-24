import { NextRequest, NextResponse } from "next/server";
import { auth, BeginPasskeyRequest } from "@/src/api/auth/config";
import { client } from "@/src/api/client";
import type { ErrorResponse } from "@/src/api/responses";

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as BeginPasskeyRequest;

        const result = await client.request(auth.passkey.login.begin(), { body });

        if (!result.success || !result.data) {
            return NextResponse.json<ErrorResponse>(
                { error: result.error || "Failed to begin passkey login" },
                { status: result.status ?? 500 }
            );
        }

        return NextResponse.json(result.data, { status: 200 });
    } catch (error) {
        console.error("Passkey login begin error:", error);
        return NextResponse.json<ErrorResponse>(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

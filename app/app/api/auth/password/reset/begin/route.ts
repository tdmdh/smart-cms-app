import { NextRequest, NextResponse } from "next/server";
import { auth, BeginPasswordResetRequest } from "@/src/api/auth/config";
import { client } from "@/src/api/client";
import type { ErrorResponse } from "@/src/api/responses";

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as BeginPasswordResetRequest;

        if (!body.email) {
            return NextResponse.json<ErrorResponse>(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        const result = await client.request(auth.passwordReset.begin(), { body });

        if (!result.success || !result.data) {
            return NextResponse.json<ErrorResponse>(
                { error: result.error || "Failed to initiate password reset" },
                { status: result.status ?? 500 }
            );
        }

        return NextResponse.json(result.data, { status: 200 });
    } catch (error) {
        console.error("Password reset begin error:", error);
        return NextResponse.json<ErrorResponse>(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

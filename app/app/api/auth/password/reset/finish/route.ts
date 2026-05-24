import { NextRequest, NextResponse } from "next/server";
import { auth, FinishPasswordResetRequest } from "@/src/api/auth/config";
import { client } from "@/src/api/client";
import type { ErrorResponse } from "@/src/api/responses";

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as FinishPasswordResetRequest;

        if (!body.token || !body.new_password) {
            return NextResponse.json<ErrorResponse>(
                { error: "Token and new password are required" },
                { status: 400 }
            );
        }

        const result = await client.request(auth.passwordReset.finish(), { body });

        if (!result.success || !result.data) {
            return NextResponse.json<ErrorResponse>(
                { error: result.error || "Password reset failed" },
                { status: result.status ?? 500 }
            );
        }

        return NextResponse.json(result.data, { status: 200 });
    } catch (error) {
        console.error("Password reset finish error:", error);
        return NextResponse.json<ErrorResponse>(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

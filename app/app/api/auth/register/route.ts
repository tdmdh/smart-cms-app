import { NextRequest, NextResponse } from "next/server";
import { auth, RegisterRequest } from "@/src/api/auth/config";
import { client } from "@/src/api/client";
import { setAuthCookies } from "@/src/api/cookies";
import type { ErrorResponse } from "@/src/api/responses";

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as RegisterRequest;

        if (!body.email || !body.password || !body.name || !body.username) {
            return NextResponse.json<ErrorResponse>(
                { error: "Missing email, password, name or username" },
                { status: 400 }
            );
        }

        const result = await client.request(auth.user.register(), { body });

        if (!result.success || !result.data) {
            return NextResponse.json<ErrorResponse>(
                { error: result.error || "Registration failed" },
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
        console.error("Registration error:", error);
        return NextResponse.json<ErrorResponse>(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

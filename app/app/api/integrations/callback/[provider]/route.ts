import { client } from "@/src/api/client";
import { integrations } from "@/src/api/integration/config";
import { ErrorResponse } from "@/src/api/responses";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ provider: string }> }
) {
    try {
        const { provider } = await params;

        const cookieStore = await cookies();
        const accessToken = cookieStore.get("access_token");

        if (!accessToken?.value) {
            return NextResponse.json<ErrorResponse>(
                { error: "Not authorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const state = searchParams.get("state");
        const code = searchParams.get("code");
        const errorParam = searchParams.get("error");

        if (errorParam) {
            return NextResponse.json<ErrorResponse>(
                { error: errorParam },
                { status: 400 }
            );
        }

        if (!state || !code) {
            return NextResponse.json<ErrorResponse>(
                { error: "Missing state or code parameter" },
                { status: 400 }
            );
        }

        const callbackEndpoint = integrations.callback(provider);
        callbackEndpoint.endpoint += `?state=${encodeURIComponent(state)}&code=${encodeURIComponent(code)}`;

        const result = await client.request(callbackEndpoint, {
            cookies: cookieStore,
        });

        if (!result.success || !result.data) {
            return NextResponse.json<ErrorResponse>(
                { error: result.error || "Failed to complete connection" },
                { status: result.status ?? 500 }
            );
        }

        return NextResponse.json(result.data, { status: 200 });
    } catch (error) {
        console.error("Integration callback error:", error);
        return NextResponse.json<ErrorResponse>(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

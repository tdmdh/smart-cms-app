import { client } from "@/src/api/client";
import { integrations, BeginConnectRequest } from "@/src/api/integration/config";
import { ErrorResponse } from "@/src/api/responses";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
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

        const body = (await request.json()) as BeginConnectRequest;

        const result = await client.request(integrations.connect(provider), {
            body,
            cookies: cookieStore,
        });

        if (!result.success || !result.data) {
            return NextResponse.json<ErrorResponse>(
                { error: result.error || "Failed to begin connection" },
                { status: result.status ?? 500 }
            );
        }

        return NextResponse.json(result.data, { status: 200 });
    } catch (error) {
        console.error("Failed to begin integration connect:", error);
        return NextResponse.json<ErrorResponse>(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

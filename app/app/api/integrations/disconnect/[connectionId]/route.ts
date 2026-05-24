import { client } from "@/src/api/client";
import { integrations } from "@/src/api/integration/config";
import { ErrorResponse } from "@/src/api/responses";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ connectionId: string }> }
) {
    try {
        const { connectionId } = await params;
        const cookieStore = await cookies();
        const accessToken = cookieStore.get("access_token");

        if (!accessToken?.value) {
            return NextResponse.json<ErrorResponse>(
                { error: "Not authorized" },
                { status: 401 }
            );
        }

        const result = await client.request(
            integrations.disconnect(connectionId),
            { cookies: cookieStore }
        );

        if (!result.success) {
            return NextResponse.json<ErrorResponse>(
                { error: result.error || "Failed to disconnect" },
                { status: result.status ?? 400 }
            );
        }

        return NextResponse.json(
            { success: true, message: "Disconnected successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Integration disconnect error:", error);
        return NextResponse.json<ErrorResponse>(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

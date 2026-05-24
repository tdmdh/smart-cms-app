import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/api/auth/config";
import { getBackendApiUrl } from "@/src/api/config";
import type { ErrorResponse } from "@/src/api/responses";

interface RouteParams {
    params: Promise<{ provider: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { provider } = await params;

        if (!provider) {
            return NextResponse.json<ErrorResponse>(
                { error: "Provider is required" },
                { status: 400 }
            );
        }

        const endpoint = auth.oauth.begin(provider);
        const backendUrl = `${getBackendApiUrl()}${endpoint.endpoint}`;

        return NextResponse.redirect(backendUrl);
    } catch (error) {
        console.error("OAuth begin error:", error);
        return NextResponse.json<ErrorResponse>(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

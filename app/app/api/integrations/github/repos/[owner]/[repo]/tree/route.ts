import { client } from "@/src/api/client";
import { integrations } from "@/src/api/integration/config";
import { ErrorResponse } from "@/src/api/responses";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ owner: string; repo: string }> }
) {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get("access_token");

        if (!accessToken?.value) {
            return NextResponse.json<ErrorResponse>(
                { error: "Not authorized" },
                { status: 401 }
            );
        }

        const { owner, repo } = await params;
        const ref = request.nextUrl.searchParams.get("ref") || undefined;
        const path = request.nextUrl.searchParams.get("path") || undefined;

        const result = await client.request(
            integrations.githubTree(owner, repo, ref, path),
            { cookies: cookieStore }
        );

        if (!result.success || !result.data) {
            return NextResponse.json<ErrorResponse>(
                { error: result.error || "Failed to list repository tree" },
                { status: result.status ?? 500 }
            );
        }

        return NextResponse.json(result.data, { status: 200 });
    } catch (error) {
        console.error("Failed to list repository tree:", error);
        return NextResponse.json<ErrorResponse>(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

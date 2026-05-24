import { ErrorResponse } from "@/src/api/responses";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

export interface AuthResult {
    authorized: true;
    accessToken: string;
    cookieStore: ReadonlyRequestCookies;
}

export interface AuthError {
    authorized: false;
    response: NextResponse<ErrorResponse>;
}

export type AuthCheck = AuthResult | AuthError;

export async function requireAuth(): Promise<AuthCheck> {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token");

    if (!accessToken?.value) {
        return {
            authorized: false,
            response: NextResponse.json<ErrorResponse>(
                { error: "Not authorized" },
                { status: 401 }
            ),
        };
    }

    return {
        authorized: true,
        accessToken: accessToken.value,
        cookieStore,
    };
}

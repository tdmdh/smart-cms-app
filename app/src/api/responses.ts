/**
 * Shared response types for the API layer.
 *
 * ApiResponse<T> is the uniform envelope returned by ApiClient.request().
 * ErrorResponse and MessageResponse mirror the two most common backend shapes.
 * The type-guard helpers (isErrorResponse, isMessageResponse) were used in
 * route handlers to discriminate union responses before returning to the client.
 *
 * The route handlers have been removed after migrating to TanStack Query.
 * This file is kept as reference.
 */

export type ErrorResponse = { error: string };
export type MessageResponse = { message: string };

export interface ApiResponse<T = unknown> {
    success: boolean;
    status: number;
    data: T | null;
    error: string | null;
}

export function isErrorResponse(response: unknown): response is ErrorResponse {
    return (
        typeof response === "object" &&
        response !== null &&
        "error" in response &&
        typeof (response as ErrorResponse).error === "string"
    );
}

export function isMessageResponse(response: unknown): response is MessageResponse {
    return (
        typeof response === "object" &&
        response !== null &&
        "message" in response &&
        typeof (response as MessageResponse).message === "string"
    );
}

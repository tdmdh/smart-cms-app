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

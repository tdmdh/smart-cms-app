/**
 * Singleton fetch wrapper used by the Next.js route handlers (app/api/).
 *
 * Key behaviours:
 *  - Injects X-Workspace-ID from redux-persist on every request
 *  - On 401, coordinates a single token refresh across concurrent in-flight
 *    requests (queue-based, race-safe) before replaying them
 *  - Exponential back-off retry on 429 / network errors (up to retryCount)
 *  - AbortController-based 90 s timeout per attempt
 *
 * The route handlers that consumed this client have been removed after
 * migrating data-fetching to TanStack Query. This file is kept as reference.
 */

import { Endpoint, getBackendApiUrl } from "./config";
import { ApiResponse } from "./responses";

interface ApiConfig {
    baseUrl: string;
    timeout: number;
    retryCount: number;
}

interface CookieValue {
    value: string;
}

interface CookieStoreLike {
    get(name: string): CookieValue | undefined;
}

interface TokenRefreshSuccess {
    success: true;
    data: {
        access_token: string;
        refresh_token?: string;
        expires_in?: number;
    };
    error: null;
}

interface TokenRefreshFailure {
    success: false;
    data: null;
    error: string;
}

type TokenRefreshResult = TokenRefreshSuccess | TokenRefreshFailure;

type RefreshQueueItem = {
    resolve: (value: TokenRefreshResult) => void;
    reject: (reason?: unknown) => void;
};

let refreshPromise: Promise<TokenRefreshResult> | null = null;
let isRefreshing = false;
let refreshQueue: RefreshQueueItem[] = [];

class ApiClient {
    private config: ApiConfig;

    private getCurrentWorkspaceId(): string | null {
        if (typeof window === 'undefined') {
            return null;
        }

        try {
            const persistedRoot = window.localStorage.getItem('persist:root');
            if (!persistedRoot) {
                return null;
            }

            const root = JSON.parse(persistedRoot) as Record<string, string>;
            if (!root.workspace) {
                return null;
            }

            const workspaceState = JSON.parse(root.workspace) as { currentWorkspaceId?: string | null };
            return workspaceState.currentWorkspaceId ?? null;
        } catch {
            return null;
        }
    }

    constructor() {
        this.config = {
            baseUrl: getBackendApiUrl(),
            timeout: 90000,
            retryCount: 3,
        };
    }

    async request<Req = void, Res = unknown>(
        endpointConfig: Endpoint<Req, Res>,
        options: {
            body?: Req;
            headers?: Record<string, string>;
            cookies?: CookieStoreLike;
        } = {}
    ): Promise<ApiResponse<Res>> {
        const {
            method,
            endpoint,
            requiredAuth = false,
        } = endpointConfig;

        const {
            body,
            headers = {},
            cookies: requiredCookies,
        } = options;

        const url = `${this.config.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;


        const requestHeaders: Record<string, string> = {
            ...headers,
            'Content-Type': 'application/json',
        };

        const workspaceID = this.getCurrentWorkspaceId();
        if (workspaceID) {
            requestHeaders['X-Workspace-ID'] = workspaceID;
        }

        if (requiredAuth && requiredCookies) {
            const accessToken = requiredCookies.get('access_token');
            if (accessToken?.value) {
                requestHeaders['Authorization'] = `Bearer ${accessToken.value}`;
            }
        }


        const controller = new AbortController();
        const createTimeout = () => setTimeout(() => controller.abort(), this.config.timeout);

        for (let attempt = 1; attempt <= this.config.retryCount; attempt++) {
            const timeoutId = createTimeout();
            try {
                const response = await fetch(url, {
                    method,
                    headers: requestHeaders,
                    body: body ? JSON.stringify(body) : undefined,
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                const responseData = await response.json().catch(() => null);

                if (!response.ok) {
                    console.error("Request failed with status code: ", {
                        status: response.status,
                        statusText: response.statusText,
                        data: responseData,
                    });

                    if (response.status === 401 && requiredAuth && attempt === 1 && requiredCookies)
                        try {
                            const refreshResponse = await this.coordinateTokenRefresh(requiredCookies);
                            if (refreshResponse.success) {
                                requestHeaders.Authorization = `Bearer ${refreshResponse.data.access_token}`;
                                continue;
                            }
                        } catch (error) {
                            console.error("Token refresh failed: ", error);
                            return {
                                success: false,
                                status: response.status,
                                data: null,
                                error: "Token refresh failed" + error
                            }
                        }
                    if (response.status === 429 && attempt < this.config.retryCount) {
                        const retryAfter = response.headers.get('Retry-After');
                        const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    }
                    return {
                        success: false,
                        status: response.status,
                        data: responseData,
                        error: response.statusText
                    }
                }
                return {
                    success: true,
                    status: response.status,
                    data: responseData,
                    error: null
                }
            } catch (error) {
                clearTimeout(timeoutId);

                if (error instanceof Error && error.name === 'AbortError') {
                    return {
                        success: false,
                        status: 408,
                        data: null,
                        error: "Request timeout"
                    }
                }

                if (attempt < this.config.retryCount) {
                    const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        return {
            success: false,
            status: 500,
            data: null,
            error: "Internal server error"
        }
    }

    private async coordinateTokenRefresh(requiredCookies: CookieStoreLike): Promise<TokenRefreshResult> {
        // If a refresh is already in progress, queue this request
        if (isRefreshing) {
            return new Promise<TokenRefreshResult>((resolve, reject) => {
                refreshQueue.push({ resolve, reject });
            });
        }

        // Start a new refresh
        isRefreshing = true;
        refreshPromise = this.performTokenRefresh(requiredCookies);

        try {
            const result = await refreshPromise;
            isRefreshing = false;
            refreshQueue.forEach(({ resolve }) => resolve(result));
            refreshQueue = [];
            return result;

        } catch (error) {
            refreshQueue.forEach(({ reject }) => reject(error));
            refreshQueue = [];
            throw error;
        } finally {
            isRefreshing = false;
            refreshPromise = null;
        }
    }

    private async performTokenRefresh(requiredCookies: CookieStoreLike): Promise<TokenRefreshResult> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
            const refreshTokenCookie = requiredCookies.get('refresh_token');
            if (!refreshTokenCookie?.value) {
                throw new Error('Refresh token not found');
            }

            const response = await fetch(`${this.config.baseUrl}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refresh_token: refreshTokenCookie.value }),
                signal: controller.signal
            });

            if (!response.ok) {
                switch (response.status) {
                    case 401:
                        return {
                            success: false,
                            data: null,
                            error: 'Unauthorized'
                        }
                    case 403:
                        return {
                            success: false,
                            data: null,
                            error: 'Forbidden'
                        }
                    case 404:
                        return {
                            success: false,
                            data: null,
                            error: 'Not Found'
                        }
                    case 429:
                        return {
                            success: false,
                            data: null,
                            error: 'Too Many Requests'
                        }
                    case 500:
                        return {
                            success: false,
                            data: null,
                            error: 'Internal Server Error'
                        }
                    default:
                        return {
                            success: false,
                            data: null,
                            error: 'Unknown Error'
                        }
                }
            }

            const data = await response.json();
            if (!data.access_token) {
                throw new Error('Invalid token response')
            }

            return {
                success: true,
                data: {
                    access_token: data.access_token,
                    refresh_token: data.refresh_token,
                    expires_in: data.expires_in,
                },
                error: null
            }
        } catch (error) {
            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    }
}

export const client = new ApiClient();

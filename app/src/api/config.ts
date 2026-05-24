/**
 * API configuration and typed endpoint builder.
 *
 * `Endpoint<Req, Res>` is a typed descriptor that pairs an HTTP method + path
 * with phantom request/response types. Domain modules (e.g. src/api/auth/) used
 * to export factories that returned these descriptors; they were consumed by
 * ApiClient.request() and by the Next.js route handlers under app/api/.
 *
 * The domain endpoint files and route handlers have been removed after migrating
 * data-fetching to TanStack Query. This config module is kept as reference for
 * the URL-resolution logic (local vs. production, env-var overrides).
 */

export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface Endpoint<_Req = void, _Res = unknown> {
    method: Method;
    endpoint: string;
    requiredAuth?: boolean;
    __requestType?: _Req;
    __responseType?: _Res;
}

const API_VERSION = 'v1';
const LOCAL_BACKEND_ORIGIN = 'http://localhost:8081';
const PRODUCTION_BACKEND_ORIGIN = 'https://api.lornian.com';

function stripApiSuffix(url: string): string {
    return url
        .replace(/\/+$/, '')
        .replace(/\/api\/v1$/, '')
        .replace(/\/v1$/, '');
}

function resolveConfiguredBackendOrigin(): string {
    const publicUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
    const serverOnlyUrl = typeof window === 'undefined' ? process.env.API_BASE_URL?.trim() : undefined;
    const configured = publicUrl || serverOnlyUrl;

    if (configured) {
        return stripApiSuffix(configured);
    }

    return process.env.NODE_ENV === 'production'
        ? PRODUCTION_BACKEND_ORIGIN
        : LOCAL_BACKEND_ORIGIN;
}

function toApiUrl(origin: string): string {
    return `${origin}/api/${API_VERSION}`;
}

export const API_CONFIG = {
    baseURL: resolveConfiguredBackendOrigin(),

    apiVersion: API_VERSION,

    get fullApiUrl() {
        return toApiUrl(this.baseURL);
    },

    localUrl: LOCAL_BACKEND_ORIGIN,
    localApiUrl: toApiUrl(LOCAL_BACKEND_ORIGIN),

    productionUrl: PRODUCTION_BACKEND_ORIGIN,
    productionApiUrl: toApiUrl(PRODUCTION_BACKEND_ORIGIN),
}

export function getBackendApiUrl(useLocal = false): string {
    const shouldUseLocal =
        useLocal ||
        process.env.USE_LOCAL_BACKEND === 'true' ||
        process.env.NEXT_PUBLIC_USE_LOCAL_BACKEND === 'true';

    if (shouldUseLocal) {
        return API_CONFIG.localApiUrl;
    }

    return API_CONFIG.fullApiUrl;
}

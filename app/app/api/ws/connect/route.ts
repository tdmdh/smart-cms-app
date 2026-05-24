import { requireAuth } from '@/src/lib/auth';

const LOCAL_WS_ORIGIN = 'ws://localhost:8081';
const PRODUCTION_WS_ORIGIN = 'wss://api.lornian.com';

function toWebSocketOrigin(rawUrl: string): string {
    const normalized = rawUrl
        .trim()
        .replace(/\/+$/, '')
        .replace(/\/api\/v1$/, '')
        .replace(/\/v1$/, '');

    if (normalized.startsWith('ws://') || normalized.startsWith('wss://')) {
        return normalized;
    }
    if (normalized.startsWith('https://')) {
        return normalized.replace('https://', 'wss://');
    }
    if (normalized.startsWith('http://')) {
        return normalized.replace('http://', 'ws://');
    }

    return normalized;
}

function resolveWsOrigin(): string {
    const configuredUrl =
        process.env.WS_BACKEND_URL ||
        process.env.NEXT_PUBLIC_WS_URL ||
        process.env.API_BASE_URL ||
        process.env.NEXT_PUBLIC_API_BASE_URL;

    if (configuredUrl) {
        return toWebSocketOrigin(configuredUrl);
    }

    return process.env.NODE_ENV === 'production'
        ? PRODUCTION_WS_ORIGIN
        : LOCAL_WS_ORIGIN;
}

const WS_BACKEND_ORIGIN = resolveWsOrigin();

export async function GET() {
    try {
        const auth = await requireAuth();
        if (!auth.authorized) {
            return auth.response;
        }

        return Response.json({
            wsUrl: `${WS_BACKEND_ORIGIN}/api/v1/ws/connect`,
            token: auth.accessToken,
        });
    } catch (error) {
        console.error('WebSocket auth error:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}

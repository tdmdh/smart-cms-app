"use client";

import { useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { integrationsKeys } from "./useIntegrations";

export type OAuthPopupMessage =
    | { type: "INTEGRATION_SUCCESS"; provider: string }
    | { type: "INTEGRATION_ERROR"; provider: string; error: string };

interface OAuthPopupCallbacks {
    onSuccess?: (provider: string) => void;
    onError?: (provider: string, error: string) => void;
}

const POPUP_W = 600;
const POPUP_H = 700;

function popupFeatures(): string {
    const left = Math.max(0, (window.screen.width - POPUP_W) / 2);
    const top = Math.max(0, (window.screen.height - POPUP_H) / 2);
    return `width=${POPUP_W},height=${POPUP_H},left=${left},top=${top},scrollbars=yes,resizable=yes`;
}

export function useOAuthPopup() {
    const queryClient = useQueryClient();
    const cleanupRef = useRef<(() => void) | null>(null);

    const openPopup = useCallback(
        (callbacks?: OAuthPopupCallbacks) => {
            cleanupRef.current?.();

            // Must call window.open synchronously (before any await) so iOS Safari
            // recognises it as part of the user-gesture stack and doesn't block it.
            const popup = window.open("", "oauth_popup", popupFeatures());

            let active = true;

            const cleanup = () => {
                if (!active) return;
                active = false;
                window.removeEventListener("message", onMessage);
                clearInterval(poll);
                cleanupRef.current = null;
            };

            const onMessage = (event: MessageEvent) => {
                if (!active || event.origin !== window.location.origin) return;
                const msg = event.data as OAuthPopupMessage;
                if (msg?.type === "INTEGRATION_SUCCESS") {
                    queryClient.invalidateQueries({
                        queryKey: integrationsKeys.connections(),
                    });
                    callbacks?.onSuccess?.(msg.provider);
                    cleanup();
                } else if (msg?.type === "INTEGRATION_ERROR") {
                    callbacks?.onError?.(msg.provider, msg.error);
                    cleanup();
                }
            };

            // Detect user manually closing the popup without completing the flow
            const poll = setInterval(() => {
                if (popup?.closed) cleanup();
            }, 500);

            cleanupRef.current = cleanup;
            window.addEventListener("message", onMessage);

            return {
                navigate(url: string) {
                    if (!popup || popup.closed) {
                        // Popup was blocked — fall back to full-page redirect
                        cleanup();
                        window.location.href = url;
                        return;
                    }
                    popup.location.href = url;
                },
                abort() {
                    popup?.close();
                    cleanup();
                },
            };
        },
        [queryClient]
    );

    return { openPopup };
}

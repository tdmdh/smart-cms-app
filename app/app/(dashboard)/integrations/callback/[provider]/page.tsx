"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { Card, CardBody } from "@/src/components/shared/ui";
import { useHandleCallback, type OAuthPopupMessage } from "@/src/hooks/queries/integrations";
import { AlertCircle, Loader2 } from "lucide-react";

type CallbackState = "loading" | "error";

function isInPopup(): boolean {
    try {
        return typeof window !== "undefined" && window.opener !== null;
    } catch {
        return false;
    }
}

function notifyOpener(message: OAuthPopupMessage) {
    try {
        window.opener?.postMessage(message, window.location.origin);
    } catch {
        // opener unavailable or different origin
    }
}

export default function IntegrationCallbackPage() {
    const searchParams = useSearchParams();
    const params = useParams();
    const router = useRouter();
    const handleCallback = useHandleCallback();
    const hasRun = useRef(false);

    const [state, setState] = useState<CallbackState>("loading");
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [inPopup] = useState(() => isInPopup());

    const provider = params.provider as string;
    const code = searchParams.get("code");
    const oauthState = searchParams.get("state");
    const errorParam = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    useEffect(() => {
        const executeCallback = async () => {
            if (hasRun.current) return;

            if (errorParam) {
                hasRun.current = true;
                const msg = errorDescription || errorParam;
                setState("error");
                setErrorMessage(msg);
                if (inPopup) {
                    notifyOpener({ type: "INTEGRATION_ERROR", provider, error: msg });
                    setTimeout(() => window.close(), 2000);
                }
                return;
            }

            if (!provider || !code || !oauthState) return;

            hasRun.current = true;

            try {
                await handleCallback.mutateAsync({ provider, state: oauthState, code });
                // Redirect to the dedicated success page — it handles postMessage + close
                router.replace(`/integrations/connected/${provider}`);
            } catch (error) {
                const msg =
                    error instanceof Error ? error.message : "Failed to complete connection";
                setState("error");
                setErrorMessage(msg);
                if (inPopup) {
                    notifyOpener({ type: "INTEGRATION_ERROR", provider, error: msg });
                    setTimeout(() => window.close(), 2000);
                }
            }
        };

        executeCallback();
    }, [provider, code, oauthState, errorParam, errorDescription, handleCallback, router, inPopup]);

    const providerLabel = provider.charAt(0).toUpperCase() + provider.slice(1);

    const handleGoBack = () => {
        if (inPopup) {
            window.close();
            return;
        }
        const afterRedirect = sessionStorage.getItem("after_integration_redirect");
        sessionStorage.removeItem("after_integration_redirect");
        router.push(afterRedirect ?? "/integrations");
    };

    return (
        <div className="integrations-callback">
            <Card variant="bordered" className="integrations-callback__card">
                <CardBody>
                    {state === "loading" && (
                        <>
                            <div className="integrations-callback__icon integrations-callback__icon--loading">
                                <Loader2 />
                            </div>
                            <h2 className="integrations-callback__title">
                                Connecting to {providerLabel}...
                            </h2>
                            <p className="integrations-callback__message">
                                Please wait while we complete the connection.
                            </p>
                        </>
                    )}

                    {state === "error" && (
                        <>
                            <div className="integrations-callback__icon integrations-callback__icon--error">
                                <AlertCircle />
                            </div>
                            <h2 className="integrations-callback__title">
                                Connection Failed
                            </h2>
                            <p className="integrations-callback__message">
                                {errorMessage}
                            </p>
                            <button
                                className="btn btn-primary btn--sm"
                                onClick={handleGoBack}
                            >
                                {inPopup ? "Close" : "Go Back"}
                            </button>
                        </>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}

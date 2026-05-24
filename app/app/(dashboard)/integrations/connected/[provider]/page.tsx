'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { Card, CardBody } from '@/src/components/shared/ui';
import type { OAuthPopupMessage } from '@/src/hooks/queries/integrations';

function isInPopup(): boolean {
    try {
        return typeof window !== 'undefined' && window.opener !== null;
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

export default function IntegrationConnectedPage() {
    const params = useParams();
    const router = useRouter();
    const provider = params.provider as string;
    const providerLabel = provider.charAt(0).toUpperCase() + provider.slice(1);
    const notified = useRef(false);
    const [inPopup] = useState(() => isInPopup());

    useEffect(() => {
        if (notified.current) return;
        notified.current = true;

        if (inPopup) {
            notifyOpener({ type: 'INTEGRATION_SUCCESS', provider });
            const timer = setTimeout(() => window.close(), 2500);
            return () => clearTimeout(timer);
        }
    }, [inPopup, provider]);

    return (
        <div className="integrations-callback">
            <Card variant="bordered" className="integrations-callback__card">
                <CardBody>
                    <div className="integrations-callback__icon integrations-callback__icon--success">
                        <CheckCircle />
                    </div>

                    <h2 className="integrations-callback__title">
                        {providerLabel} Connected!
                    </h2>

                    <p className="integrations-callback__message">
                        Your {providerLabel} account has been successfully linked to your
                        workspace.{' '}
                        {inPopup
                            ? 'This window will close automatically.'
                            : 'You can now use this integration.'}
                    </p>

                    {!inPopup && (
                        <button
                            className="btn btn-primary btn--sm"
                            onClick={() => router.push('/integrations')}
                        >
                            Go to Integrations
                        </button>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}

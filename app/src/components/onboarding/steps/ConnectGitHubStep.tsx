'use client';

import { useState } from 'react';
import { Github, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/src/components/shared/ui';
import { useBeginConnect, useConnections, useOAuthPopup } from '@/src/hooks/queries/integrations';

interface ConnectGitHubStepProps {
  onNext: () => void;
  onSkip: () => void;
}

export function ConnectGitHubStep({ onNext, onSkip }: ConnectGitHubStepProps) {
    const [error, setError] = useState<string | null>(null);
    const beginConnect = useBeginConnect();
    const { data: connectionsData } = useConnections();
    const { openPopup } = useOAuthPopup();

  const isConnected = Array.isArray(connectionsData?.connections)
    ? connectionsData.connections.some((c) => c.provider_slug === 'github')
    : false;

    const handleConnect = async () => {
        setError(null);

        // Open blank popup synchronously before any await (iOS Safari compat)
        const { navigate, abort } = openPopup({
            onSuccess: () => onNext(),
            onError: (_, err) => setError(err),
        });

        try {
            const result = await beginConnect.mutateAsync({
                provider: 'github',
                data: {},
            });
            navigate(result.auth_url);
        } catch (err) {
            abort();
            setError(err instanceof Error ? err.message : 'Failed to start GitHub connection');
        }
    };

    if (isConnected) {
        return (
            <div className="onboarding-step">
                <div className="onboarding-step__icon onboarding-step__icon--success">
                    <CheckCircle2 />
                </div>
                <h2 className="onboarding-step__heading">GitHub Connected</h2>
                <p className="onboarding-step__description">
                    Your GitHub account is linked. You're ready to go.
                </p>
                <Button fullWidth onClick={onNext}>
                    Continue
                </Button>
            </div>
        );
    }

  return (
    <div className="onboarding-step">
      <div className="onboarding-step__icon">
        <Github />
      </div>
      <h2 className="onboarding-step__heading">Connect GitHub</h2>
      <p className="onboarding-step__description">
        Link your GitHub account to enable repository access, automated
        deployments, and source control integrations.
      </p>

      {error && (
        <div className="onboarding-step__error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="onboarding-step__actions">
        <Button
          fullWidth
          onClick={handleConnect}
          loading={beginConnect.isPending}
          rightIcon="github"
          iconSize={18}
        >
          Connect
        </Button>
        <Button
          fullWidth
          variant="ghost"
          onClick={onSkip}
        >
          Skip for now
        </Button>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Mail, CheckCircle, XCircle, Loader } from 'lucide-react';
import { Button } from '@/src/components/shared/ui';
import { useAcceptInvitation } from '@/src/hooks/queries/workspace-management';
import { useAppSelector } from '@/src/store/hooks';
import { selectIsAuthenticated, selectIsInitialized } from '@/src/store/slices/authSlice';
import { routes } from '@/src/config/proxy.config';
import { cognitiveLoadApi } from '@/src/hooks/queries/cognitive-load';
import { FluidScopeStep } from '@/src/components/onboarding/steps';

function AcceptInvitationContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const isInitialized = useAppSelector(selectIsInitialized);

    const [accepted, setAccepted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [attempted, setAttempted] = useState(false);
    const [joinedWorkspaceId, setJoinedWorkspaceId] = useState<string | null>(null);
    const [showFluidScope, setShowFluidScope] = useState(false);

    const accept = useAcceptInvitation();

    useEffect(() => {
        if (!isInitialized || !token || !isAuthenticated || attempted) return;
        setAttempted(true);
        accept.mutate(token, {
            onSuccess: async (data) => {
                const workspaceId = data.member.workspace_id;
                setJoinedWorkspaceId(workspaceId);
                try {
                    const scope = await cognitiveLoadApi.getFluidScope(workspaceId);
                    if (!scope.body?.trim()) {
                        setShowFluidScope(true);
                        return;
                    }
                } catch {
                    // Fluid scope endpoint unavailable — skip the prompt
                }
                setAccepted(true);
            },
            onError: (err) => setError(err.message || 'Failed to accept invitation'),
        });
    }, [isInitialized, token, isAuthenticated, attempted, accept]);

    // Redirect to dashboard after success
    useEffect(() => {
        if (!accepted) return;
        const t = setTimeout(() => router.push(routes.afterLogin), 2000);
        return () => clearTimeout(t);
    }, [accepted, router]);

    // Waiting for auth state to initialize
    if (!isInitialized) {
        return (
            <div className="onboarding-step">
                <div className="onboarding-step__icon">
                    <Loader size={24} className="animate-spin" />
                </div>
                <h2 className="onboarding-step__heading">Loading…</h2>
            </div>
        );
    }

    // No token in URL
    if (!token) {
        return (
            <div className="onboarding-step">
                <div className="onboarding-step__icon onboarding-step__icon--error">
                    <XCircle size={24} />
                </div>
                <h2 className="onboarding-step__heading">Invalid Link</h2>
                <p className="onboarding-step__description">
                    This invitation link is missing a token. Use the link from your email.
                </p>
                <div className="onboarding-step__actions">
                    <Button fullWidth variant="ghost" onClick={() => router.push(routes.afterLogout)}>
                        Go to Login
                    </Button>
                </div>
            </div>
        );
    }

    // Not logged in — prompt to login first, pass returnTo so they come straight back
    if (!isAuthenticated) {
        const returnTo = encodeURIComponent(`/accept-invitation?token=${token}`);
        return (
            <div className="onboarding-step">
                <div className="onboarding-step__icon">
                    <Mail size={24} />
                </div>
                <h2 className="onboarding-step__heading">Workspace Invitation</h2>
                <p className="onboarding-step__description">
                    Log in to your account to accept this workspace invitation.
                </p>
                <div className="onboarding-step__actions">
                    <Button
                        fullWidth
                        variant="primary"
                        onClick={() => router.push(`${routes.afterLogout}?returnTo=${returnTo}`)}
                    >
                        Log In to Accept
                    </Button>
                </div>
            </div>
        );
    }

    // Fluid scope prompt for new members
    if (showFluidScope && joinedWorkspaceId) {
        return (
            <FluidScopeStep
                workspaceId={joinedWorkspaceId}
                onNext={() => setAccepted(true)}
                onSkip={() => setAccepted(true)}
            />
        );
    }

    // Accepting in progress
    if (accept.isPending) {
        return (
            <div className="onboarding-step">
                <div className="onboarding-step__icon">
                    <Loader size={24} className="animate-spin" />
                </div>
                <h2 className="onboarding-step__heading">Joining…</h2>
                <p className="onboarding-step__description">
                    Accepting your invitation, just a moment.
                </p>
            </div>
        );
    }

    // Success
    if (accepted) {
        return (
            <div className="onboarding-step">
                <div className="onboarding-step__icon onboarding-step__icon--success">
                    <CheckCircle size={24} />
                </div>
                <h2 className="onboarding-step__heading">You're In!</h2>
                <p className="onboarding-step__description">
                    You've successfully joined the workspace. Redirecting to your dashboard…
                </p>
                <div className="onboarding-step__actions">
                    <Button fullWidth variant="primary" onClick={() => router.push(routes.afterLogin)}>
                        Go to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    // Error
    if (error) {
        const isExpired = /expired|invalid|not found/i.test(error);
        return (
            <div className="onboarding-step">
                <div className="onboarding-step__icon onboarding-step__icon--error">
                    <XCircle size={24} />
                </div>
                <h2 className="onboarding-step__heading">
                    {isExpired ? 'Invitation Expired' : 'Something Went Wrong'}
                </h2>
                <p className="onboarding-step__description">
                    {isExpired
                        ? 'This invitation has expired or is no longer valid. Ask the workspace admin to send a new one.'
                        : error}
                </p>
                <div className="onboarding-step__actions">
                    <Button fullWidth variant="ghost" onClick={() => router.push(routes.afterLogin)}>
                        Go to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    return null;
}

export default function AcceptInvitationPage() {
    return (
        <div className="onboarding">
            <Suspense
                fallback={
                    <div className="onboarding-step">
                        <div className="onboarding-step__icon">
                            <Loader size={24} className="animate-spin" />
                        </div>
                        <h2 className="onboarding-step__heading">Loading…</h2>
                    </div>
                }
            >
                <AcceptInvitationContent />
            </Suspense>
        </div>
    );
}

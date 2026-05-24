'use client';

import { useEffect, Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEmailVerification } from '@/src/hooks/auth/useEmailVerification';
import { useAppSelector } from '@/src/store/hooks';
import { selectUser, selectIsAuthenticated } from '@/src/store/slices/authSlice';
import { routes } from '@/src/config/proxy.config';
import { Card, CardHeader, CardBody, Button } from '@/src/components/shared/ui';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');
    const user = useAppSelector(selectUser);
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const [autoVerified, setAutoVerified] = useState(false);

    const {
        isVerifying,
        isResending,
        verificationSuccess,
        verificationError,
        resendSuccess,
        resendError,
        verifyEmail,
        resendVerificationEmail,
    } = useEmailVerification();

    // Auto-verify if token is present
    useEffect(() => {
        if (token && !verificationSuccess && !verificationError && !isVerifying && !autoVerified) {
            setAutoVerified(true);
            verifyEmail(token);
        }
    }, [token, verificationSuccess, verificationError, isVerifying, verifyEmail, autoVerified]);

    // Redirect to onboarding on success
    useEffect(() => {
        if (verificationSuccess) {
            const timer = setTimeout(() => {
                router.push(routes.afterVerification);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [verificationSuccess, router]);
    

    const handleResend = async () => {
        await resendVerificationEmail();
    };

    const handleGoToDashboard = () => {
        router.push(routes.afterVerification);
    };

    const handleGoToLogin = () => {
        router.push(routes.afterLogout);
    };

    // Token verification in progress
    if (token && isVerifying) {
        return (
            <Card variant="transparent" className="w-[420px]">
                <CardHeader
                    title="Verifying Email"
                    subtitle="Please wait..."
                />
                <CardBody>
                    <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                    <p className="text-center text-gray-600">
                        We're verifying your email address...
                    </p>
                </CardBody>
            </Card>
        );
    }

    // Verification success
    if (verificationSuccess) {
        return (
            <Card variant="transparent" className="w-[420px]">
                <CardHeader
                    title="Email Verified!"
                    subtitle="Your account is now fully activated"
                />
                <CardBody>
                    <div className="flex justify-center items-center py-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-center text-gray-600 mb-6">
                        Thank you for verifying your email. Setting up your account...
                    </p>
                    <Button fullWidth onClick={handleGoToDashboard}>
                        Continue
                    </Button>
                </CardBody>
            </Card>
        );
    }

    // Token verification failed
    if (token && verificationError) {
        return (
            <Card variant="transparent" className="w-[420px]">
                <CardHeader
                    title="Verification Failed"
                    subtitle="Unable to verify your email"
                />
                <CardBody>
                    <div className="flex justify-center items-center py-4">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-center text-gray-600 mb-2">
                        {verificationError === 'invalid_token' && 'The verification link is invalid.'}
                        {verificationError === 'verification_failed' && 'The verification link may have expired.'}
                        {verificationError !== 'invalid_token' && verificationError !== 'verification_failed' && verificationError}
                    </p>
                    <p className="text-center text-gray-500 text-sm mb-6">
                        {isAuthenticated
                            ? 'Click below to request a new verification email.'
                            : 'Please login and request a new verification email.'}
                    </p>

                    {isAuthenticated ? (
                        <div className="space-y-3">
                            {resendSuccess ? (
                                <p className="text-center text-green-600 font-medium">
                                    ✓ New verification email sent! Check your inbox.
                                </p>
                            ) : (
                                <Button
                                    fullWidth
                                    onClick={handleResend}
                                    loading={isResending}
                                >
                                    Resend Verification Email
                                </Button>
                            )}
                            {resendError && (
                                <p className="text-center text-red-600 text-sm">{resendError}</p>
                            )}
                        </div>
                    ) : (
                        <Button fullWidth onClick={handleGoToLogin}>
                            Go to Login
                        </Button>
                    )}
                </CardBody>
            </Card>
        );
    }

    // Waiting for verification (no token, user is logged in but not verified)
    if (isAuthenticated && user && !user.email_verified) {
        return (
            <Card variant="transparent" className="w-[420px]">
                <CardHeader
                    title="Verify Your Email"
                    subtitle="One last step to complete your registration"
                />
                <CardBody>
                    <div className="flex justify-center items-center py-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-center text-gray-600 mb-2">
                        We've sent a verification email to:
                    </p>
                    <p className="text-center font-medium text-gray-800 mb-4">
                        {user.email}
                    </p>
                    <p className="text-center text-gray-500 text-sm mb-6">
                        Click the link in the email to verify your account. Check your spam folder if you don't see it.
                    </p>

                    <div className="space-y-3">
                        {resendSuccess ? (
                            <p className="text-center text-green-600 font-medium">
                                ✓ New verification email sent!
                            </p>
                        ) : (
                            <Button
                                fullWidth
                                variant="secondary"
                                onClick={handleResend}
                                loading={isResending}
                            >
                                Resend Verification Email
                            </Button>
                        )}
                        {resendError && (
                            <p className="text-center text-red-600 text-sm">{resendError}</p>
                        )}
                    </div>
                </CardBody>
            </Card>
        );
    }

    // Not authenticated, no token
    return (
        <Card variant="transparent" className="w-[420px]">
            <CardHeader
                title="Email Verification"
                subtitle="Please login to verify your email"
            />
            <CardBody>
                <p className="text-center text-gray-600 mb-6">
                    You need to be logged in to verify your email address.
                </p>
                <Button fullWidth onClick={handleGoToLogin}>
                    Go to Login
                </Button>
            </CardBody>
        </Card>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="flex items-start justify-center h-screen pt-24">
            <Suspense fallback={
                <Card variant="transparent" className="w-[420px]">
                    <CardBody>
                        <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        </div>
                    </CardBody>
                </Card>
            }>
                <VerifyEmailContent />
            </Suspense>
        </div>
    );
}

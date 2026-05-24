'use client';

import { useCallback, useState, useEffect } from 'react';
import { useAppSelector } from '@/src/store/hooks';
import { selectUser } from '@/src/store/slices/authSlice';

interface UseEmailVerificationReturn {
    isVerifying: boolean;
    isResending: boolean;
    verificationSuccess: boolean;
    verificationError: string | null;
    resendSuccess: boolean;
    resendError: string | null;
    verifyEmail: (token: string) => Promise<boolean>;
    resendVerificationEmail: () => Promise<boolean>;
    clearErrors: () => void;
}

export function useEmailVerification(): UseEmailVerificationReturn {
    const user = useAppSelector(selectUser);

    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [verificationSuccess, setVerificationSuccess] = useState(false);
    const [verificationError, setVerificationError] = useState<string | null>(null);
    const [resendSuccess, setResendSuccess] = useState(false);
    const [resendError, setResendError] = useState<string | null>(null);

    const verifyEmail = useCallback(async (token: string): Promise<boolean> => {
        setIsVerifying(true);
        setVerificationError(null);
        setVerificationSuccess(false);

        try {
            const response = await fetch(`/api/auth/email/verify?token=${encodeURIComponent(token)}`, {
                method: 'GET',
                credentials: 'include',
            });

            if (response.redirected) {
                const url = new URL(response.url);
                if (url.searchParams.get('verified') === 'true') {
                    setVerificationSuccess(true);
                    return true;
                } else {
                    const error = url.searchParams.get('error') || 'Verification failed';
                    setVerificationError(error);
                    return false;
                }
            }

            if (!response.ok) {
                const data = await response.json();
                setVerificationError(data.error || 'Verification failed');
                return false;
            }

            setVerificationSuccess(true);
            return true;
        } catch {
            setVerificationError('Network error. Please try again.');
            return false;
        } finally {
            setIsVerifying(false);
        }
    }, []);

    const resendVerificationEmail = useCallback(async (): Promise<boolean> => {
        if (!user?.id) {
            setResendError('You must be logged in to resend verification email');
            return false;
        }

        setIsResending(true);
        setResendError(null);
        setResendSuccess(false);

        try {
            const response = await fetch('/api/auth/email/verify/begin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ user_id: user.id }),
            });

            const data = await response.json();

            if (!response.ok) {
                setResendError(data.error || 'Failed to send verification email');
                return false;
            }

            setResendSuccess(true);
            return true;
        } catch {
            setResendError('Network error. Please try again.');
            return false;
        } finally {
            setIsResending(false);
        }
    }, [user]);

    const clearErrors = useCallback(() => {
        setVerificationError(null);
        setResendError(null);
    }, []);

    return {
        isVerifying,
        isResending,
        verificationSuccess,
        verificationError,
        resendSuccess,
        resendError,
        verifyEmail,
        resendVerificationEmail,
        clearErrors,
    };
}

'use client';

import { useState } from 'react';
import { useAppSelector } from '@/src/store/hooks';
import { selectUser } from '@/src/store/slices/authSlice';
import { useEmailVerification } from '@/src/hooks/auth/useEmailVerification';
import { Button } from '@/src/components/shared/ui';

interface EmailVerificationBannerProps {
    className?: string;
}

export function EmailVerificationBanner({ className = '' }: EmailVerificationBannerProps) {
    const user = useAppSelector(selectUser);
    const [isDismissed, setIsDismissed] = useState(false);

    const {
        isResending,
        resendSuccess,
        resendError,
        resendVerificationEmail,
    } = useEmailVerification();

    if (!user || user.email_verified || isDismissed) {
        return null;
    }

    return (
        <div className={`bg-amber-50 border-b border-amber-200 ${className}`}>
            <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                        <span className="flex-shrink-0">
                            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </span>
                        <p className="text-sm text-amber-800">
                            <span className="font-medium">Verify your email</span>
                            {' '}to unlock all features. Check your inbox for a verification link.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {resendSuccess ? (
                            <span className="text-sm text-green-600 font-medium">
                                ✓ Email sent!
                            </span>
                        ) : resendError ? (
                            <span className="text-sm text-red-600">
                                {resendError}
                            </span>
                        ) : (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={resendVerificationEmail}
                                loading={isResending}
                            >
                                Resend email
                            </Button>
                        )}

                        <button
                            type="button"
                            className="p-1 text-amber-600 hover:text-amber-800 transition-colors"
                            onClick={() => setIsDismissed(true)}
                            aria-label="Dismiss"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

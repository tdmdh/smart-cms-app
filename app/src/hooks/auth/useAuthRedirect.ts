'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppSelector } from '@/src/store/hooks';
import {
    selectIsAuthenticated,
    selectUser,
    selectIsInitialized
} from '@/src/store/slices/authSlice';
import { routes } from '@/src/config/proxy.config';

interface UseAuthRedirectOptions {
    redirectIfAuthenticated?: boolean;
    redirectIfUnauthenticated?: boolean;
    redirectTo?: string;
}

export function useAuthRedirect(options: UseAuthRedirectOptions = {}) {
    const {
        redirectIfAuthenticated = false,
        redirectIfUnauthenticated = false,
        redirectTo,
    } = options;

    const router = useRouter();
    const searchParams = useSearchParams();
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const isInitialized = useAppSelector(selectIsInitialized);
    const user = useAppSelector(selectUser);

    useEffect(() => {
        if (!isInitialized) {
            return;
        }

        if (redirectIfAuthenticated && isAuthenticated && user) {
            const returnTo = searchParams.get('returnTo');
            const destination = redirectTo || returnTo || routes.afterLogin;
            router.push(destination);
        }

        if (redirectIfUnauthenticated && !isAuthenticated) {
            const destination = redirectTo || routes.afterLogout;
            router.push(destination);
        }
    }, [isAuthenticated, isInitialized, user, redirectIfAuthenticated, redirectIfUnauthenticated, redirectTo, router, searchParams]);

    return { isAuthenticated, isInitialized, user };
}


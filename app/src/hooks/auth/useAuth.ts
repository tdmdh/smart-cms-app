import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import {
    logout as logoutThunk,
    fetchCurrentUser,
    selectUser,
    selectIsAuthenticated,
    selectIsLoading,
    selectIsInitialized,
    selectAuthError,
    clearError,
    type User,
} from '@/src/store/slices/authSlice';
import { clearRoles } from '@/src/store/slices/roleSlice';

interface UseAuthReturn {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitialized: boolean;
    error: string | null;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    clearError: () => void;
}

export function useAuth(): UseAuthReturn {
    const dispatch = useAppDispatch();
    const user = useAppSelector(selectUser);
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const isLoading = useAppSelector(selectIsLoading);
    const isInitialized = useAppSelector(selectIsInitialized);
    const error = useAppSelector(selectAuthError);

    const logout = useCallback(async () => {
        await dispatch(logoutThunk());
        dispatch(clearRoles());
    }, [dispatch]);

    const refreshUser = useCallback(async () => {
        await dispatch(fetchCurrentUser());
    }, [dispatch]);

    const handleClearError = useCallback(() => {
        dispatch(clearError());
    }, [dispatch]);

    return {
        user,
        isAuthenticated,
        isLoading,
        isInitialized,
        error,
        logout,
        refreshUser,
        clearError: handleClearError,
    };
}

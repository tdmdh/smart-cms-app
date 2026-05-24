'use client';
import { useCallback, useState } from 'react';
import { useAppDispatch } from '@/src/store/hooks';
import {
    logout as logoutThunk,
} from '@/src/store/slices/authSlice';
import { Button, useToast } from '@/src/components/shared/ui';

export default function Logout() {
    const dispatch = useAppDispatch();
    const toast = useToast();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = useCallback(() => {
        try {
            setIsLoggingOut(true);
            dispatch(logoutThunk());
            toast.success("Logout successful");
        } catch (error) {
            toast.error(error as string);
        } finally {
            setIsLoggingOut(false);
        }
    }, [dispatch, toast]);
    
    return (
        <Button
            onClick={handleLogout}
            disabled={isLoggingOut}
            loading={isLoggingOut}
        >
            Logout
        </Button>
    );
}
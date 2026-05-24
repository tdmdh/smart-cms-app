'use client';
import { useState, useCallback, ChangeEvent, FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import {
    login as loginThunk,
    selectIsLoading,
    selectAuthError,
    clearError,
} from '@/src/store/slices/authSlice';
import { useToast } from '@/src/components/shared/ui';

interface FormData {
    identifier: string;
    password: string;
}

interface FormErrors {
    identifier?: string;
    password?: string;
}

interface UseLoginReturn {
    formData: FormData;
    formErrors: FormErrors;
    isLoading: boolean;
    serverError: string | null;
    handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
    handleSubmit: (e: FormEvent) => Promise<boolean>;
    clearServerError: () => void;
    resetForm: () => void;
}

const initialFormData: FormData = {
    identifier: '',
    password: '',
};

export function useLogin(): UseLoginReturn {
    const dispatch = useAppDispatch();
    const isLoading = useAppSelector(selectIsLoading);
    const serverError = useAppSelector(selectAuthError);
    const toast = useToast();
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [formErrors, setFormErrors] = useState<FormErrors>({});


    const validate = useCallback((): boolean => {
        const errors: FormErrors = {};

        if (!formData.identifier.trim()) {
            errors.identifier = 'Email or username is required';
        }

        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData]);

    const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (formErrors[name as keyof FormErrors]) {
            setFormErrors(prev => ({ ...prev, [name]: undefined }));
        }
    }, [formErrors]);

    const handleSubmit = useCallback(async (e: FormEvent): Promise<boolean> => {
        e.preventDefault();
        if (!validate()) return false;

        const result = await dispatch(loginThunk({
            identifier: formData.identifier.trim(),
            password: formData.password,
        }));

        if (loginThunk.fulfilled.match(result)) {
            toast.success('Welcome back!', 'Login Successful');
            return true;
        } else if (loginThunk.rejected.match(result)) {
            const errorMessage = result.payload as string || 'Login failed. Please try again.';
            toast.error(errorMessage, 'Login Error');
            return false;
        }

        return false;
    }, [dispatch, formData, validate, toast]);

    const clearServerError = useCallback(() => {
        dispatch(clearError());
    }, [dispatch]);

    const resetForm = useCallback(() => {
        setFormData(initialFormData);
        setFormErrors({});
        dispatch(clearError());
    }, [dispatch]);

    return {
        formData,
        formErrors,
        isLoading,
        serverError,
        handleChange,
        handleSubmit,
        clearServerError,
        resetForm,
    };
}

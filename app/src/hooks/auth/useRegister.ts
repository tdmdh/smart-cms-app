import { useCallback, useState, ChangeEvent, FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import {
    register as registerThunk,
    selectIsLoading,
    selectAuthError,
    clearError,
} from '@/src/store/slices/authSlice';
import { useToast } from '@/src/components/shared/ui';

export interface RegisterFormData {
    email: string;
    username: string;
    password: string;
    name?: string;
    last_name?: string;
}

export interface RegisterFormErrors {
    email?: string;
    username?: string;
    password?: string;
    name?: string;
    last_name?: string;
}

interface UseRegisterReturn {
    formData: RegisterFormData;
    formErrors: RegisterFormErrors;
    isLoading: boolean;
    serverError: string | null;
    currentStep: number;
    setCurrentStep: (step: number) => void;
    handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
    handleSubmit: (e?: FormEvent<HTMLFormElement>) => Promise<boolean>;
    validateStep: (stepIndex: number) => boolean;
    clearServerError: () => void;
    resetForm: () => void;
}

const initialState: RegisterFormData = {
    email: '',
    username: '',
    password: '',
    name: '',
    last_name: '',
};

export function useRegister(): UseRegisterReturn {
    const dispatch = useAppDispatch();
    const isLoading = useAppSelector(selectIsLoading);
    const serverError = useAppSelector(selectAuthError);
    const toast = useToast();
    const [formData, setFormData] = useState(initialState);
    const [formErrors, setFormErrors] = useState<RegisterFormErrors>({});
    const [currentStep, setCurrentStep] = useState(0);

    const validateStep = useCallback((stepIndex: number): boolean => {
        const errors: RegisterFormErrors = {};

        if (stepIndex === 0) {
            if (!formData.name || formData.name.trim() === '') {
                errors.name = 'First name is required';
            }
        }

        if (stepIndex === 1) {
            if (!formData.email) {
                errors.email = 'Email is required';
            } else if (!formData.email.includes('@')) {
                errors.email = 'Please enter a valid email';
            }

            if (!formData.username) {
                errors.username = 'Username is required';
            } else if (formData.username.length < 3) {
                errors.username = 'Username must be at least 3 characters';
            }

            if (!formData.password) {
                errors.password = 'Password is required';
            } else if (formData.password.length < 8) {
                errors.password = 'Password must be at least 8 characters';
            } else {
                const hasUpper = /[A-Z]/.test(formData.password);
                const hasLower = /[a-z]/.test(formData.password);
                const hasDigit = /[0-9]/.test(formData.password);
                const hasSpecial = /[^A-Za-z0-9]/.test(formData.password);
                const count = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;
                if (count < 3) {
                    errors.password = 'Password needs 3 of: uppercase, lowercase, number, special char';
                }
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData]);

    const validate = useCallback((): boolean => {
        const errors: RegisterFormErrors = {};

        if (!formData.name || formData.name.trim() === '') {
            errors.name = 'First name is required';
        }

        if (!formData.email || !formData.email.includes('@')) {
            errors.email = 'Valid email is required';
        }

        if (!formData.username || formData.username.length < 3) {
            errors.username = 'Username must be at least 3 characters';
        }

        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
        } else {
            const hasUpper = /[A-Z]/.test(formData.password);
            const hasLower = /[a-z]/.test(formData.password);
            const hasDigit = /[0-9]/.test(formData.password);
            const hasSpecial = /[^A-Za-z0-9]/.test(formData.password);
            const count = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;
            if (count < 3) {
                errors.password = 'Password needs 3 of: uppercase, lowercase, number, special char';
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData]);

    const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (formErrors[name as keyof RegisterFormErrors]) {
            setFormErrors(prev => ({ ...prev, [name]: undefined }));
        }
    }, [formErrors]);

    const handleSubmit = useCallback(async (e?: FormEvent): Promise<boolean> => {
        if (e) e.preventDefault();
        if (!validate()) return false;

        const result = await dispatch(registerThunk({
            email: formData.email,
            username: formData.username,
            password: formData.password,
            name: formData.name,
            last_name: formData.last_name,
        }));

        if (registerThunk.fulfilled.match(result)) {
            toast.success('Welcome!', 'Registration Successful');
            return true;
        } else if (registerThunk.rejected.match(result)) {
            const errorMessage = result.payload as string || 'Registration failed. Please try again.';
            toast.error(errorMessage, 'Registration Error');
            return false;
        }
        return false;
    }, [dispatch, formData, validate, toast]);

    const clearServerError = useCallback(() => {
        dispatch(clearError());
    }, [dispatch]);

    const resetForm = useCallback(() => {
        setFormData(initialState);
        setFormErrors({});
        setCurrentStep(0);
        dispatch(clearError());
    }, [dispatch]);

    return {
        formData,
        formErrors,
        isLoading,
        serverError,
        currentStep,
        setCurrentStep,
        handleChange,
        handleSubmit,
        validateStep,
        clearServerError,
        resetForm,
    };
}

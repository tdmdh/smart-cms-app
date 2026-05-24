'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

export interface ToastProps {
    id: string;
    title?: string;
    message: string;
    variant?: ToastVariant;
    duration?: number;
    closable?: boolean;
    onClose?: () => void;
}

export interface ToastOptions {
    title?: string;
    message: string;
    variant?: ToastVariant;
    duration?: number;
    closable?: boolean;
}

interface ToastContextValue {
    toasts: ToastProps[];
    addToast: (options: ToastOptions) => string;
    removeToast: (id: string) => void;
    success: (message: string, title?: string) => string;
    error: (message: string, title?: string) => string;
    warning: (message: string, title?: string) => string;
    info: (message: string, title?: string) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

const variantIcons: Record<ToastVariant, ReactNode> = {
    success: <CheckCircle />,
    error: <AlertCircle />,
    warning: <AlertTriangle />,
    info: <Info />,
};

interface ToastItemProps extends ToastProps {
    onRemove: (id: string) => void;
}

const ToastItem = ({
    id,
    title,
    message,
    variant = 'info',
    closable = true,
    onRemove,
}: ToastItemProps) => {
    const [isLeaving, setIsLeaving] = useState(false);

    const handleClose = useCallback(() => {
        setIsLeaving(true);
        setTimeout(() => onRemove(id), 200);
    }, [id, onRemove]);

    const classes = [
        'toast',
        `toast--${variant}`,
        isLeaving && 'is-leaving',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={classes} role="alert">
            <span className="toast__icon">{variantIcons[variant]}</span>
            <div className="toast__content">
                {title && <div className="toast__title">{title}</div>}
                <div className="toast__message">{message}</div>
            </div>
            {closable && (
                <button
                    className="toast__close"
                    onClick={handleClose}
                    aria-label="Close notification"
                >
                    <X size={16} />
                </button>
            )}
        </div>
    );
};

interface ToastContainerProps {
    position?: ToastPosition;
    toasts: ToastProps[];
    onRemove: (id: string) => void;
}

const ToastContainer = ({
    position = 'top-center',
    toasts,
    onRemove,
}: ToastContainerProps) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const classes = ['toast-container', `toast-container--${position}`].join(' ');

    return createPortal(
        <div className={classes}>
            {toasts.map((toast) => (
                <ToastItem key={toast.id} {...toast} onRemove={onRemove} />
            ))}
        </div>,
        document.body
    );
};

interface ToastProviderProps {
    children: ReactNode;
    position?: ToastPosition;
    defaultDuration?: number;
}

export const ToastProvider = ({
    children,
    position = 'top-center',
    defaultDuration = 5000,
}: ToastProviderProps) => {
    const [toasts, setToasts] = useState<ToastProps[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const addToast = useCallback(
        (options: ToastOptions): string => {
            const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
            const duration = options.duration ?? defaultDuration;

            const newToast: ToastProps = {
                id,
                ...options,
                onClose: () => removeToast(id),
            };

            setToasts((prev) => [...prev, newToast]);

            if (duration > 0) {
                setTimeout(() => removeToast(id), duration);
            }

            return id;
        },
        [defaultDuration, removeToast]
    );

    const success = useCallback(
        (message: string, title?: string) =>
            addToast({ message, title, variant: 'success' }),
        [addToast]
    );

    const error = useCallback(
        (message: string, title?: string) =>
            addToast({ message, title, variant: 'error' }),
        [addToast]
    );

    const warning = useCallback(
        (message: string, title?: string) =>
            addToast({ message, title, variant: 'warning' }),
        [addToast]
    );

    const info = useCallback(
        (message: string, title?: string) =>
            addToast({ message, title, variant: 'info' }),
        [addToast]
    );

    return (
        <ToastContext.Provider
            value={{ toasts, addToast, removeToast, success, error, warning, info }}
        >
            {children}
            <ToastContainer position={position} toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
};

export default ToastProvider;

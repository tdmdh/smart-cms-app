import { HTMLAttributes, forwardRef, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';


export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
    variant?: AlertVariant;
    title?: string;
    icon?: ReactNode;
    showIcon?: boolean;
    closable?: boolean;
    onClose?: () => void;
    actions?: ReactNode;
    children?: ReactNode;
}

const variantClasses: Record<AlertVariant, string> = {
    info: 'alert-info',
    success: 'alert-success',
    warning: 'alert-warning',
    error: 'alert-error',
};

const variantIcons: Record<AlertVariant, ReactNode> = {
    info: <Info />,
    success: <CheckCircle />,
    warning: <AlertTriangle />,
    error: <AlertCircle />,
};

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
    (
        {
            variant = 'info',
            title,
            icon,
            showIcon = true,
            closable = false,
            onClose,
            actions,
            className = '',
            children,
            ...props
        },
        ref
    ) => {
        const classes = [variantClasses[variant], className].filter(Boolean).join(' ');
        const displayIcon = icon ?? variantIcons[variant];

        return (
            <div ref={ref} className={classes} role="alert" {...props}>
                {showIcon && <span className="alert__icon">{displayIcon}</span>}
                <div className="alert__content">
                    {title && <div className="alert__title">{title}</div>}
                    <div className="alert__message">{children}</div>
                    {actions && <div className="alert__actions">{actions}</div>}
                </div>
                {closable && (
                    <button
                        className="alert__close"
                        onClick={onClose}
                        aria-label="Close alert"
                        type="button"
                    >
                        <X />
                    </button>
                )}
            </div>
        );
    }
);

Alert.displayName = 'Alert';

export default Alert;

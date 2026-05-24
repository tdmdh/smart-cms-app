import { ButtonHTMLAttributes, forwardRef, ReactNode, MouseEventHandler } from 'react';
import { Icon, IconName } from './Icon';
import Link from 'next/link';
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'accent' | 'link';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    fullWidth?: boolean;
    rounded?: boolean;
    loading?: boolean;
    iconOnly?: boolean;
    leftIcon?: IconName;
    rightIcon?: IconName;
    iconSize?: number;
    children?: ReactNode;
    href?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
    accent: 'btn-accent',
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
    success: 'btn-success',
    link: 'btn-link',
};

const sizeClasses: Record<ButtonSize, string> = {
    xs: 'btn--xs',
    sm: 'btn--sm',
    md: '',
    lg: 'btn--lg',
    xl: 'btn--xl',
};

const LoadingDots = () => (
    <span className="btn__loading-dots">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
    </span>
);

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'primary',
            size = 'md',
            fullWidth = false,
            rounded = false,
            loading = false,
            iconOnly = false,
            leftIcon,
            rightIcon,
            className = '',
            disabled,
            children,
            iconSize,
            href,
            ...props
        },
        ref
    ) => {
        const classes = [
            variantClasses[variant],
            sizeClasses[size],
            fullWidth && 'btn--block',
            rounded && 'btn--rounded',
            loading && 'btn--loading',
            iconOnly && 'btn--icon',
            className,
        ]
            .filter(Boolean)
            .join(' ');

        const content = (
            <>
                {loading && <LoadingDots />}
                {leftIcon && <Icon className="btn__icon-left" name={leftIcon} size={iconSize} />}
                <span className="btn__text">{children}</span>
                {rightIcon && <Icon className="btn__icon-right" name={rightIcon} size={iconSize} />}
            </>
        );

        if (href) {
            const handleLinkClick: MouseEventHandler<HTMLAnchorElement> = event => {
                if (disabled || loading) {
                    event.preventDefault();
                    event.stopPropagation();
                    return;
                }
                props.onClick?.(
                    event as unknown as Parameters<
                        NonNullable<ButtonHTMLAttributes<HTMLButtonElement>['onClick']>
                    >[0]
                );
            };

            return (
                <Link
                    href={href}
                    className={classes}
                    aria-disabled={disabled || loading}
                    onClick={handleLinkClick}
                >
                    {content}
                </Link>
            );
        }

        return (
            <button
                ref={ref}
                className={classes}
                disabled={disabled || loading}
                {...props}
            >
                {content}
            </button>
        );
    }
);

Button.displayName = 'Button';

export default Button;


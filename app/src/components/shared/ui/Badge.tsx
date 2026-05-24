'use client';

import { forwardRef, type ReactNode, type HTMLAttributes } from 'react';
import { Icon, type IconName } from './Icon';

export type BadgeVariant =
    | 'default'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'error'
    | 'info'
    | 'primary-solid'
    | 'success-solid'
    | 'warning-solid'
    | 'danger-solid'
    | 'error-solid'
    | 'info-solid';

export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

export interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
    /** Visual variant / colour scheme */
    variant?: BadgeVariant;
    /** Size preset */
    size?: BadgeSize;
    /** Use pill (fully rounded) shape */
    pill?: boolean;
    /** Use outline style */
    outline?: boolean;
    /** Show a leading dot indicator */
    dot?: boolean;
    /** Leading icon (from icon registry) */
    icon?: IconName;
    /** Spin the leading icon (e.g. for loading) */
    iconSpin?: boolean;
    /** Show a remove button */
    removable?: boolean;
    /** Called when the remove button is clicked */
    onRemove?: () => void;
    /** Badge content */
    children: ReactNode;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
    {
        variant = 'default',
        size = 'md',
        pill = false,
        outline = false,
        dot = false,
        icon,
        iconSpin = false,
        removable = false,
        onRemove,
        children,
        className,
        ...rest
    },
    ref,
) {
    const classes = [
        'badge',
        `badge--${variant}`,
        size !== 'md' && `badge--${size}`,
        pill && 'badge--pill',
        outline && 'badge--outline',
        dot && 'badge--dot',
        removable && 'badge--removable',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    const iconSize = size === 'xs' ? 10 : size === 'sm' ? 11 : size === 'lg' ? 14 : 12;

    return (
        <span ref={ref} className={classes} {...rest}>
            {icon && (
                <span className={`badge__icon${iconSpin ? ' badge__icon--spin' : ''}`}>
                    <Icon name={icon} size={iconSize} />
                </span>
            )}
            {children}
            {removable && (
                <button
                    type="button"
                    className="badge__remove"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove?.();
                    }}
                    aria-label="Remove"
                >
                    <Icon name="close" size={12} />
                </button>
            )}
        </span>
    );
});

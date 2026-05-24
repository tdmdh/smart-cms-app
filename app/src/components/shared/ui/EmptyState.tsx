import { ReactNode } from 'react';
import { Icon } from './Icon';
import type { IconName } from './Icon';

// ─── Types ────────────────────────────────────────────────────────────────────

export type EmptyStateColor = 'default' | 'success' | 'warning' | 'error';
export type EmptyStateSize = 'default' | 'compact' | 'fullscreen';

export interface EmptyStateCTAProps {
    label: string;
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
}

export interface EmptyStateProps {
    icon: IconName;
    title: string;
    description?: string;
    cta?: EmptyStateCTAProps;
    actions?: ReactNode;
    color?: EmptyStateColor;
    size?: EmptyStateSize;
    className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EmptyState({
    icon,
    title,
    description,
    cta,
    actions,
    color = 'default',
    size = 'default',
    className = '',
}: EmptyStateProps) {
    const rootClass = [
        'empty-state',
        `empty-state--${color}`,
        size !== 'default' ? `empty-state--${size}` : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    const iconSize = size === 'compact' ? 28 : size === 'fullscreen' ? 52 : 40;

    return (
        <div className={rootClass} role="status" aria-label={title}>
            <div className="empty-state__icon-wrap">
                <div className="empty-state__icon-box">
                    <Icon name={icon} size={iconSize} />
                </div>
                <div className="empty-state__ring empty-state__ring--1" aria-hidden="true" />
                <div className="empty-state__ring empty-state__ring--2" aria-hidden="true" />
            </div>

            <h2 className="empty-state__title">{title}</h2>
            {description && (
                <p className="empty-state__description">{description}</p>
            )}
            {(cta || actions) && (
                <div className="empty-state__actions">
                    {cta && (
                        <button
                            type="button"
                            className="empty-state__cta"
                            onClick={cta.onClick}
                            disabled={cta.disabled || cta.loading}
                            aria-busy={cta.loading}
                        >
                            {cta.loading ? (
                                <Icon name="loader" size={14} className="animate-spin" />
                            ) : (
                                <Icon name="plus" size={14} />
                            )}
                            {cta.label}
                        </button>
                    )}
                    {actions}
                </div>
            )}
        </div>
    );
}

export default EmptyState;

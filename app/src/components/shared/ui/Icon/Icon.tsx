'use client';
import { memo, useMemo } from 'react';
import { iconRegistry, type IconName, type IconComponent } from './icon-registry';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/free-brands-svg-icons';

export interface DynamicIconCondition {
    when: boolean;
    icon: IconName;
}

export interface DynamicIconConfig {
    conditions: DynamicIconCondition[];
    fallback: IconName;
}

export interface IconProps {
    name?: IconName;
    dynamicIcon?: DynamicIconConfig;
    size?: number;
    className?: string;
    'aria-label'?: string;
    'aria-hidden'?: boolean;
}

function IconComponent({
    name,
    dynamicIcon,
    size = 24,
    className = '',
    'aria-label': ariaLabel,
    'aria-hidden': ariaHidden = true,
}: IconProps) {
    const resolvedIconName = useMemo<IconName | undefined>(() => {
        if (dynamicIcon) {
            const matchedCondition = dynamicIcon.conditions.find(c => c.when);
            return matchedCondition?.icon ?? dynamicIcon.fallback;
        }

        return name;
    }, [name, dynamicIcon]);

    const IconComp = resolvedIconName
        ? iconRegistry[resolvedIconName]
        : undefined;

    if (!IconComp) {
        if (process.env.NODE_ENV === 'development') {
            console.warn(`[Icon] Icon "${resolvedIconName}" not found in registry`);
        }
        return null;
    }

    const isFontAwesome = (icon: any): icon is IconDefinition => {
        return icon && typeof icon === 'object' && 'prefix' in icon && 'iconName' in icon;
    };

    const classes = ['icon', className].filter(Boolean).join(' ');

    if (isFontAwesome(IconComp)) {
        return (
            <span
                className={classes}
                style={{ '--icon-size': `${size}px` } as React.CSSProperties}
            >
                <FontAwesomeIcon
                    icon={IconComp}
                    size={`${size}px` as any}
                    aria-label={ariaLabel}
                    aria-hidden={ariaHidden}
                />
            </span>
        );
    }

    return (
        <span
            className={classes}
            style={{ '--icon-size': `${size}px` } as React.CSSProperties}
        >
            <IconComp
                size={size}
                aria-label={ariaLabel}
                aria-hidden={ariaHidden}
            />
        </span>
    );
}

export const Icon = memo(IconComponent);
Icon.displayName = 'Icon';

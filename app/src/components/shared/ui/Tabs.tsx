'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import Link from 'next/link';
import { motion, type Transition } from 'framer-motion';
import { Badge } from '@/src/components/shared/ui/Badge';

export type TabsVariant = 'default' | 'underline' | 'pills' | 'glass';
export type TabsSize = 'sm' | 'md' | 'lg';

export interface TabsProps extends React.ComponentProps<typeof TabsPrimitive.Root> {
  orientation?: 'horizontal' | 'vertical';
  withBg?: boolean
}

export interface TabsListProps extends React.ComponentProps<typeof TabsPrimitive.List> {
  variant?: TabsVariant;
  fullWidth?: boolean;
  centered?: boolean;
}

export interface TabsTriggerProps extends React.ComponentProps<typeof TabsPrimitive.Trigger> {
  size?: TabsSize;
  iconOnly?: boolean;
  badge?: number | string;
  showIndicator?: boolean;
  indicatorLayoutId?: string;
  indicatorTransition?: Transition;
}

export interface TabsContentProps extends React.ComponentProps<typeof TabsPrimitive.Content> {
  animated?: boolean;
  transparant?: boolean;
}

const variantClasses: Record<TabsVariant, string> = {
  default: '',
  underline: 'tabs__list--underline',
  pills: 'tabs__list--pills',
  glass: 'tabs__list--glass',
};

const sizeClasses: Record<TabsSize, string> = {
  sm: 'tabs__trigger--sm',
  md: '',
  lg: 'tabs__trigger--lg',
};

export const Tabs = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Root>,
  TabsProps
>(({ className = '', withBg = false, orientation = 'horizontal', ...props }, ref) => {
  const classes = [
    'tabs',
    withBg === true && 'tabs--withBg',
    orientation === 'vertical' && 'tabs--vertical',
    className
  ].filter(Boolean).join(' ');

  return (
    <TabsPrimitive.Root
      ref={ref}
      orientation={orientation}
      className={classes}
      {...props}
    />
  );
});
Tabs.displayName = 'Tabs';

export const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className = '', variant = 'default', fullWidth, centered, ...props }, ref) => {
  const classes = [
    'tabs__list',
    variantClasses[variant],
    fullWidth && 'tabs__list--full-width',
    centered && 'tabs__list--centered',
    className
  ].filter(Boolean).join(' ');

  return (
    <TabsPrimitive.List
      ref={ref}
      className={classes}
      {...props}
    />
  );
});
TabsList.displayName = 'TabsList';

export const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className = '', size = 'md', iconOnly, badge, showIndicator, indicatorLayoutId, indicatorTransition, children, ...props }, ref) => {
  const classes = [
    'tabs__trigger',
    sizeClasses[size],
    iconOnly && 'tabs__trigger--icon-only',
    className
  ].filter(Boolean).join(' ');

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={classes}
      {...props}
    >
      {showIndicator && indicatorLayoutId && (
        <motion.div
          className="tabs-nav__indicator"
          layoutId={indicatorLayoutId}
          initial={false}
          transition={indicatorTransition ?? {
            type: 'spring',
            stiffness: 500,
            damping: 35,
          }}
        />
      )}
      {children}
      {badge !== undefined && badge !== null && (
        <Badge size="xs" variant="secondary" className="tabs__badge tabs-nav__foreground">{badge}</Badge>
      )}
    </TabsPrimitive.Trigger>
  );
});
TabsTrigger.displayName = 'TabsTrigger';

export const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  TabsContentProps
>(({ className = '', animated, transparant, ...props }, ref) => {
  const classes = [
    'tabs__content',
    transparant && 'tabs__content--transparant',
    animated && 'tabs__content--animated',
    className
  ].filter(Boolean).join(' ');

  return (
    <TabsPrimitive.Content
      ref={ref}
      className={classes}
      {...props}
    />
  );
});
TabsContent.displayName = 'TabsContent';

// --------------------------------------------------------------------------
// Navigation Tabs (Link-based for routing)
// --------------------------------------------------------------------------

export interface TabsNavProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: TabsVariant;
  centered?: boolean;
  fullWidth?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

export interface TabsNavLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  isActive?: boolean;
  icon?: React.ReactNode;
  badge?: number | string;
  hideLabel?: boolean;
  showIndicator?: boolean;
  indicatorLayoutId?: string;
  indicatorTransition?: Transition;
}

export interface TabsTriggerLinkProps extends Omit<React.ComponentProps<typeof Link>, 'href' | 'className' | 'children'> {
  href: React.ComponentProps<typeof Link>['href'];
  className?: string;
  isActive?: boolean;
  icon?: React.ReactNode;
  badge?: number | string;
  hideLabel?: boolean;
  showIndicator?: boolean;
  indicatorLayoutId?: string;
  indicatorTransition?: Transition;
  children?: React.ReactNode;
}

const navVariantClasses: Record<TabsVariant, string> = {
  default: '',
  underline: 'tabs-nav--underline',
  pills: '',
  glass: 'tabs-nav--glass',
};

export const TabsNav = React.forwardRef<HTMLDivElement, TabsNavProps>(
  ({ className = '', variant = 'default', centered, fullWidth, orientation = 'horizontal', ...props }, ref) => {
    const classes = [
      'tabs-nav',
      navVariantClasses[variant],
      centered && 'tabs-nav--centered',
      fullWidth && 'tabs-nav--full-width',
      orientation === 'vertical' && 'tabs-nav--vertical',
      className
    ].filter(Boolean).join(' ');

    return <div ref={ref} className={classes} {...props} />;
  }
);
TabsNav.displayName = 'TabsNav';

export const TabsNavLink = React.forwardRef<HTMLAnchorElement, TabsNavLinkProps>(
  ({ className = '', isActive, icon, badge, hideLabel, showIndicator, indicatorLayoutId, indicatorTransition, children, ...props }, ref) => {
    const shouldShowIndicator = showIndicator ?? isActive;
    const classes = [
      'tabs-nav__link',
      isActive && 'is-active',
      icon && 'tabs-nav__link--icon',
      className
    ].filter(Boolean).join(' ');

    return (
      <a
        ref={ref}
        className={classes}
        aria-current={isActive ? 'page' : undefined}
        {...props}
      >
        {shouldShowIndicator && indicatorLayoutId && (
          <motion.div
            className="tabs-nav__indicator"
            layoutId={indicatorLayoutId}
            initial={false}
            transition={indicatorTransition ?? {
              type: 'spring',
              stiffness: 500,
              damping: 35,
            }}
          />
        )}
        {icon && <span className="tabs-nav__icon tabs-nav__foreground">{icon}</span>}
        {children && !hideLabel && (
          <span className="tabs-nav__label tabs-nav__foreground">{children}</span>
        )}
        {badge !== undefined && badge !== null && (
          <Badge size="xs" variant="secondary" className="tabs__badge tabs-nav__foreground">{badge}</Badge>
        )}
      </a>
    );
  }
);
TabsNavLink.displayName = 'TabsNavLink';

export const TabsTriggerLink = React.forwardRef<HTMLAnchorElement, TabsTriggerLinkProps>(
  ({
    href,
    className = '',
    isActive,
    icon,
    badge,
    hideLabel,
    showIndicator,
    indicatorLayoutId,
    indicatorTransition,
    children,
    ...props
  }, ref) => {
    const shouldShowIndicator = showIndicator ?? isActive;
    const classes = [
      'tabs-nav__link',
      isActive && 'is-active',
      icon && 'tabs-nav__link--icon',
      className
    ].filter(Boolean).join(' ');

    return (
      <Link
        ref={ref}
        href={href}
        className={classes}
        aria-current={isActive ? 'page' : undefined}
        {...props}
      >
        {shouldShowIndicator && indicatorLayoutId && (
          <motion.div
            className="tabs-nav__indicator"
            layoutId={indicatorLayoutId}
            initial={false}
            transition={indicatorTransition ?? {
              type: 'spring',
              stiffness: 500,
              damping: 35,
            }}
          />
        )}
        {icon && <span className="tabs-nav__icon tabs-nav__foreground">{icon}</span>}
        {children && !hideLabel && (
          <span className="tabs-nav__label tabs-nav__foreground">{children}</span>
        )}
        {badge !== undefined && badge !== null && (
          <Badge size="xs" variant="secondary" className="tabs__badge tabs-nav__foreground">{badge}</Badge>
        )}
      </Link>
    );
  }
);
TabsTriggerLink.displayName = 'TabsTriggerLink';

// --------------------------------------------------------------------------
// Tabs Header (Container for header content + nav)
// --------------------------------------------------------------------------

export interface TabsHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  topContent?: React.ReactNode;
  actions?: React.ReactNode;
  statusContent?: React.ReactNode;
  layout?: 'column' | 'row';
}

export const TabsHeader = React.forwardRef<HTMLDivElement, TabsHeaderProps>(
  ({ className = '', topContent, actions, statusContent, layout = 'column', children, ...props }, ref) => {
    const classes = [
      'tabs-header',
      layout === 'row' && 'tabs-header--row',
      className
    ].filter(Boolean).join(' ');

    if (layout === 'row') {
      return (
        <div ref={ref} className={classes} {...props}>
          <div className="tabs-header__main">
            <div className="tabs-header__left">
              {topContent}
            </div>
            <div className="tabs-header__center">
              {children}
            </div>
            <div className="tabs-header__right">
              {actions}
              {statusContent && (
                <div className="tabs-header__right-status">
                  {statusContent}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div ref={ref} className={classes} {...props}>
        {(topContent || actions) && (
          <div className="tabs-header__top">
            {topContent}
            {actions && (
              <div className="tabs-header__actions">{actions}</div>
            )}
          </div>
        )}
        {children}
      </div>
    );
  }
);
TabsHeader.displayName = 'TabsHeader';


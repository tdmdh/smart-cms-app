import { HTMLAttributes, forwardRef, ReactNode } from 'react';

export type CardVariant = 'default' | 'interactive' | 'flat' | 'bordered' | 'elevated' | 'transparent' | 'glass';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: CardVariant;
    children?: ReactNode;
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
    title?: string;
    subtitle?: string;
    action?: ReactNode;
    children?: ReactNode;
}

export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
}

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
}

const variantClasses: Record<CardVariant, string> = {
    default: 'card',
    interactive: 'card card--interactive',
    flat: 'card card--flat',
    bordered: 'card card--bordered',
    elevated: 'card card--elevated',
    transparent: 'card card--transparent',
    glass: 'card card--glass',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ variant = 'default', className = '', children, ...props }, ref) => {
        const classes = [variantClasses[variant], className].filter(Boolean).join(' ');

        return (
            <div ref={ref} className={classes} {...props}>
                {children}
            </div>
        );
    }
);
Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
    ({ title, subtitle, action, className = '', children, ...props }, ref) => {
        const classes = ['card__header', className].filter(Boolean).join(' ');

        if (children) {
            return (
                <div ref={ref} className={classes} {...props}>
                    {children}
                </div>
            );
        }

        return (
            <div ref={ref} className={classes} {...props}>
                <div>
                    {title && <h3 className="card__title">{title}</h3>}
                    {subtitle && <p className="card__subtitle">{subtitle}</p>}
                </div>
                {action}
            </div>
        );
    }
);
CardHeader.displayName = 'CardHeader';

export const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(
    ({ className = '', children, ...props }, ref) => {
        const classes = ['card__body', className].filter(Boolean).join(' ');

        return (
            <div ref={ref} className={classes} {...props}>
                {children}
            </div>
        );
    }
);
CardBody.displayName = 'CardBody';

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
    ({ className = '', children, ...props }, ref) => {
        const classes = ['card__footer', className].filter(Boolean).join(' ');

        return (
            <div ref={ref} className={classes} {...props}>
                {children}
            </div>
        );
    }
);
CardFooter.displayName = 'CardFooter';

export const CardActions = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className = '', children, ...props }, ref) => {
        const classes = ['card__actions', className].filter(Boolean).join(' ');

        return (
            <div ref={ref} className={classes} {...props}>
                {children}
            </div>
        );
    }
);
CardActions.displayName = 'CardActions';

export default Card;

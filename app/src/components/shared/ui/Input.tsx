import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef, ReactNode } from 'react';
import { Icon, IconName } from './Icon';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputState = 'default' | 'error' | 'success';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    size?: InputSize;
    state?: InputState;
    leftIcon?: IconName;
    rightIcon?: IconName;
    rightAction?: ReactNode;
    iconSize?: number;
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    state?: InputState;
    noResize?: boolean;
}

const sizeClasses: Record<InputSize, string> = {
    sm: 'input--sm',
    md: '',
    lg: 'input--lg',
};

const stateClasses: Record<InputState, string> = {
    default: '',
    error: 'input--error',
    success: 'input--success',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            size = 'md',
            state = 'default',
            leftIcon,
            rightIcon,
            rightAction,
            className = '',
            iconSize = 18,
            ...props
        },
        ref
    ) => {
        const hasWrapper = leftIcon || rightIcon || rightAction;

        const inputClasses = [
            'input',
            sizeClasses[size],
            stateClasses[state],
            leftIcon && 'input--icon-left',
            (rightIcon || rightAction) && 'input--icon-right',
            className,
        ]
            .filter(Boolean)
            .join(' ');

        const inputElement = <input ref={ref} className={inputClasses} {...props} />;

        if (!hasWrapper) {
            return inputElement;
        }

        return (
            <div className="input-wrapper">
                {leftIcon && (
                    <span className="input-wrapper__icon input-wrapper__icon--left">
                        <Icon name={leftIcon} size={iconSize} />
                    </span>
                )}
                {inputElement}
                {rightIcon && (
                    <Icon name={rightIcon} size={iconSize} className='input-wrapper__icon input-wrapper__icon--right' />
                )}
                {rightAction && <span className="input-wrapper__action">{rightAction}</span>}
            </div>
        );
    }
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ state = 'default', noResize = false, className = '', ...props }, ref) => {
        const classes = [
            'textarea',
            stateClasses[state],
            noResize && 'textarea--no-resize',
            className,
        ]
            .filter(Boolean)
            .join(' ');

        return <textarea ref={ref} className={classes} {...props} />;
    }
);
Textarea.displayName = 'Textarea';

export default Input;

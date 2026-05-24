'use client';
import {
    FormHTMLAttributes,
    HTMLAttributes,
    LabelHTMLAttributes,
    InputHTMLAttributes,
    TextareaHTMLAttributes,
    forwardRef,
    ReactNode,
    createContext,
    useContext,
    useId,
} from 'react';
import { Input, Textarea, type InputSize } from './Input';
import { Icon, IconName } from './Icon';

export interface FormProps extends FormHTMLAttributes<HTMLFormElement> {
    children?: ReactNode;
}

export interface FormGroupProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
}

export interface FormLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
    required?: boolean;
    children?: ReactNode;
}

export interface FormHintProps extends HTMLAttributes<HTMLParagraphElement> {
    children?: ReactNode;
}

export interface FormErrorProps extends HTMLAttributes<HTMLParagraphElement> {
    icon?: ReactNode;
    children?: ReactNode;
}

export interface FormRowProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
}

export interface FormActionsProps extends HTMLAttributes<HTMLDivElement> {
    align?: 'start' | 'center' | 'end' | 'between';
    children?: ReactNode;
}

export interface FormControlProps extends HTMLAttributes<HTMLDivElement> {
    label?: string;
    hint?: string;
    error?: string;
    required?: boolean;
    children?: ReactNode;
}

export interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string;
    hint?: string;
    error?: string;
    required?: boolean;
    size?: InputSize;
    leftIcon?: IconName;
    rightIcon?: IconName;
    rightAction?: ReactNode;
    iconSize?: number;
}

export interface FormInputDuoProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    top: FormInputProps;
    bottom: FormInputProps;
}

export interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    hint?: string;
    error?: string;
    required?: boolean;
    noResize?: boolean;
}

interface FormControlContextValue {
    id: string;
    error?: string;
    required?: boolean;
}

const FormControlContext = createContext<FormControlContextValue | null>(null);

export const useFormControl = () => useContext(FormControlContext);

export const Form = forwardRef<HTMLFormElement, FormProps>(
    ({ className = '', children, ...props }, ref) => {
        return (
            <form ref={ref} className={className} {...props}>
                {children}
            </form>
        );
    }
);
Form.displayName = 'Form';

export const FormGroup = forwardRef<HTMLDivElement, FormGroupProps>(
    ({ className = '', children, ...props }, ref) => {
        const classes = ['form-group', className].filter(Boolean).join(' ');

        return (
            <div ref={ref} className={classes} {...props}>
                {children}
            </div>
        );
    }
);
FormGroup.displayName = 'FormGroup';

export const FormLabel = forwardRef<HTMLLabelElement, FormLabelProps>(
    ({ required = false, className = '', children, ...props }, ref) => {
        const classes = [
            'form-label',
            required && 'form-label--required',
            className,
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <label ref={ref} className={classes} {...props}>
                {children}
            </label>
        );
    }
);
FormLabel.displayName = 'FormLabel';

export const FormHint = forwardRef<HTMLParagraphElement, FormHintProps>(
    ({ className = '', children, ...props }, ref) => {
        const classes = ['form-hint', className].filter(Boolean).join(' ');

        return (
            <p ref={ref} className={classes} {...props}>
                {children}
            </p>
        );
    }
);
FormHint.displayName = 'FormHint';

export const FormError = forwardRef<HTMLParagraphElement, FormErrorProps>(
    ({ icon, className = '', children, ...props }, ref) => {
        const classes = ['form-error', className].filter(Boolean).join(' ');

        if (!children) return null;

        return (
            <p ref={ref} className={classes} {...props}>
                {icon}
                {children}
            </p>
        );
    }
);
FormError.displayName = 'FormError';

export const FormRow = forwardRef<HTMLDivElement, FormRowProps>(
    ({ className = '', children, ...props }, ref) => {
        const classes = ['form-row', className].filter(Boolean).join(' ');

        return (
            <div ref={ref} className={classes} {...props}>
                {children}
            </div>
        );
    }
);
FormRow.displayName = 'FormRow';

const alignClasses: Record<string, string> = {
    start: '',
    center: '',
    end: 'form-actions--end',
    between: 'form-actions--between',
};

export const FormActions = forwardRef<HTMLDivElement, FormActionsProps>(
    ({ align = 'end', className = '', children, ...props }, ref) => {
        const classes = [
            'form-actions',
            alignClasses[align],
            className,
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <div ref={ref} className={classes} {...props}>
                {children}
            </div>
        );
    }
);
FormActions.displayName = 'FormActions';

export const FormControl = forwardRef<HTMLDivElement, FormControlProps>(
    ({ label, hint, error, required = false, className = '', children, ...props }, ref) => {
        const id = useId();
        const classes = ['form-group', className].filter(Boolean).join(' ');

        return (
            <FormControlContext.Provider value={{ id, error, required }}>
                <div ref={ref} className={classes} {...props}>
                    {label && (
                        <FormLabel htmlFor={id} required={required}>
                            {label}
                        </FormLabel>
                    )}
                    {children}
                    {hint && !error && <FormHint>{hint}</FormHint>}
                    {error && <FormError>{error}</FormError>}
                </div>
            </FormControlContext.Provider>
        );
    }
);
FormControl.displayName = 'FormControl';

export const FormInputDuo = forwardRef<HTMLDivElement, FormInputDuoProps>(
    ({ top, bottom, className = '', ...props }, ref) => {
        const generatedId = useId();
        const topId = top.id || `${generatedId}-top`;
        const bottomId = bottom.id || `${generatedId}-bottom`;
        const classes = ['form-group', className].filter(Boolean).join(' ');

        const renderField = (
            field: FormInputProps,
            fieldId: string,
            inputClassName: string
        ) => {
            const {
                label,
                hint,
                error,
                required = false,
                size = 'md',
                leftIcon,
                rightIcon,
                rightAction,
                className: fieldClassName = '',
                id: _unusedId,
                ...inputProps
            } = field;
            const state = error ? 'error' : 'default';
            const inputClasses = [inputClassName, fieldClassName]
                .filter(Boolean)
                .join(' ');

            return (
                <>
                {hint && !error && <FormHint id={`${fieldId}-hint`}>{hint}</FormHint>}
                {error && <FormError id={`${fieldId}-error`}>{error}</FormError>}
                    {label && (
                        <FormLabel htmlFor={fieldId} required={required}>
                            {label}
                        </FormLabel>
                    )}
                    <Input
                        id={fieldId}
                        size={size}
                        state={state}
                        leftIcon={leftIcon}
                        rightIcon={rightIcon}
                        rightAction={rightAction}
                        className={inputClasses}
                        aria-invalid={!!error}
                        aria-describedby={
                            error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined
                        }
                        {...inputProps}
                    />
                </>
            );
        };

        return (
            <div ref={ref} className={classes} {...props}>
                <div className="duoForm_input">
                    {renderField(top, topId, 'duoForm_input--top-input')}
                    {renderField(bottom, bottomId, 'duoForm_input--bottom-input')}
                </div>
            </div>
        );
    }
);
FormInputDuo.displayName = 'FormInputDuo';

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
    (
        {
            label,
            hint,
            error,
            required = false,
            size = 'md',
            leftIcon,
            rightIcon,
            rightAction,
            className = '',
            id: providedId,
            ...props
        },
        ref
    ) => {
        const generatedId = useId();
        const id = providedId || generatedId;
        const state = error ? 'error' : 'default';

        return (
            <div className="form-group">
                {label && (
                    <FormLabel htmlFor={id} required={required}>
                        {label}
                    </FormLabel>
                )}
                <Input
                    ref={ref}
                    id={id}
                    size={size}
                    state={state}
                    leftIcon={leftIcon}
                    rightIcon={rightIcon}
                    rightAction={rightAction}
                    className={className}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
                    {...props}
                />
                {hint && !error && <FormHint id={`${id}-hint`}>{hint}</FormHint>}
                {error && <FormError id={`${id}-error`}>{error}</FormError>}
            </div>
        );
    }
);
FormInput.displayName = 'FormInput';

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
    (
        {
            label,
            hint,
            error,
            required = false,
            noResize = false,
            className = '',
            id: providedId,
            ...props
        },
        ref
    ) => {
        const generatedId = useId();
        const id = providedId || generatedId;
        const state = error ? 'error' : 'default';

        return (
            <div className="form-group">
                {label && (
                    <FormLabel htmlFor={id} required={required}>
                        {label}
                    </FormLabel>
                )}
                <Textarea
                    ref={ref}
                    id={id}
                    state={state}
                    noResize={noResize}
                    className={className}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
                    {...props}
                />
                {hint && !error && <FormHint id={`${id}-hint`}>{hint}</FormHint>}
                {error && <FormError id={`${id}-error`}>{error}</FormError>}
            </div>
        );
    }
);
FormTextarea.displayName = 'FormTextarea';

export default Form;


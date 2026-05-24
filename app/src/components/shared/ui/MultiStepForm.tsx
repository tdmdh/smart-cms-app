'use client';

import { ReactNode, useState, useCallback, Children, isValidElement, cloneElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';

export interface StepConfig {
    id: string;
    title: string;
    subtitle?: string;
    icon?: ReactNode;
}

export interface StepProps {
    isActive?: boolean;
    onNext?: () => void;
    onPrev?: () => void;
}

export interface MultiStepFormProps {
    steps: StepConfig[];
    currentStep?: number;
    onStepChange?: (step: number) => void;
    onComplete?: () => void;
    showProgress?: boolean;
    showDots?: boolean;
    showTitles?: boolean;
    children: ReactNode;
    submitLabel?: string;
    nextLabel?: string;
    prevLabel?: string;
    isSubmitting?: boolean;
    validateStep?: (stepIndex: number) => boolean;
}

const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 80 : -80,
        opacity: 0,
        scale: 0.95,
    }),
    center: {
        x: 0,
        opacity: 1,
        scale: 1,
    },
    exit: (direction: number) => ({
        x: direction > 0 ? -80 : 80,
        opacity: 0,
        scale: 0.95,
    }),
};

export function MultiStepForm({
    steps,
    currentStep: controlledStep,
    onStepChange,
    onComplete,
    showProgress = true,
    showDots = true,
    showTitles = false,
    children,
    submitLabel = 'Submit',
    nextLabel = 'Next',
    prevLabel = 'Back',
    isSubmitting = false,
    validateStep,
}: MultiStepFormProps) {
    const [internalStep, setInternalStep] = useState(0);
    const [direction, setDirection] = useState(1);

    const currentStep = controlledStep ?? internalStep;
    const totalSteps = steps.length;
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === totalSteps - 1;
    const progress = ((currentStep + 1) / totalSteps) * 100;

    const goToStep = useCallback((step: number, dir: 1 | -1) => {
        if (step < 0 || step >= totalSteps) return;

        setDirection(dir);
        if (onStepChange) {
            onStepChange(step);
        } else {
            setInternalStep(step);
        }
    }, [totalSteps, onStepChange]);

    const handleNext = useCallback(() => {
        if (validateStep && !validateStep(currentStep)) {
            return;
        }

        if (isLastStep) {
            onComplete?.();
        } else {
            goToStep(currentStep + 1, 1);
        }
    }, [currentStep, isLastStep, validateStep, goToStep, onComplete]);

    const handlePrev = useCallback(() => {
        if (!isFirstStep) {
            goToStep(currentStep - 1, -1);
        }
    }, [currentStep, isFirstStep, goToStep]);

    const stepChildren = Children.toArray(children).filter(isValidElement);
    const currentChild = stepChildren[currentStep];

    return (
        <div className="multi-step">
            <div className="multi-step__header">
                {/* {showDots && (
                    <div className="multi-step__indicator">
                        {steps.map((step, index) => (
                            <motion.div
                                key={step.id}
                                className={[
                                    'multi-step__dot',
                                    index === currentStep && 'multi-step__dot--active',
                                    index < currentStep && 'multi-step__dot--completed',
                                ].filter(Boolean).join(' ')}
                                animate={{
                                    scale: index === currentStep ? 1.2 : 1,
                                }}
                                transition={{ duration: 0.2 }}
                            />
                        ))}
                    </div>
                )}

                {showProgress && (
                    <div className="multi-step__progress">
                        <motion.div
                            className="multi-step__progress-bar"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                        />
                    </div>
                )} */}

                {showTitles && (
                    <div className="multi-step__titles">
                        {steps.map((step, index) => (
                            <span
                                key={step.id}
                                className={[
                                    'multi-step__step-title',
                                    index === currentStep && 'multi-step__step-title--active',
                                    index < currentStep && 'multi-step__step-title--completed',
                                ].filter(Boolean).join(' ')}
                            >
                                {step.title}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="multi-step__content">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={currentStep}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: 'spring', stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 },
                        }}
                        className="multi-step__step"
                    >
                        {currentChild && isValidElement(currentChild)
                            ? cloneElement(currentChild as React.ReactElement<StepProps>, {
                                isActive: true,
                                onNext: handleNext,
                                onPrev: handlePrev,
                            })
                            : currentChild
                        }
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className={`multi-step__nav ${isFirstStep ? 'multi-step__nav--end' : ''}`}>
                {!isFirstStep && (
                    <Button
                        variant="ghost"
                        onClick={handlePrev}
                        leftIcon="chevron-left"
                    >
                        {prevLabel}
                    </Button>
                )}
                <Button
                    onClick={handleNext}
                    loading={isLastStep && isSubmitting}
                    rightIcon={!isLastStep ? "chevron-right" : undefined}
                >
                    {isLastStep ? submitLabel : nextLabel}
                </Button>
            </div>
        </div>
    );
}

export default MultiStepForm;

'use client';

import { memo, useEffect, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from './Button';

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    titleIcon?: ReactNode;
    children: ReactNode;
    size?: 'sm' | 'default' | 'lg' | 'xl' | 'full';
    showCloseButton?: boolean;
    closeOnOverlayClick?: boolean;
    closeOnEscape?: boolean;
}

const sizeClasses: Record<string, string> = {
    sm: 'modal--sm',
    default: '',
    lg: 'modal--lg',
    xl: 'modal--xl',
    full: 'modal--full',
};

function ModalComponent({
    isOpen,
    onClose,
    title,
    titleIcon,
    children,
    size = 'default',
    showCloseButton = true,
    closeOnOverlayClick = true,
    closeOnEscape = true,
}: ModalProps) {
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape' && closeOnEscape) {
                onClose();
            }
        },
        [onClose, closeOnEscape]
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, handleKeyDown]);

    const handleOverlayClick = () => {
        if (closeOnOverlayClick) {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="modal-overlay is-open"
                    onClick={handleOverlayClick}
                >
                    <motion.div
                        className={`modal ${sizeClasses[size]}`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {(title || showCloseButton) && (
                            <div className="modal__header">
                                {title && (
                                    <h3 className="modal__title">
                                        {titleIcon}
                                        {title}
                                    </h3>
                                )}
                                {showCloseButton && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={onClose}
                                        aria-label="Close"
                                        iconOnly
                                    >
                                        <X size={18} />
                                    </Button>
                                )}
                            </div>
                        )}
                        {children}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

export function ModalBody({ children, className = '' }: { children: ReactNode; className?: string }) {
    return <div className={`modal__body ${className}`}>{children}</div>;
}

export function ModalFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
    return <div className={`modal__footer ${className}`}>{children}</div>;
}

export const Modal = memo(ModalComponent);

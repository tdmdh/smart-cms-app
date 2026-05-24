'use client';

import * as React from 'react';
import { useRef, useState, useEffect, useCallback } from 'react';
import { CheckIcon, ChevronDownIcon, X } from 'lucide-react';
import { Icon } from './Icon';

export interface MultiSelectOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
}

export interface MultiSelectProps {
    value: string[];
    onValueChange: (value: string[]) => void;
    options: MultiSelectOption[];
    placeholder?: string;
    disabled?: boolean;
    maxDisplayItems?: number;
    className?: string;
    renderOption?: (option: MultiSelectOption, isSelected: boolean) => React.ReactNode;
    renderSelected?: (selectedOptions: MultiSelectOption[]) => React.ReactNode;
}

function MultiSelect({
    value,
    onValueChange,
    options,
    placeholder = 'Select...',
    disabled = false,
    maxDisplayItems = 3,
    className,
    renderOption,
    renderSelected,
}: MultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    const selectedOptions = options.filter(opt => value.includes(opt.value));

    const toggleOption = useCallback((optionValue: string) => {
        const isSelected = value.includes(optionValue);
        if (isSelected) {
            onValueChange(value.filter(v => v !== optionValue));
        } else {
            onValueChange([...value, optionValue]);
        }
    }, [value, onValueChange]);

    const removeOption = useCallback((optionValue: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onValueChange(value.filter(v => v !== optionValue));
    }, [value, onValueChange]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
            triggerRef.current?.focus();
        } else if (e.key === 'Enter' || e.key === ' ') {
            if (!isOpen) {
                e.preventDefault();
                setIsOpen(true);
            }
        }
    }, [isOpen]);

    const containerClasses = [
        'multi-select',
        disabled && 'multi-select--disabled',
        isOpen && 'multi-select--open',
        className,
    ].filter(Boolean).join(' ');

    const defaultSelectedDisplay = () => {
        if (selectedOptions.length === 0) {
            return <span className="multi-select__placeholder">{placeholder}</span>;
        }

        const displayItems = selectedOptions.slice(0, maxDisplayItems);
        const remainingCount = selectedOptions.length - maxDisplayItems;

        return (
            <div className="multi-select__selected">
                {displayItems.map(opt => (
                    <span key={opt.value} className="multi-select__tag">
                        {opt.icon}
                        <span className="multi-select__tag-label">{opt.label}</span>
                        <button
                            type="button"
                            className="multi-select__tag-remove"
                            onClick={(e) => removeOption(opt.value, e)}
                            aria-label={`Remove ${opt.label}`}
                        >
                            <X size={12} />
                        </button>
                    </span>
                ))}
                {remainingCount > 0 && (
                    <span className="multi-select__more">+{remainingCount}</span>
                )}
            </div>
        );
    };

    const defaultOptionRenderer = (option: MultiSelectOption, isSelected: boolean) => (
        <>
            {option.icon && <span className="multi-select__option-icon">{option.icon}</span>}
            <span className="multi-select__option-label">{option.label}</span>
            {isSelected && (
                <span className="multi-select__option-check">
                    <CheckIcon size={16} />
                </span>
            )}
        </>
    );

    return (
        <div
            ref={containerRef}
            className={containerClasses}
            onKeyDown={handleKeyDown}
            data-slot="multi-select"
        >
            <button
                ref={triggerRef}
                type="button"
                className="multi-select__trigger"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                {renderSelected
                    ? renderSelected(selectedOptions)
                    : defaultSelectedDisplay()
                }
                <Icon name="chevron-down" size={16} className="multi-select__chevron" />
            </button>

            {isOpen && (
                <div className="multi-select__content" role="listbox" aria-multiselectable="true">
                    {options.length === 0 ? (
                        <div className="multi-select__empty">No options available</div>
                    ) : (
                        options.map(option => {
                            const isSelected = value.includes(option.value);
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    role="option"
                                    aria-selected={isSelected}
                                    className={`multi-select__option ${isSelected ? 'multi-select__option--selected' : ''}`}
                                    onClick={() => toggleOption(option.value)}
                                >
                                    {renderOption
                                        ? renderOption(option, isSelected)
                                        : defaultOptionRenderer(option, isSelected)
                                    }
                                </button>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}

export { MultiSelect };

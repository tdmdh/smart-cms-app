'use client';

import { useCallback, useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Button, Icon } from '@/src/components/shared/ui';

export interface UploadZoneProps {
    /** Callback when files are dropped or selected */
    onFilesSelected: (files: File[]) => void;
    /** Accepted file types (e.g., 'image/*,application/pdf') */
    accept?: string;
    /** Allow multiple file selection */
    multiple?: boolean;
    /** Maximum file size in bytes */
    maxSize?: number;
    /** Whether the zone is disabled */
    disabled?: boolean;
    /** Custom className */
    className?: string;
    /** Compact mode for inline use */
    compact?: boolean;
}

export function UploadZone({
    onFilesSelected,
    accept = '*',
    multiple = true,
    maxSize = 100 * 1024 * 1024, // 100MB default
    disabled = false,
    className = '',
    compact = false,
}: UploadZoneProps) {
    const [isDragActive, setIsDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const validateFiles = useCallback(
        (files: File[]): File[] => {
            const validFiles: File[] = [];
            const errors: string[] = [];

            files.forEach((file) => {
                if (maxSize && file.size > maxSize) {
                    errors.push(`${file.name} exceeds ${formatBytes(maxSize)} limit`);
                    return;
                }
                validFiles.push(file);
            });

            if (errors.length > 0) {
                setError(errors.join(', '));
                setTimeout(() => setError(null), 5000);
            }

            return validFiles;
        },
        [maxSize]
    );

    const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
            setIsDragActive(true);
        }
    }, [disabled]);

    const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
    }, []);

    const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback(
        (e: DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragActive(false);

            if (disabled) return;

            const { files } = e.dataTransfer;
            if (files && files.length > 0) {
                const fileArray = Array.from(files);
                const validFiles = validateFiles(multiple ? fileArray : [fileArray[0]]);
                if (validFiles.length > 0) {
                    onFilesSelected(validFiles);
                }
            }
        },
        [disabled, multiple, onFilesSelected, validateFiles]
    );

    const handleFileInput = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            const { files } = e.target;
            if (files && files.length > 0) {
                const validFiles = validateFiles(Array.from(files));
                if (validFiles.length > 0) {
                    onFilesSelected(validFiles);
                }
            }
            // Reset input so same file can be selected again
            e.target.value = '';
        },
        [onFilesSelected, validateFiles]
    );

    const handleClick = useCallback(() => {
        if (!disabled) {
            inputRef.current?.click();
        }
    }, [disabled]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick();
            }
        },
        [handleClick]
    );

    const zoneClasses = [
        'upload-zone',
        isDragActive && 'upload-zone--active',
        disabled && 'upload-zone--disabled',
        compact && 'upload-zone--compact',
        error && 'upload-zone--error',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div
            className={zoneClasses}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-disabled={disabled}
            aria-label="Upload files"
        >
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                multiple={multiple}
                onChange={handleFileInput}
                className="upload-zone__input"
                disabled={disabled}
                aria-hidden="true"
            />

            <div className="upload-zone__content">

                {!compact && (
                    <>
                        <p className="upload-zone__title">
                            {/* {isDragActive ? 'Drop files here' : 'Drag & drop files here'} */}
                        </p>
                        <p className="upload-zone__subtitle">
                            <Button variant="outline">browse</Button>
                        </p>
                        {/* {maxSize && (
                            <p className="upload-zone__hint">Max file size: {formatBytes(maxSize)}</p>
                        )} */}
                    </>
                )}

                {compact && (
                    <span className="upload-zone__compact-text">
                        {isDragActive ? 'Drop here' : 'Upload'}
                    </span>
                )}
            </div>

            {error && <p className="upload-zone__error">{error}</p>}
        </div>
    );
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default UploadZone;

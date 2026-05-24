'use client';

import { useState } from 'react';
import type { KanbanColumn } from '@/src/api/project/config';
import {
    Button,
    Form,
    FormActions,
    FormGroup,
    FormInput,
    FormLabel,
    FormTextarea,
    Icon,
    Modal,
    ModalBody,
    ModalFooter,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/src/components/shared/ui';

// ============================================================================
// Color Palette (sourced from _variables.scss)
// ============================================================================
const COLOR_PALETTE: { label: string; value: string }[] = [
    { label: 'Slate',       value: '#64748b' },
    { label: 'Cerulean',    value: '#4a7fb0' },
    { label: 'Amber',       value: '#f59e0b' },
    { label: 'Emerald',     value: '#10b981' },
    { label: 'Red',         value: '#ef4444' },
    { label: 'Yale Blue',   value: '#134074' },
    { label: 'Steel Blue',  value: '#1a5490' },
    { label: 'Gold',        value: '#d4af37' },
    { label: 'Crimson',     value: '#8b1e2d' },
    { label: 'Ice Blue',    value: '#8da9c4' },
    { label: 'Oxford Navy', value: '#13315c' },
    { label: 'Warning',     value: '#d97706' },
    { label: 'Info Dark',   value: '#1a5490' },
    { label: 'Success',     value: '#059669' },
    { label: 'Error Dark',  value: '#dc2626' },
    { label: 'Gray 500',    value: '#64748b' },
];

// ============================================================================
// Types
// ============================================================================
interface KanbanColumnModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { name: string; description: string; color: string; category: string }) => void;
    column?: KanbanColumn | null;
    isLoading?: boolean;
    /** Whether to show the delete confirmation mode instead of edit mode */
    isDeleteConfirm?: boolean;
    onDelete?: () => void;
}

type KanbanColumnFormData = {
    name: string;
    description: string;
    color: string;
    category: 'todo' | 'in_progress' | 'done';
};

function getInitialFormData(column?: KanbanColumn | null): KanbanColumnFormData {
    if (!column) {
        return {
            name: '',
            description: '',
            color: COLOR_PALETTE[0].value,
            category: 'todo',
        };
    }

    return {
        name: column.name,
        description: column.description ?? '',
        color: column.color,
        category: column.category || 'todo',
    };
}

interface ColumnFormProps {
    column?: KanbanColumn | null;
    isLoading?: boolean;
    onClose: () => void;
    onSubmit: (data: { name: string; description: string; color: string; category: string }) => void;
}

function ColumnForm({ column, isLoading, onClose, onSubmit }: ColumnFormProps) {
    const [formData, setFormData] = useState<KanbanColumnFormData>(() => getInitialFormData(column));
    const isEdit = !!column;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const name = formData.name.trim();
        if (!name) return;
        onSubmit({ name, description: formData.description.trim(), color: formData.color, category: formData.category });
    };

    return (
        <Form  onSubmit={handleSubmit}>
            <ModalBody>
                <div className="kanban-modal__header">
                    <div
                        className="kanban-modal__color-swatch"
                        style={{ backgroundColor: formData.color }}
                    />
                    <div>
                        <h3 className="kanban-modal__title">
                            {isEdit ? 'Edit Column' : 'New Kanban Column'}
                        </h3>
                        <p className="kanban-modal__subtitle">
                            {isEdit ? 'Update column details' : 'Add a custom column to your board'}
                        </p>
                    </div>
                </div>

                <FormGroup>
                    <FormLabel htmlFor="col-name" required>
                        Column Name
                    </FormLabel>
                    <FormInput
                        id="col-name"
                        type="text"
                        placeholder="e.g. QA Testing, Awaiting Feedback..."
                        value={formData.name}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                name: e.target.value,
                            }))
                        }
                        maxLength={100}
                        required
                        autoFocus
                    />
                </FormGroup>

                <FormGroup>
                    <FormLabel htmlFor="col-desc">
                        Description <span className="kanban-modal__optional">(optional)</span>
                    </FormLabel>
                    <FormTextarea
                        id="col-desc"
                        placeholder="Briefly describe the purpose of this column..."
                        value={formData.description}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                description: e.target.value,
                            }))
                        }
                        rows={2}
                    />
                </FormGroup>

                <FormGroup>
                    <FormLabel htmlFor="col-category" required>
                        Column Category (Progress State)
                    </FormLabel>
                    <Select
                        value={formData.category}
                        onValueChange={(value) =>
                            setFormData((prev) => ({
                                ...prev,
                                category: value as 'todo' | 'in_progress' | 'done',
                            }))
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todo">To Do (Not Started)</SelectItem>
                            <SelectItem value="in_progress">In Progress / Blocked</SelectItem>
                            <SelectItem value="done">Done (Completed)</SelectItem>
                        </SelectContent>
                    </Select>
                </FormGroup>

                <FormGroup>
                    <FormLabel>Color</FormLabel>
                    <div className="kanban-modal__palette">
                        {COLOR_PALETTE.map((paletteColor) => {
                            const isSelected = formData.color === paletteColor.value;
                            return (
                                <button
                                    key={`${paletteColor.label}-${paletteColor.value}`}
                                    type="button"
                                    className={[
                                        'kanban-modal__swatch',
                                        isSelected ? 'kanban-modal__swatch--selected' : '',
                                    ]
                                        .filter(Boolean)
                                        .join(' ')}
                                    style={{ backgroundColor: paletteColor.value }}
                                    title={paletteColor.label}
                                    aria-label={`Select ${paletteColor.label}`}
                                    onClick={() =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            color: paletteColor.value,
                                        }))
                                    }
                                >
                                    {isSelected && <Icon name="check" size={12} />}
                                </button>
                            );
                        })}
                    </div>
                    <p className="kanban-modal__color-preview-label">
                        Selected:{' '}
                        <span style={{ color: formData.color }}>
                            {COLOR_PALETTE.find((c) => c.value === formData.color)?.label ?? formData.color}
                        </span>
                    </p>
                </FormGroup>
            </ModalBody>
            <ModalFooter>
                <FormActions align="end">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        loading={!!isLoading}
                        disabled={isLoading || !formData.name.trim()}
                        style={{ backgroundColor: formData.color }}
                    >
                        {isLoading
                            ? (isEdit ? 'Saving...' : 'Creating...')
                            : (isEdit ? 'Save Changes' : 'Create Column')}
                    </Button>
                </FormActions>
            </ModalFooter>
        </Form>
    );
}

// ============================================================================
// Component
// ============================================================================
export default function KanbanColumnModal({
    isOpen,
    onClose,
    onSubmit,
    column,
    isLoading,
    isDeleteConfirm,
    onDelete,
}: KanbanColumnModalProps) {
    if (isDeleteConfirm) {
        return (
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title="Delete Column"
                titleIcon={<Icon name="warning" size={18} />}
                size="sm"
            >
                <ModalBody className="kanban-modal__body">
                    <p className="kanban-modal__subtitle">This action cannot be undone</p>
                    <p className="kanban-modal__warning-text">
                        Are you sure you want to delete <strong>&quot;{column?.name}&quot;</strong>?{' '}
                        <strong>All tasks in this column will also be permanently deleted.</strong>
                    </p>
                </ModalBody>
                <ModalFooter>
                    <FormActions align="end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="danger"
                            onClick={onDelete}
                            loading={!!isLoading}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Deleting...' : 'Delete Column & Tasks'}
                        </Button>
                    </FormActions>
                </ModalFooter>
            </Modal>
        );
    }

    const formKey = column?.id ?? 'new-column';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={column ? 'Edit Column' : 'New Kanban Column'} size="sm">
            <ColumnForm
                key={formKey}
                column={column}
                isLoading={isLoading}
                onClose={onClose}
                onSubmit={onSubmit}
            />
        </Modal>
    );
}

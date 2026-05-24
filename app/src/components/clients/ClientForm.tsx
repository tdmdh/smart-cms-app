'use client';

import { useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import { Building2 } from 'lucide-react';
import { useCreateClient, useUpdateClient } from '@/src/hooks/queries/client-management';
import { useWorkspacePath } from '@/src/hooks/useWorkspacePath';

interface ClientFormProps {
    client?: {
        id: string;
        name: string;
        primary_email?: string;
        primary_phone?: string;
        address?: string;
        notes?: string;
        logo?: string;
    };
    onSuccess?: () => void;
    onCancel?: () => void;
}

function ClientFormComponent({ client, onSuccess, onCancel }: ClientFormProps) {
    const router = useRouter();
    const workspacePath = useWorkspacePath();
    const isEditMode = !!client;

    const [formData, setFormData] = useState({
        name: client?.name || '',
        primary_email: client?.primary_email || '',
        primary_phone: client?.primary_phone || '',
        address: client?.address || '',
        notes: client?.notes || '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const createMutation = useCreateClient();
    const updateMutation = useUpdateClient();

    const isLoading = createMutation.isPending || updateMutation.isPending;

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Client name is required';
        }

        if (formData.primary_email && !formData.primary_email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            newErrors.primary_email = 'Please enter a valid email address';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        try {
            if (isEditMode && client) {
                await updateMutation.mutateAsync({
                    id: client.id,
                    data: formData,
                });
            } else {
                await createMutation.mutateAsync(formData);
            }

            onSuccess?.();
            router.push(workspacePath('clients'));
        } catch (error) {
            console.error('Failed to save client:', error);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    return (
        <form onSubmit={handleSubmit} className="client-form">
            <div className="client-form__header">
                <div className="client-form__icon">
                    <Building2 size={24} />
                </div>
                <h2 className="client-form__title">
                    {isEditMode ? 'Edit Client' : 'New Client'}
                </h2>
            </div>

            <div className="client-form__fields">
                <div className="form-group">
                    <label htmlFor="name" className="form-label">
                        Client Name <span className="required">*</span>
                    </label>
                    <input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className={`form-input ${errors.name ? 'form-input--error' : ''}`}
                        placeholder="Enter client name"
                    />
                    {errors.name && <span className="form-error">{errors.name}</span>}
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="primary_email" className="form-label">
                            Primary Email
                        </label>
                        <input
                            type="email"
                            id="primary_email"
                            value={formData.primary_email}
                            onChange={(e) => handleChange('primary_email', e.target.value)}
                            className={`form-input ${errors.primary_email ? 'form-input--error' : ''}`}
                            placeholder="contact@example.com"
                        />
                        {errors.primary_email && <span className="form-error">{errors.primary_email}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="primary_phone" className="form-label">
                            Primary Phone
                        </label>
                        <input
                            type="tel"
                            id="primary_phone"
                            value={formData.primary_phone}
                            onChange={(e) => handleChange('primary_phone', e.target.value)}
                            className="form-input"
                            placeholder="+1 (555) 123-4567"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="address" className="form-label">
                        Address
                    </label>
                    <input
                        type="text"
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        className="form-input"
                        placeholder="123 Main St, City, Country"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="notes" className="form-label">
                        Notes
                    </label>
                    <textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => handleChange('notes', e.target.value)}
                        className="form-textarea"
                        placeholder="Additional notes about the client..."
                        rows={3}
                    />
                </div>
            </div>

            <div className="client-form__actions">
                <button
                    type="button"
                    onClick={onCancel || (() => router.back())}
                    className="btn btn--ghost"
                    disabled={isLoading}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={isLoading}
                >
                    {isLoading ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Client'}
                </button>
            </div>
        </form>
    );
}

export const ClientForm = memo(ClientFormComponent);


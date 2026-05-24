'use client';

import { useState, useEffect } from 'react';
import { DocumentArchetype } from '@/src/api/knowledge/archetypes';
import { useCreateArchetype, useUpdateArchetype } from '@/src/hooks/queries/knowledge/archetypes';
import { FormInput, FormTextarea, FormActions, FormHint, FormError, Button } from '@/src/components/shared/ui';

interface ArchetypeFormPanelProps {
    projectId: string;
    editing?: DocumentArchetype | null;
    onDone: (createdId?: string) => void;
}

export default function ArchetypeFormPanel({ projectId, editing, onDone }: ArchetypeFormPanelProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');

    const create = useCreateArchetype(projectId);
    const update = useUpdateArchetype(projectId);
    const isPending = create.isPending || update.isPending;

    useEffect(() => {
        if (editing) {
            setName(editing.name);
            setDescription(editing.description);
        } else {
            setName('');
            setDescription('');
        }
        setError('');
    }, [editing]);

    const validate = () => {
        if (!name.trim()) return 'Name is required.';
        if (name.length > 80) return 'Name must be 80 characters or fewer.';
        if (!description.trim()) return 'Description is required.';
        if (description.length > 500) return 'Description must be 500 characters or fewer.';
        return '';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const msg = validate();
        if (msg) { setError(msg); return; }
        setError('');

        if (editing) {
            update.mutate(
                { id: editing.id, body: { name: name.trim(), description: description.trim() } },
                { onSuccess: () => onDone(), onError: (err) => setError(err.message) },
            );
        } else {
            create.mutate(
                { name: name.trim(), description: description.trim() },
                {
                    onSuccess: (created: DocumentArchetype) => onDone(created.id),
                    onError: (err) => setError(err.message),
                },
            );
        }
    };

    return (
        <form onSubmit={handleSubmit} noValidate>
            <FormInput
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                placeholder="e.g. Security Audit Log"
                disabled={isPending}
                required
                hint={`${name.length}/80`}
            />

            <FormTextarea
                label="Functional description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={4}
                placeholder="Capture all changes to authentication logic and credential storage"
                disabled={isPending}
                required
                hint={`${description.length}/500`}
            />

            {editing?.prompt_template && (
                <div className="form-group">
                    <p className="form-label">Current prompt template</p>
                    <pre className="archetype-prompt-preview">{editing.prompt_template}</pre>
                    <FormHint>Saving will regenerate the prompt template from your updated description.</FormHint>
                </div>
            )}

            <FormError>{error}</FormError>

            <FormActions>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onDone()}
                    disabled={isPending}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    loading={isPending}
                >
                    {editing ? 'Update' : 'Create'}
                </Button>
            </FormActions>
        </form>
    );
}

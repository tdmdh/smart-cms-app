'use client';

import { useState } from 'react';
import { LayoutGrid, AlertCircle } from 'lucide-react';
import { 
    Button, 
    FormGroup, 
    FormLabel, 
    FormControl, 
    FormInput 
} from '@/src/components/shared/ui';
import { useCreateWorkspace } from '@/src/hooks/queries/workspace-management';

interface CreateWorkspaceStepProps {
    onNext: () => void;
    onSkip: () => void;
}

export function CreateWorkspaceStep({ onNext }: CreateWorkspaceStepProps) {
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const createWorkspace = useCreateWorkspace();

    const handleCreate = async () => {
        if (!name.trim()) {
            setError('Workspace name is required');
            return;
        }

        setError(null);
        try {
            await createWorkspace.mutateAsync({ name: name.trim() });
            onNext();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Failed to create workspace'
            );
        }
    };

    return (
        <div className="onboarding-step">
            <div className="onboarding-step__icon">
                <LayoutGrid />
            </div>
            <h2 className="onboarding-step__heading">Create Workspace</h2>
            <p className="onboarding-step__description">
                Create a workspace to organize your projects, team members, and resources.
            </p>

            <div className="w-full text-left mb-6">
                <FormGroup>
                    <FormLabel>Workspace Name</FormLabel>
                    <FormControl>
                        <FormInput
                            placeholder="e.g. Acme Corp"
                            type="text"
                            name="name"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (error) setError(null);
                            }}
                            error={error ? undefined : undefined} // Handled block below
                        />
                    </FormControl>
                </FormGroup>
            </div>

            {error && (
                <div className="onboarding-step__error">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            <div className="onboarding-step__actions">
                <Button
                    fullWidth
                    onClick={handleCreate}
                    loading={createWorkspace.isPending}
                    variant="primary"
                >
                    Create Workspace
                </Button>
            </div>
        </div>
    );
}

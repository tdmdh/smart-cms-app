'use client';

import { useState } from 'react';
import { Brain } from 'lucide-react';
import { Button, FormGroup, FormLabel, FormTextarea } from '@/src/components/shared/ui';
import { useUpdateFluidScope } from '@/src/hooks/queries/cognitive-load';

interface FluidScopeStepProps {
    onNext: () => void;
    onSkip: () => void;
    workspaceId?: string;
}

export function FluidScopeStep({ onNext, onSkip, workspaceId }: FluidScopeStepProps) {
    const [body, setBody] = useState('');
    const [error, setError] = useState<string | null>(null);
    const updateFluidScope = useUpdateFluidScope();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            await updateFluidScope.mutateAsync({ workspaceId, body });
            onNext();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save your focus profile');
        }
    };

    return (
        <div className="onboarding-step">
            <div className="onboarding-step__icon">
                <Brain />
            </div>
            <h2 className="onboarding-step__heading">Define Your Focus Profile</h2>
            <p className="onboarding-step__description">
                Help the AI understand how you work best. Describe the kinds of tasks
                you find energizing or draining so assignments stay within your bandwidth.
            </p>

            <form onSubmit={handleSubmit}>
                <FormGroup className=' w-98' >
                    <FormLabel htmlFor="fluid-scope-body">Your mental bandwidth context</FormLabel>
                    <FormTextarea
                        id="fluid-scope-body"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="e.g. I work best on focused design tasks. Async communication and context switching drain me quickly."
                        rows={4}
                        
                    />
                </FormGroup>

                {error && (
                    <div className="onboarding-step__error">
                        <span>{error}</span>
                    </div>
                )}

                <div className="onboarding-step__actions">
                    <Button
                        type="submit"
                        fullWidth
                        disabled={!body.trim()}
                        loading={updateFluidScope.isPending}
                    >
                        Save &amp; Continue
                    </Button>
                    <Button fullWidth variant="ghost" type="button" onClick={onSkip}>
                        Skip for now
                    </Button>
                </div>
            </form>
        </div>
    );
}

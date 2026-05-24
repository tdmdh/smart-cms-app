'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { onboardingSteps } from '@/src/config/onboarding.config';
import { ConnectGitHubStep, CreateWorkspaceStep, FluidScopeStep } from '@/src/components/onboarding/steps';
import { routes } from '@/src/config/proxy.config';

// ==========================================================================
// Step component registry
// To add a new step:
//   1. Add its config to src/config/onboarding.config.ts
//   2. Create the component in src/components/onboarding/steps/
//   3. Export it from src/components/onboarding/steps/index.ts
//   4. Register it in this map using the config id as the key
// ==========================================================================
const stepComponents: Record<string, React.ComponentType<{ onNext: () => void; onSkip: () => void }>> = {
    'create-workspace': CreateWorkspaceStep,
    'connect-github': ConnectGitHubStep,
    'fluid-scope': FluidScopeStep,
};

export default function OnboardingPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);

    const totalSteps = onboardingSteps.length;
    const stepConfig = onboardingSteps[currentStep];
    const StepComponent = stepConfig ? stepComponents[stepConfig.id] : null;

    const advance = useCallback(() => {
        if (currentStep < totalSteps - 1) {
            setCurrentStep((s) => s + 1);
        } else {
            router.push(routes.afterLogin);
        }
    }, [currentStep, totalSteps, router]);

    // If there are no steps configured, skip straight to dashboard
    if (totalSteps === 0) {
        router.push(routes.afterLogin);
        return null;
    }

    // Guard against a step id that has no registered component
    if (!StepComponent) {
        advance();
        return null;
    }

    return (
        <div className="onboarding">
         

            <StepComponent onNext={advance} onSkip={advance} />
        </div>
    );
}

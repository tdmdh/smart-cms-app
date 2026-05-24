import type { StepConfig } from '@/src/components/shared/ui';

export { PersonalInfoStep } from './PersonalInfoStep';
export { AccountStep } from './AccountStep';

export const registerSteps: StepConfig[] = [
    {
        id: 'personal',
        title: 'Personal Info',
        subtitle: 'Tell us about yourself',
    },
    {
        id: 'account',
        title: 'Account',
        subtitle: 'Set up your credentials',
    },
    // Add more steps here in the future:
    // { id: 'preferences', title: 'Preferences', subtitle: 'Customize your experience' },
];

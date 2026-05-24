// ==========================================================================
// ONBOARDING CONFIGURATION
// ==========================================================================
// Add new post-verification onboarding steps here.
// Each step needs a matching component in:
// src/components/onboarding/steps/
// ==========================================================================

export interface OnboardingStepConfig {
    /** Unique identifier — used to map to a step component */
    id: string;
    title: string;
    subtitle: string;
    /** If true, a "Skip" button is shown for this step */
    skippable?: boolean;
}

export const onboardingSteps: OnboardingStepConfig[] = [
    {
        id: 'create-workspace',
        title: 'Create Your Workspace',
        subtitle: 'Create a workspace to organize your projects, team members, and resources.',
        skippable: false,
    },
    {
        id: 'connect-github',
        title: 'Connect GitHub',
        subtitle: 'Link your GitHub account to enable repository integrations',
        skippable: true,
    },
    {
        id: 'fluid-scope',
        title: 'Define Your Focus Profile',
        subtitle: 'Tell the AI how you work so task assignments respect your bandwidth',
        skippable: true,
    },
    // Future steps — add entries here and create the matching step component:
    // { id: 'invite-team', title: 'Invite Your Team', subtitle: 'Add members to your workspace', skippable: true },
    // { id: 'create-project', title: 'Create a Project', subtitle: 'Set up your first project', skippable: true },
];

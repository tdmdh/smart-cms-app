import type { ComponentType } from 'react';
import type { CreateDeploymentConfigRequest, DeploymentConfigItem } from '@/src/api/deployments/config';

// ─── Shared props interface for all provider config field components ──────────

export interface ProviderConfigFieldsProps {
    formData: CreateDeploymentConfigRequest;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSelectChange: (name: string, value: string) => void;
    existingConfig?: DeploymentConfigItem;
    isProviderConnected: boolean;
}

// ─── Provider definition ──────────────────────────────────────────────────────

export interface DeploymentProviderDef {
    slug: string;
    displayName: string;
    /** Slug used to look up the active connection in the integrations API */
    connectionSlug: string;
    /** Environment scopes available in env var management; empty = provider handles all internally */
    envOptions: string[];
    /** Whether to show build/install/output/node-version fields */
    showBuildSettings: boolean;
    /** Provider-specific config fields rendered inside the settings form; null = no extra fields */
    ConfigFields: ComponentType<ProviderConfigFieldsProps> | null;
}

// ─── Registry ────────────────────────────────────────────────────────────────
// To add a new provider: add one entry here and (optionally) a ConfigFields component.
// Nothing else needs to change in the form or env var manager.

// Dynamic imports avoid loading all provider UIs upfront while keeping the registry simple.
// Use React.lazy in ConfigFields consumers if bundle splitting is desired.
import CloudRunConfigFields from './CloudRunConfigFields';
import VercelConfigFields from './VercelConfigFields';

const PROVIDER_REGISTRY: Record<string, DeploymentProviderDef> = {
    vercel: {
        slug: 'vercel',
        displayName: 'Vercel',
        connectionSlug: 'vercel',
        envOptions: ['all', 'production', 'preview', 'development'],
        showBuildSettings: true,
        ConfigFields: VercelConfigFields,
    },
    cloudflare: {
        slug: 'cloudflare',
        displayName: 'Cloudflare Pages',
        connectionSlug: 'cloudflare',
        envOptions: ['all', 'production', 'preview'],
        showBuildSettings: true,
        ConfigFields: null,
    },
    gcp: {
        slug: 'gcp',
        displayName: 'Google Cloud Run',
        connectionSlug: 'gcp',
        envOptions: [],
        showBuildSettings: false,
        ConfigFields: CloudRunConfigFields,
    },
};

const DEFAULT_PROVIDER_DEF: DeploymentProviderDef = {
    slug: '',
    displayName: '',
    connectionSlug: '',
    envOptions: ['all', 'production', 'preview', 'development'],
    showBuildSettings: true,
    ConfigFields: null,
};

export function getProviderDef(providerSlug?: string | null): DeploymentProviderDef {
    if (!providerSlug) return DEFAULT_PROVIDER_DEF;
    return PROVIDER_REGISTRY[providerSlug.toLowerCase()] ?? DEFAULT_PROVIDER_DEF;
}

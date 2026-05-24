'use client';

import { getProviderDef } from './registry';
import type { ProviderConfigFieldsProps } from './registry';
import type { CreateDeploymentConfigRequest, DeploymentConfigItem } from '@/src/api/deployments/config';

interface ProviderConfigSectionProps {
    provider: string;
    formData: CreateDeploymentConfigRequest;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSelectChange: (name: string, value: string) => void;
    existingConfig?: DeploymentConfigItem;
    isProviderConnected: boolean;
}

export default function ProviderConfigSection({
    provider,
    ...fieldProps
}: ProviderConfigSectionProps) {
    const { ConfigFields } = getProviderDef(provider);
    if (!ConfigFields) return null;
    return <ConfigFields {...(fieldProps as ProviderConfigFieldsProps)} />;
}

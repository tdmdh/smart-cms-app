'use client';

import { Icon } from '../../shared/ui';
import type { ProviderConfigFieldsProps } from './registry';

export default function VercelConfigFields({ existingConfig }: ProviderConfigFieldsProps) {
    return (
        <div className="deploy-config__section">
            <div className="deploy-config__alert deploy-config__alert--info">
                <Icon name="info" size={14} />
                <span>
                    Vercel manages build settings automatically. These values act as
                    override hints and can be left blank.
                </span>
            </div>

            {existingConfig?.vercel_project_id && (
                <div className="deploy-config__alert deploy-config__alert--info">
                    <Icon name="check" size={14} />
                    <span>
                        Connected Vercel project: {existingConfig.vercel_project_id}
                        {existingConfig.vercel_team_id
                            ? ` (team: ${existingConfig.vercel_team_id})`
                            : ''}
                    </span>
                </div>
            )}
        </div>
    );
}

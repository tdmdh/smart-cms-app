'use client';

import {
    FormGroup,
    FormControl,
    FormInput,
    FormLabel,
    FormRow,
    Icon,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../shared/ui';
import { useGCPProjects } from '@/src/hooks/queries/integrations/useIntegrations';
import type { CreateDeploymentConfigRequest } from '@/src/api/deployments/config';

// ── Common Cloud Run regions ─────────────────────────────────────────────────

const CLOUD_RUN_REGIONS = [
    { value: 'us-central1', label: 'Iowa (us-central1)' },
    { value: 'us-east1', label: 'South Carolina (us-east1)' },
    { value: 'us-east4', label: 'N. Virginia (us-east4)' },
    { value: 'us-west1', label: 'Oregon (us-west1)' },
    { value: 'europe-west1', label: 'Belgium (europe-west1)' },
    { value: 'europe-west2', label: 'London (europe-west2)' },
    { value: 'europe-west4', label: 'Netherlands (europe-west4)' },
    { value: 'asia-east1', label: 'Taiwan (asia-east1)' },
    { value: 'asia-northeast1', label: 'Tokyo (asia-northeast1)' },
    { value: 'asia-southeast1', label: 'Singapore (asia-southeast1)' },
    { value: 'australia-southeast1', label: 'Sydney (australia-southeast1)' },
];

// ── Props ────────────────────────────────────────────────────────────────────

import type { ProviderConfigFieldsProps } from './registry';

// ── Component ────────────────────────────────────────────────────────────────

export default function CloudRunConfigFields({
    formData,
    onChange,
    onSelectChange,
    isProviderConnected,
}: ProviderConfigFieldsProps) {
    const { data: projectsData, isLoading: isLoadingProjects } = useGCPProjects(isProviderConnected);
    const isManual = formData.cloud_run_config_mode === 'manual';

    return (
        <div className="deploy-config__section">
            {/* <div className="deploy-config__divider-heading">
                <span>Cloud Run Configuration</span>
            </div> */}

            {/* ── Config Mode ──────────────────────────────────────── */}
            <FormGroup>
                <FormLabel required>Configuration Mode</FormLabel>
                <Select
                    value={formData.cloud_run_config_mode || 'default'}
                    onValueChange={(val) => onSelectChange('cloud_run_config_mode', val)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="default">
                            Default
                            <span className="deploy-config__select-hint">
                                Auto-configured resources
                            </span>
                        </SelectItem>
                        <SelectItem value="manual">
                            Manual
                            <span className="deploy-config__select-hint">
                                Full control over resources
                            </span>
                        </SelectItem>
                    </SelectContent>
                </Select>
            </FormGroup>

            {/* ── Project + Region ──────────────────────────────────── */}
            <FormRow>
                <FormGroup>
                    <FormLabel required>GCP Project</FormLabel>
                    {isProviderConnected ? (
                        <Select
                            value={formData.cloud_run_project_id || ''}
                            onValueChange={(val) => onSelectChange('cloud_run_project_id', val)}
                            disabled={isLoadingProjects}
                        >
                            <SelectTrigger>
                                <SelectValue
                                    placeholder={isLoadingProjects ? 'Loading projects…' : 'Select project'}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {projectsData?.projects?.length ? (
                                    projectsData.projects.map((p) => (
                                        <SelectItem key={p.project_id} value={p.project_id}>
                                            {p.project_id}
                                            <span className="deploy-config__select-hint">
                                                {p.name}
                                            </span>
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="_empty" disabled>
                                        {isLoadingProjects ? 'Loading...' : 'No projects found'}
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    ) : (
                        <FormControl>
                            <FormInput
                                name="cloud_run_project_id"
                                value={formData.cloud_run_project_id || ''}
                                onChange={onChange}
                                placeholder="my-gcp-project"
                                required
                            />
                        </FormControl>
                    )}
                </FormGroup>

                <FormGroup>
                    <FormLabel required>Region</FormLabel>
                    <Select
                        value={formData.cloud_run_region || ''}
                        onValueChange={(val) => onSelectChange('cloud_run_region', val)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                        <SelectContent>
                            {CLOUD_RUN_REGIONS.map((r) => (
                                <SelectItem key={r.value} value={r.value}>
                                    {r.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormGroup>
            </FormRow>



            {/* ── Artifact Registry Repo (always required) ─────────── */}
            <FormGroup>
                <FormLabel required>Artifact Registry Repository</FormLabel>
                <FormControl>
                    <FormInput
                        name="cloud_run_ar_repo"
                        value={formData.cloud_run_ar_repo || ''}
                        onChange={onChange}
                        placeholder="my-docker-repo"
                        required
                    />
                </FormControl>
            </FormGroup>

            <FormGroup>
                <FormLabel>Dockerfile Path</FormLabel>
                <FormControl>
                    <FormInput
                        name="cloud_run_dockerfile_path"
                        value={formData.cloud_run_dockerfile_path || ''}
                        onChange={onChange}
                        placeholder="apps/api/Dockerfile"
                    />
                </FormControl>
            </FormGroup>

            {/* ── Manual-mode fields ───────────────────────────────── */}
            {isManual && (
                <>
                    <FormGroup>
                        <FormLabel required>Service Name</FormLabel>
                        <FormControl>
                            <FormInput
                                name="cloud_run_service_name"
                                value={formData.cloud_run_service_name || ''}
                                onChange={onChange}
                                placeholder="my-service"
                                required
                            />
                        </FormControl>
                    </FormGroup>

                    <FormRow>
                        <FormGroup>
                            <FormLabel required>Port</FormLabel>
                            <FormControl>
                                <FormInput
                                    name="cloud_run_port"
                                    type="number"
                                    value={String(formData.cloud_run_port || '')}
                                    onChange={onChange}
                                    placeholder="8080"
                                    required
                                />
                            </FormControl>
                        </FormGroup>
                        <FormGroup>
                            <FormLabel required>CPU</FormLabel>
                            <FormControl>
                                <FormInput
                                    name="cloud_run_cpu"
                                    value={formData.cloud_run_cpu || ''}
                                    onChange={onChange}
                                    placeholder="1"
                                    required
                                />
                            </FormControl>
                        </FormGroup>
                    </FormRow>

                    <FormRow>
                        <FormGroup>
                            <FormLabel required>Memory</FormLabel>
                            <FormControl>
                                <FormInput
                                    name="cloud_run_memory"
                                    value={formData.cloud_run_memory || ''}
                                    onChange={onChange}
                                    placeholder="512Mi"
                                    required
                                />
                            </FormControl>
                        </FormGroup>
                        <FormGroup>
                            <FormLabel required>Max Instances</FormLabel>
                            <FormControl>
                                <FormInput
                                    name="cloud_run_max_instances"
                                    type="number"
                                    value={String(formData.cloud_run_max_instances || '')}
                                    onChange={onChange}
                                    placeholder="100"
                                    required
                                />
                            </FormControl>
                        </FormGroup>
                    </FormRow>

                    <FormGroup>
                        <FormLabel>Min Instances</FormLabel>
                        <FormControl>
                            <FormInput
                                name="cloud_run_min_instances"
                                type="number"
                                value={String(formData.cloud_run_min_instances || '')}
                                onChange={onChange}
                                placeholder="0 (scale to zero)"
                            />
                        </FormControl>
                    </FormGroup>
                </>
            )}

            {/* ── Default-mode info ────────────────────────────────── */}
            {!isManual && (
                <div className="deploy-config__alert deploy-config__alert--info">
                    <Icon name="info" size={14} />
                    <span>
                        Default mode auto-configures: Port 8080, 1 vCPU, 512Mi memory, up to 100 instances.
                        Service name is derived from your configuration name.
                    </span>
                </div>
            )}
        </div>
    );
}

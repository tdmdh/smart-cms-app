'use client';

import {
    FormGroup,
    FormLabel,
    FormControl,
    FormInput,
    FormRow,
    FormInputDuo,
} from '@/src/components/shared/ui';
import type { StepProps } from '@/src/components/shared/ui';
import type { ChangeEvent } from 'react';

interface PersonalInfoData {
    name?: string;
    last_name?: string;
}

interface PersonalInfoErrors {
    name?: string;
    last_name?: string;
}

interface PersonalInfoStepProps extends StepProps {
    data: PersonalInfoData;
    errors: PersonalInfoErrors;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function PersonalInfoStep({ data, errors, onChange }: PersonalInfoStepProps) {
    return (
        <div>
                {/* <FormGroup>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                        <FormInput
                            placeholder="John"
                            type="text"
                            name="name"
                            value={data.name || ''}
                            onChange={onChange}
                            error={errors.name}
                        />
                    </FormControl>
                </FormGroup>
                <FormGroup>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                        <FormInput
                            placeholder="Doe"
                            type="text"
                            name="last_name"
                            value={data.last_name || ''}
                            onChange={onChange}
                            error={errors.last_name}
                        />
                    </FormControl>
                </FormGroup> */}

                <FormGroup>
                    <FormControl>
                        <FormLabel>First Name & Last Name</FormLabel>
                        <FormInputDuo
                            top={{
                                placeholder: 'Rarest',
                                name: 'name',
                                value: data.name || '',
                                onChange: onChange,
                                error: errors.name
                            }}
                            bottom={{
                                placeholder: 'Flower',
                                name: 'last_name',
                                value: data.last_name || '',
                                onChange: onChange,
                                error: errors.last_name
                            }}
                        />
                    </FormControl>
                </FormGroup>
        </div>
    );
}

export default PersonalInfoStep;

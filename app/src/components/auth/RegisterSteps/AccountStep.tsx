'use client';

import {
    FormGroup,
    FormLabel,
    FormControl,
    FormInput,
} from '@/src/components/shared/ui';
import type { StepProps } from '@/src/components/shared/ui';
import type { ChangeEvent } from 'react';

interface AccountData {
    email: string;
    username: string;
    password: string;
}

interface AccountErrors {
    email?: string;
    username?: string;
    password?: string;
}

interface AccountStepProps extends StepProps {
    data: AccountData;
    errors: AccountErrors;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function AccountStep({ data, errors, onChange }: AccountStepProps) {
    return (
        <div>
            <FormGroup>
                <FormLabel>Email</FormLabel>
                <FormControl>
                    <FormInput
                        placeholder="you@example.com"
                        type="email"
                        name="email"
                        value={data.email}
                        onChange={onChange}
                        error={errors.email}
                    />
                </FormControl>
            </FormGroup>

            <FormGroup>
                <FormLabel>Username</FormLabel>
                <FormControl>
                    <FormInput
                        placeholder="johndoe"
                        type="text"
                        name="username"
                        value={data.username}
                        onChange={onChange}
                        error={errors.username}
                    />
                </FormControl>
            </FormGroup>

            <FormGroup>
                <FormLabel>Password</FormLabel>
                <FormControl>
                    <FormInput
                        placeholder="●●●●●●●●"
                        type="password"
                        name="password"
                        value={data.password}
                        onChange={onChange}
                        error={errors.password}
                    />
                </FormControl>
            </FormGroup>
        </div>
    );
}

export default AccountStep;

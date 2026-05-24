'use client';

import { useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Mail, User, Building2, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import {
    Button,
    FormGroup,
    FormLabel,
    FormControl,
    FormInput,
} from '@/src/components/shared/ui';
import { useValidateClientOnboardingToken, useRegisterClient } from '@/src/hooks/queries/client-management';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AccountData {
    name: string;
    last_name: string;
    username: string;
    password: string;
    confirm_password: string;
}

interface CompanyData {
    company_name: string;
    company_phone: string;
    company_address: string;
}

// ─── Step 1 — Invitation Confirmed ──────────────────────────────────────────

function WelcomeStep({ email, onNext }: { email: string; onNext: () => void }) {
    return (
        <div className="onboarding-step">
            <div className="onboarding-step__icon">
                <Mail size={24} />
            </div>
            <h2 className="onboarding-step__heading">You&apos;ve been invited</h2>
            <p className="onboarding-step__description">
                Your invitation is confirmed for <strong>{email}</strong>.
                Create your client account below to get started.
            </p>
            <div className="onboarding-step__actions">
                <Button fullWidth variant="primary" rightIcon="arrow-right" onClick={onNext}>
                    Get Started
                </Button>
            </div>
        </div>
    );
}

// ─── Step 2 — Account Details ────────────────────────────────────────────────

function AccountStep({
    data,
    onChange,
    onNext,
}: {
    data: AccountData;
    onChange: (d: AccountData) => void;
    onNext: () => void;
}) {
    const [errors, setErrors] = useState<Partial<AccountData>>({});

    const validate = () => {
        const e: Partial<AccountData> = {};
        if (!data.name.trim()) e.name = 'First name is required';
        if (!data.last_name.trim()) e.last_name = 'Last name is required';
        if (data.username.trim().length < 3) e.username = 'Username must be at least 3 characters';
        if (data.password.length < 8) e.password = 'Password must be at least 8 characters';
        if (data.password !== data.confirm_password) e.confirm_password = 'Passwords do not match';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const set = (field: keyof AccountData) => (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange({ ...data, [field]: e.target.value });
        setErrors(prev => ({ ...prev, [field]: '' }));
    };

    return (
        <div className="onboarding-step">
            <div className="onboarding-step__icon">
                <User size={24} />
            </div>
            <h2 className="onboarding-step__heading">Your account</h2>
            <p className="onboarding-step__description">Set up your login credentials.</p>

            <div className="w-full text-left">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <FormGroup>
                        <FormLabel required>First Name</FormLabel>
                        <FormControl>
                            <FormInput
                                name="name"
                                value={data.name}
                                onChange={set('name')}
                                placeholder="John"
                                error={errors.name}
                            />
                        </FormControl>
                    </FormGroup>
                    <FormGroup>
                        <FormLabel required>Last Name</FormLabel>
                        <FormControl>
                            <FormInput
                                name="last_name"
                                value={data.last_name}
                                onChange={set('last_name')}
                                placeholder="Doe"
                                error={errors.last_name}
                            />
                        </FormControl>
                    </FormGroup>
                </div>

                <FormGroup>
                    <FormLabel required>Username</FormLabel>
                    <FormControl>
                        <FormInput
                            name="username"
                            value={data.username}
                            onChange={set('username')}
                            placeholder="johndoe"
                            error={errors.username}
                        />
                    </FormControl>
                </FormGroup>

                <FormGroup>
                    <FormLabel required>Password</FormLabel>
                    <FormControl>
                        <FormInput
                            type="password"
                            name="password"
                            value={data.password}
                            onChange={set('password')}
                            placeholder="At least 8 characters"
                            error={errors.password}
                        />
                    </FormControl>
                </FormGroup>

                <FormGroup>
                    <FormLabel required>Confirm Password</FormLabel>
                    <FormControl>
                        <FormInput
                            type="password"
                            name="confirm_password"
                            value={data.confirm_password}
                            onChange={set('confirm_password')}
                            placeholder="Repeat password"
                            error={errors.confirm_password}
                        />
                    </FormControl>
                </FormGroup>
            </div>

            <div className="onboarding-step__actions">
                <Button fullWidth variant="primary" onClick={() => { if (validate()) onNext(); }}>
                    Continue
                </Button>
            </div>
        </div>
    );
}

// ─── Step 3 — Company Details ────────────────────────────────────────────────

function CompanyStep({
    data,
    onChange,
    onSubmit,
    isLoading,
    error,
}: {
    data: CompanyData;
    onChange: (d: CompanyData) => void;
    onSubmit: () => void;
    isLoading: boolean;
    error?: string;
}) {
    const [errors, setErrors] = useState<Partial<CompanyData>>({});

    const validate = () => {
        const e: Partial<CompanyData> = {};
        if (!data.company_name.trim()) e.company_name = 'Company name is required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const set = (field: keyof CompanyData) => (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange({ ...data, [field]: e.target.value });
        setErrors(prev => ({ ...prev, [field]: '' }));
    };

    return (
        <div className="onboarding-step">
            <div className="onboarding-step__icon">
                <Building2 size={24} />
            </div>
            <h2 className="onboarding-step__heading">Your company</h2>
            <p className="onboarding-step__description">Tell us a bit about your business.</p>

            <div className="w-full text-left">
                <FormGroup>
                    <FormLabel required>Company Name</FormLabel>
                    <FormControl>
                        <FormInput
                            name="company_name"
                            value={data.company_name}
                            onChange={set('company_name')}
                            placeholder="Acme Inc."
                            error={errors.company_name}
                        />
                    </FormControl>
                </FormGroup>

                <FormGroup>
                    <FormLabel>Company Phone</FormLabel>
                    <FormControl>
                        <FormInput
                            name="company_phone"
                            value={data.company_phone}
                            onChange={set('company_phone')}
                            placeholder="+1 (555) 123-4567"
                        />
                    </FormControl>
                </FormGroup>

                <FormGroup>
                    <FormLabel>Company Address</FormLabel>
                    <FormControl>
                        <FormInput
                            name="company_address"
                            value={data.company_address}
                            onChange={set('company_address')}
                            placeholder="Street, City, Country"
                        />
                    </FormControl>
                </FormGroup>
            </div>

            {error && (
                <div className="onboarding-step__error">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            <div className="onboarding-step__actions">
                <Button
                    fullWidth
                    variant="primary"
                    loading={isLoading}
                    onClick={() => { if (validate()) onSubmit(); }}
                >
                    Create Account
                </Button>
            </div>
        </div>
    );
}

// ─── Step 4 — Success ────────────────────────────────────────────────────────

function SuccessStep({ email }: { email: string }) {
    return (
        <div className="onboarding-step">
            <div className="onboarding-step__icon onboarding-step__icon--success">
                <CheckCircle size={24} />
            </div>
            <h2 className="onboarding-step__heading">Welcome aboard!</h2>
            <p className="onboarding-step__description">
                Your client account has been created. A verification email has been sent
                to <strong>{email}</strong>. Your agency will be in touch shortly.
            </p>
        </div>
    );
}

// ─── Main page ───────────────────────────────────────────────────────────────

const STEPS = ['invite', 'account', 'company', 'success'] as const;
type Step = typeof STEPS[number];

export default function ClientRegisterPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [step, setStep] = useState<Step>('invite');
    const [accountData, setAccountData] = useState<AccountData>({
        name: '', last_name: '', username: '', password: '', confirm_password: '',
    });
    const [companyData, setCompanyData] = useState<CompanyData>({
        company_name: '', company_phone: '', company_address: '',
    });
    const [submitError, setSubmitError] = useState('');

    const { data: tokenData, isLoading: tokenLoading, error: tokenError } =
        useValidateClientOnboardingToken(token);
    const registerMutation = useRegisterClient();

    const stepIndex = STEPS.indexOf(step);
    // progress bar spans steps 1-3 (invite → account → company), max at 100% on success
    const activeSteps = STEPS.filter(s => s !== 'success');
    const progress = step === 'success'
        ? 100
        : Math.round(((activeSteps.indexOf(step) + 1) / activeSteps.length) * 100);

    const handleRegister = useCallback(async () => {
        if (!token) return;
        setSubmitError('');
        try {
            await registerMutation.mutateAsync({
                token,
                name: accountData.name,
                last_name: accountData.last_name,
                username: accountData.username,
                password: accountData.password,
                company_name: companyData.company_name,
                company_phone: companyData.company_phone || undefined,
                company_address: companyData.company_address || undefined,
            });
            setStep('success');
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
        }
    }, [token, accountData, companyData, registerMutation]);

    // ── Guard states ─────────────────────────────────────────────────────────

    if (!token) {
        return (
            <div className="onboarding">
                <div className="onboarding-step">
                    <div className="onboarding-step__icon">
                        <AlertCircle size={24} />
                    </div>
                    <h2 className="onboarding-step__heading">Invalid Link</h2>
                    <p className="onboarding-step__description">
                        This invitation link is missing its token. Please use the exact link from your email.
                    </p>
                </div>
            </div>
        );
    }

    if (tokenLoading) {
        return (
            <div className="onboarding">
                <div className="onboarding-step">
                    <p className="onboarding-step__description">Validating your invitation…</p>
                </div>
            </div>
        );
    }

    if (tokenError || !tokenData?.valid) {
        return (
            <div className="onboarding">
                <div className="onboarding-step">
                    <div className="onboarding-step__icon">
                        <AlertCircle size={24} />
                    </div>
                    <h2 className="onboarding-step__heading">Invitation Expired</h2>
                    <p className="onboarding-step__description">
                        This invitation link has expired or is no longer valid.
                        Please ask your agency to send a new invitation.
                    </p>
                </div>
            </div>
        );
    }

    // ── Main render ──────────────────────────────────────────────────────────

    return (
        <div className="onboarding">
            {/* Progress bar — same markup as the main onboarding */}
            {/* <div className="onboarding__progress">
                <span className="onboarding__step-count">
                    {step === 'success'
                        ? 'All done!'
                        : `Step ${activeSteps.indexOf(step) + 1} of ${activeSteps.length}`}
                </span>
                <progress
                    className="onboarding__progress-bar"
                    value={progress}
                    max={100}
                />
            </div> */}

            {step === 'invite' && (
                <WelcomeStep email={tokenData.email} onNext={() => setStep('account')} />
            )}
            {step === 'account' && (
                <AccountStep
                    data={accountData}
                    onChange={setAccountData}
                    onNext={() => setStep('company')}
                />
            )}
            {step === 'company' && (
                <CompanyStep
                    data={companyData}
                    onChange={setCompanyData}
                    onSubmit={handleRegister}
                    isLoading={registerMutation.isPending}
                    error={submitError}
                />
            )}
            {step === 'success' && <SuccessStep email={tokenData.email} />}
        </div>
    );
}

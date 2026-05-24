'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUpdateClient, useClient, useInviteClient } from '@/src/hooks/queries/client-management';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { closeAllViews, selectSidebarViewData } from '@/src/store/slices/layoutSlice';
import { Button, Form, FormControl, FormInput, FormLabel, FormGroup, FormRow, FormActions, Textarea, Card, CardHeader, CardActions } from '../shared/ui';
import { useWorkspacePath } from '@/src/hooks/useWorkspacePath';

interface FormViewData {
    clientId?: string;
}

export default function ClientFormView() {
    const router = useRouter();
    const workspacePath = useWorkspacePath();
    const dispatch = useAppDispatch();

    const viewData = useAppSelector(selectSidebarViewData) as FormViewData | null;
    const clientId = viewData?.clientId || null;
    const isEditing = !!clientId;

    // Edit path — unchanged
    const updateMutation = useUpdateClient();
    const { data: clientData, isLoading } = useClient(clientId || '');

    // Create path — now invitation-based
    const inviteMutation = useInviteClient();
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteError, setInviteError] = useState('');
    const [inviteSent, setInviteSent] = useState(false);

    // Edit form state
    const [formData, setFormData] = useState({
        name: '',
        primary_email: '',
        primary_phone: '',
        address: '',
        notes: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isEditing && clientData) {
            setFormData({
                name: clientData.name || '',
                primary_email: clientData.primary_email || '',
                primary_phone: clientData.primary_phone || '',
                address: clientData.address || '',
                notes: clientData.notes || '',
            });
        }
    }, [isEditing, clientData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) {
            newErrors.name = 'Client name is required';
        }
        if (formData.primary_email && !formData.primary_email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            newErrors.primary_email = 'Invalid email address';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        try {
            if (clientId) {
                await updateMutation.mutateAsync({ id: clientId, data: formData });
            }
            dispatch(closeAllViews());
            router.push(workspacePath('clients'));
        } catch (error) {
            console.error('Failed to save client:', error);
        }
    };

    const handleInviteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviteError('');
        if (!inviteEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            setInviteError('Please enter a valid email address');
            return;
        }
        try {
            await inviteMutation.mutateAsync({ email: inviteEmail });
            setInviteSent(true);
        } catch (err) {
            setInviteError(err instanceof Error ? err.message : 'Failed to send invitation');
        }
    };

    const handleClose = () => {
        dispatch(closeAllViews());
    };

    if (isEditing && isLoading) {
        return <div className="p-8 text-center">Loading client data...</div>;
    }

    // ── INVITE MODE ──────────────────────────────────────────────────
    if (!isEditing) {
        if (inviteSent) {
            return (
                <div className="form-view">
                    <Card variant='transparent'>
                        <CardHeader title='Invitation Sent!' subtitle={` An invitation has been sent to ${inviteEmail}.
                            Once they register, they will appear in your client list.`} />
                            <CardActions>
                                <Button variant="ghost" onClick={() => { setInviteSent(false); setInviteEmail(''); }}>
                                    Invite Another Client
                                </Button>
                                <Button onClick={handleClose}>Done</Button>
                            </CardActions>
                    </Card>
                </div>
            );
        }

        return (
            <div className="form-view">
                <Card variant='transparent'>
                    <CardHeader title='Invite Client' subtitle='Enter the client&apos;s email address. They&apos;ll receive an invitation to create their client account and will appear in your workspace once registered.'/> 
                    <Form onSubmit={handleInviteSubmit}>
                        <FormGroup>
                            <FormLabel required>Client Email</FormLabel>
                            <FormControl>
                                <FormInput
                                    type="email"
                                    name="invite_email"
                                    value={inviteEmail}
                                    onChange={e => { setInviteEmail(e.target.value); setInviteError(''); }}
                                    placeholder="client@company.com"
                                    error={inviteError}
                                />
                            </FormControl>
                        </FormGroup>
                        <FormActions>
                            <Button type="button" variant="ghost" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={inviteMutation.isPending}>
                                {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
                            </Button>
                        </FormActions>
                    </Form>
                </Card>
            </div>
        );
    }

    // ── EDIT MODE ────────────────────────────────────────────────────
    return (
        <div className="form-view">
            <Form onSubmit={handleEditSubmit}>
                <FormGroup>
                    <FormLabel required>Client Name</FormLabel>
                    <FormControl>
                        <FormInput
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter client name"
                            error={errors.name}
                        />
                    </FormControl>
                </FormGroup>

                <FormRow>
                    <FormGroup>
                        <FormLabel>Primary Email</FormLabel>
                        <FormControl>
                            <FormInput
                                type="email"
                                name="primary_email"
                                value={formData.primary_email}
                                onChange={handleChange}
                                placeholder="contact@example.com"
                                error={errors.primary_email}
                            />
                        </FormControl>
                    </FormGroup>

                    <FormGroup>
                        <FormLabel>Primary Phone</FormLabel>
                        <FormControl>
                            <FormInput
                                type="tel"
                                name="primary_phone"
                                value={formData.primary_phone}
                                onChange={handleChange}
                                placeholder="+1 (555) 123-4567"
                            />
                        </FormControl>
                    </FormGroup>
                </FormRow>

                <FormGroup>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                        <FormInput
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Street, City, Country"
                        />
                    </FormControl>
                </FormGroup>

                <FormGroup>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                        <Textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="Internal notes about this client..."
                            rows={4}
                        />
                    </FormControl>
                </FormGroup>

                <FormActions>
                    <Button type="button" variant="ghost" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={updateMutation.isPending}>
                        {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                </FormActions>
            </Form>
        </div>
    );
}

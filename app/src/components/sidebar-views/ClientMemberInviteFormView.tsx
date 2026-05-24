'use client';

import { memo, useState } from 'react';
import { X, Users } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { closeAllViews, popView, selectSidebarViewData } from '@/src/store/slices/layoutSlice';
import { useInviteClientMember } from '@/src/hooks/queries/client-management';
import {
    Button,
    Form,
    FormActions,
    FormGroup,
    FormInput,
    FormLabel,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    useToast
} from '@/src/components/shared/ui';

interface ClientMemberInviteFormViewData {
    clientId: string;
    clientName?: string;
}

function ClientMemberInviteFormViewComponent() {
    const dispatch = useAppDispatch();
    const toast = useToast();
    const inviteMutation = useInviteClientMember();

    const viewData = (useAppSelector(selectSidebarViewData) as ClientMemberInviteFormViewData) || {};

    const { clientId, clientName } = viewData;

    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'admin' | 'member' | 'viewer'>('member');

    const handleClose = () => {
        dispatch(popView());
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim() || !clientId) {
            toast.error('Please enter an email address');
            return;
        }

        try {
            await inviteMutation.mutateAsync({
                clientId,
                data: {
                    email: email.trim(),
                    role
                }
            });
            toast.success(`Invitation sent to ${email}`);
            dispatch(popView());
        } catch (error: any) {
            toast.error(error.message || 'Failed to send invitation');
        }
    };

    if (!clientId) {
        return (
            <div className="form-view">
                <div className="form-view__header">
                    <h2 className="form-view__title">Invite Member</h2>
                    <button onClick={handleClose} className="form-view__close" aria-label="Close">
                        <X size={20} />
                    </button>
                </div>
                <div className="form-view__content">
                    <p className="form-view__error">Client ID is required</p>
                </div>
            </div>
        );
    }

    return (
        <div className="form-view">
            <div className="form-view__header">
                <h2 className="form-view__title">Invite Member</h2>
                <button onClick={handleClose} className="form-view__close" aria-label="Close">
                    <X size={20} />
                </button>
            </div>
            <div className="form-view__content">
                {clientName && (
                    <div className="form-view__subtitle">
                        <Users size={16} />
                        <span>Invite to {clientName}</span>
                    </div>
                )}

                <Form onSubmit={handleSubmit}>
                    <FormGroup>
                        <FormLabel htmlFor="email">Email Address</FormLabel>
                        <FormInput
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="member@example.com"
                            required
                        />
                    </FormGroup>

                    <FormGroup>
                        <FormLabel htmlFor="role">Role</FormLabel>
                        <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
                            <SelectTrigger id="role">
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">Admin - Can manage client settings</SelectItem>
                                <SelectItem value="member">Member - Can view and collaborate</SelectItem>
                                <SelectItem value="viewer">Viewer - View only access</SelectItem>
                            </SelectContent>
                        </Select>
                    </FormGroup>

                    <FormActions>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            loading={inviteMutation.isPending}
                        >
                            Send Invitation
                        </Button>
                    </FormActions>
                </Form>
            </div>
        </div>
    );
}

export default memo(ClientMemberInviteFormViewComponent);

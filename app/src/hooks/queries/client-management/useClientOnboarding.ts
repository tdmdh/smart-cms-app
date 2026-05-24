import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type ClientOnboardingInvitationResponse, type InviteClientOnboardingRequest, type RegisterClientRequest, type ValidateClientOnboardingTokenResponse } from './config';
import { clientsKeys } from './useClients';
import { useWorkspaceId } from '@/src/hooks/useWorkspaceId';

export const onboardingInvitationsKey = (workspaceId?: string) =>
    ['client-onboarding-invitations', workspaceId] as const;

/**
 * Query: fetch all onboarding invitations for the current workspace (agency view).
 */
export function useClientOnboardingInvitations() {
    return useQuery<{ invitations: ClientOnboardingInvitationResponse[] }>({
        queryKey: onboardingInvitationsKey(),
        queryFn: () => api.onboarding.listInvitations(),
    });
}

/**
 * Mutation: send an onboarding invitation email to a prospective client.
 * Replaces useCreateClient — agencies now invite instead of directly creating.
 */
export function useInviteClient() {
    const queryClient = useQueryClient();
    const workspaceId = useWorkspaceId();
    return useMutation<ClientOnboardingInvitationResponse, Error, InviteClientOnboardingRequest>({
        mutationFn: (data) => api.onboarding.invite(data),
        onSuccess: () => {
            // Invalidate both the client list and the invitations list
            queryClient.invalidateQueries({ queryKey: clientsKeys.lists(workspaceId) });
            queryClient.invalidateQueries({ queryKey: onboardingInvitationsKey() });
        },
    });
}

/**
 * Query: validate an onboarding token (public — no auth required).
 * Used on the client onboarding registration page.
 */
export function useValidateClientOnboardingToken(token: string | null) {
    return useQuery<ValidateClientOnboardingTokenResponse>({
        queryKey: ['client-onboarding-token', token],
        queryFn: () => {
            if (!token) throw new Error('No token');
            return api.onboarding.validateToken(token);
        },
        enabled: !!token,
        retry: false,
    });
}

/**
 * Mutation: register a new client user using an onboarding token.
 * Public endpoint — no auth cookie needed.
 */
export function useRegisterClient() {
    return useMutation<{ user: { id: string; email: string } }, Error, RegisterClientRequest>({
        mutationFn: (data) => api.onboarding.registerClient(data),
    });
}

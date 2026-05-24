import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, InviteClientMemberRequest, AcceptInvitationRequest } from './config';
import { clientMembersKeys } from './useClientMember';

export function useCreateInvitation() {
    return useMutation({
        mutationFn: ({ clientId, data }: { clientId: string; data: InviteClientMemberRequest }) =>
            api.invitations.create(clientId, data),
    });
}

export function useAcceptInvitation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: AcceptInvitationRequest) => api.invitations.accept(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: clientMembersKeys.lists() });
        },
    });
}

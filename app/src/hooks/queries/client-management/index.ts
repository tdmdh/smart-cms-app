export { api } from './config';

export {
    useClients,
    useClient,
    useCreateClient,
    useUpdateClient,
    useDeleteClient,
    clientsKeys
} from './useClients';

export {
    useAgencyMembers,
    useAgencyMember,
    useAddAgencyMember,
    useUpdateAgencyMemberRole,
    useRemoveAgencyMember,
    agencyMembersKeys
} from './useAgencyMembers';

export {
    useClientMembers,
    useAddClientMember,
    useUpdateClientMemberRole,
    useRemoveClientMember,
    clientMembersKeys,
    useInviteClientMember
} from './useClientMember';

export {
    useCreateInvitation,
    useAcceptInvitation,

} from './useInvitations';

export {
    useDeveloperClients,
    useAssignDeveloper,
    useUnassignDeveloper,
    assignmentsKeys
} from './useAssignmnets';

export {
    useClientOnboardingInvitations,
    useInviteClient,
    useValidateClientOnboardingToken,
    useRegisterClient,
    onboardingInvitationsKey,
} from './useClientOnboarding';

export type {
    ClientResponse,
    CreateClientRequest,
    UpdateClientRequest,
    ListClientsResponse,
    AgencyMemberResponse,
    AddAgencyMemberRequest,
    UpdateAgencyMemberRoleRequest,
    ClientMemberResponse,
    AddClientMemberRequest,
    UpdateClientMemberRoleRequest,
    ClientInvitationResponse,
    InviteClientMemberRequest,
    AcceptInvitationRequest,
    AssignDeveloperRequest,
    UnassignDeveloperRequest,
} from './config';

export type {
    ClientOnboardingInvitationResponse,
    InviteClientOnboardingRequest,
    ValidateClientOnboardingTokenResponse,
    RegisterClientRequest,
} from './config';

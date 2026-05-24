import { Endpoint } from "../config";
import type { components } from "../types";

export type ClientResponse = components["schemas"]["handlers.ClientResponse"];
export type CreateClientRequest = components["schemas"]["handlers.CreateClientRequest"];
export type UpdateClientRequest = components["schemas"]["handlers.UpdateClientRequest"];
export type ListClientsResponse = components["schemas"]["handlers.ListClientsResponse"];
export type ClientMemberResponse = components["schemas"]["handlers.ClientMemberResponse"];
export type AddClientMemberRequest = components["schemas"]["handlers.AddClientMemberRequest"];
export type UpdateClientMemberRoleRequest = components["schemas"]["handlers.UpdateClientMemberRoleRequest"];
export type InviteClientMemberRequest = components["schemas"]["handlers.InviteClientMemberRequest"];
export type ClientInvitationResponse = components["schemas"]["handlers.ClientInvitationResponse"];
export type AcceptInvitationRequest = components["schemas"]["handlers.AcceptInvitationRequest"];
export type AgencyMemberResponse = components["schemas"]["handlers.AgencyMemberResponse"];
export type AddAgencyMemberRequest = components["schemas"]["handlers.AddAgencyMemberRequest"];
export type UpdateAgencyMemberRoleRequest = components["schemas"]["handlers.UpdateAgencyMemberRoleRequest"];
export type AgencyRoleResponse = components["schemas"]["handlers.AgencyRoleResponse"];
export type AssignDeveloperRequest = components["schemas"]["handlers.AssignDeveloperRequest"];
export type UnassignDeveloperRequest = components["schemas"]["handlers.UnassignDeveloperRequest"];
export type ErrorResponse = components["schemas"]["handlers.ErrorResponse"];
export type MessageResponse = components["schemas"]["handlers.MessageResponse"];

export const clients = {
    list: (limit = 20, offset = 0): Endpoint<void, ListClientsResponse> => ({
        method: 'GET',
        endpoint: `/clients?limit=${limit}&offset=${offset}`,
        requiredAuth: true,
    }),
    create: (): Endpoint<CreateClientRequest, ClientResponse> => ({
        method: 'POST',
        endpoint: '/clients',
        requiredAuth: true,
    }),
    get: (id: string): Endpoint<void, ClientResponse> => ({
        method: 'GET',
        endpoint: `/clients/${id}`,
        requiredAuth: true,
    }),
    update: (id: string): Endpoint<UpdateClientRequest, ClientResponse> => ({
        method: 'PUT',
        endpoint: `/clients/${id}`,
        requiredAuth: true,
    }),
    delete: (id: string): Endpoint<void, MessageResponse> => ({
        method: 'DELETE',
        endpoint: `/clients/${id}`,
        requiredAuth: true,
    }),

    members: {
        list: (clientId: string): Endpoint<void, { members: ClientMemberResponse[] }> => ({
            method: 'GET',
            endpoint: `/clients/${clientId}/members`,
            requiredAuth: true,
        }),
        add: (clientId: string): Endpoint<AddClientMemberRequest, ClientMemberResponse> => ({
            method: 'POST',
            endpoint: `/clients/${clientId}/members`,
            requiredAuth: true,
        }),
        updateRole: (clientId: string, userId: string): Endpoint<UpdateClientMemberRoleRequest, MessageResponse> => ({
            method: 'PUT',
            endpoint: `/clients/${clientId}/members/${userId}`,
            requiredAuth: true,
        }),
        remove: (clientId: string, userId: string): Endpoint<void, MessageResponse> => ({
            method: 'DELETE',
            endpoint: `/clients/${clientId}/members/${userId}`,
            requiredAuth: true,
        }),
    },

    invitations: {
        create: (clientId: string): Endpoint<InviteClientMemberRequest, ClientInvitationResponse> => ({
            method: 'POST',
            endpoint: `/clients/${clientId}/invitations`,
            requiredAuth: true,
        }),
        accept: (): Endpoint<AcceptInvitationRequest, ClientMemberResponse> => ({
            method: 'POST',
            endpoint: '/invitations/accept',
            requiredAuth: true,
        }),
    },
};

export const agency = {
    members: {
        list: (): Endpoint<void, { members: AgencyMemberResponse[] }> => ({
            method: 'GET',
            endpoint: '/agency/members',
            requiredAuth: true,
        }),
        get: (userId: string): Endpoint<void, AgencyMemberResponse> => ({
            method: 'GET',
            endpoint: `/agency/members/${userId}`,
            requiredAuth: true,
        }),
        add: (): Endpoint<AddAgencyMemberRequest, AgencyMemberResponse> => ({
            method: 'POST',
            endpoint: '/agency/members',
            requiredAuth: true,
        }),
        updateRole: (userId: string): Endpoint<UpdateAgencyMemberRoleRequest, MessageResponse> => ({
            method: 'PUT',
            endpoint: `/agency/members/${userId}`,
            requiredAuth: true,
        }),
        remove: (userId: string): Endpoint<void, MessageResponse> => ({
            method: 'DELETE',
            endpoint: `/agency/members/${userId}`,
            requiredAuth: true,
        }),
    },

    role: (): Endpoint<void, AgencyRoleResponse> => ({
        method: 'GET',
        endpoint: '/agency/role',
        requiredAuth: true,
    }),

    assignments: {
        assign: (): Endpoint<AssignDeveloperRequest, MessageResponse> => ({
            method: 'POST',
            endpoint: '/agency/assignments',
            requiredAuth: true,
        }),
        unassign: (): Endpoint<UnassignDeveloperRequest, MessageResponse> => ({
            method: 'DELETE',
            endpoint: '/agency/assignments',
            requiredAuth: true,
        }),
        getDeveloperClients: (userId: string): Endpoint<void, { clients: ClientResponse[] }> => ({
            method: 'GET',
            endpoint: `/agency/developers/${userId}/clients`,
            requiredAuth: true,
        }),
    },
};
import { Endpoint } from "../config";
import type { components } from "../types";

export type LoginRequest = components["schemas"]["handlers.LoginRequest"];
export type LoginResponse = components["schemas"]["handlers.LoginResponse"];
export type RegisterRequest = components["schemas"]["handlers.RegisterRequest"];
export type RegisterResponse = components["schemas"]["handlers.RegisterResponse"];
export type ProfileResponse = components["schemas"]["handlers.ProfileResponse"];
export type RefreshTokenRequest = components["schemas"]["handlers.RefreshTokenRequest"];
export type RefreshTokenResponse = components["schemas"]["handlers.RefreshTokenResponse"];
export type LogoutRequest = components["schemas"]["handlers.LogoutRequest"];
export type MessageResponse = components["schemas"]["handlers.MessageResponse"];
export type ListSessionsResponse = components["schemas"]["handlers.ListSessionsResponse"];
export type BeginPasskeyRequest = components["schemas"]["handlers.BeginPasskeyRequest"];
export type BeginPasskeyResponse = components["schemas"]["handlers.BeginPasskeyResponse"];
export type FinishPasskeyRequest = components["schemas"]["handlers.FinishPasskeyRequest"];
export type BeginPasskeyRegRequest = components["schemas"]["handlers.BeginPasskeyRegRequest"];
export type BeginPasskeyRegResponse = components["schemas"]["handlers.BeginPasskeyRegResponse"];
export type FinishPasskeyRegRequest = components["schemas"]["handlers.FinishPasskeyRegRequest"];
export type BeginEmailVerificationRequest = components["schemas"]["handlers.BeginEmailVerificationRequest"];
export type BeginPasswordResetRequest = components["schemas"]["handlers.BeginPasswordResetRequest"];
export type FinishPasswordResetRequest = components["schemas"]["handlers.FinishPasswordResetRequest"];

export const auth = {
    user: {
        profile: (): Endpoint<void, ProfileResponse> => ({
            method: 'GET',
            endpoint: '/auth/profile',
            requiredAuth: true,
        }),
        publicProfile: (username: string): Endpoint<void, ProfileResponse> => ({
            method: 'GET',
            endpoint: `/auth/public-profile/${username}`,
        }),
        login: (): Endpoint<LoginRequest, LoginResponse> => ({
            method: 'POST',
            endpoint: '/auth/login',
        }),
        register: (): Endpoint<RegisterRequest, RegisterResponse> => ({
            method: 'POST',
            endpoint: '/auth/register',
        }),
        logout: (): Endpoint<LogoutRequest, MessageResponse> => ({
            method: 'POST',
            endpoint: '/auth/logout',
            requiredAuth: true,
        }),
        logoutAllDevices: (): Endpoint<void, MessageResponse> => ({
            method: 'POST',
            endpoint: '/auth/logout/all',
            requiredAuth: true,
        }),
        sessions: (): Endpoint<void, ListSessionsResponse> => ({
            method: 'GET',
            endpoint: '/auth/sessions',
            requiredAuth: true,
        }),
        refresh: (): Endpoint<RefreshTokenRequest, RefreshTokenResponse> => ({
            method: 'POST',
            endpoint: '/auth/refresh',
        }),
    },
    passkey: {
        login: {
            begin: (): Endpoint<BeginPasskeyRequest, BeginPasskeyResponse> => ({
                method: 'POST',
                endpoint: '/auth/passkey/login/begin',
            }),
            finish: (): Endpoint<FinishPasskeyRequest, LoginResponse> => ({
                method: 'POST',
                endpoint: '/auth/passkey/login/finish',
            }),
        },
        register: {
            begin: (): Endpoint<BeginPasskeyRegRequest, BeginPasskeyRegResponse> => ({
                method: 'POST',
                endpoint: '/auth/passkey/register/begin',
            }),
            finish: (): Endpoint<FinishPasskeyRegRequest, RegisterResponse> => ({
                method: 'POST',
                endpoint: '/auth/passkey/register/finish',
            }),
        },
    },
    oauth: {
        begin: (provider: string): Endpoint<void, void> => ({
            method: 'GET',
            endpoint: `/auth/oauth/${provider}`,
        }),
        finish: (provider: string): Endpoint<void, LoginResponse> => ({
            method: 'GET',
            endpoint: `/auth/oauth/${provider}/callback`,
        }),
    },
    emailVerification: {
        begin: (): Endpoint<BeginEmailVerificationRequest, MessageResponse> => ({
            method: 'POST',
            endpoint: '/auth/email/verify/begin',
        }),
        finish: (): Endpoint<void, MessageResponse> => ({
            method: 'GET',
            endpoint: '/auth/email/verify',
        }),
    },
    passwordReset: {
        begin: (): Endpoint<BeginPasswordResetRequest, MessageResponse> => ({
            method: 'POST',
            endpoint: '/auth/password/reset/begin',
        }),
        finish: (): Endpoint<FinishPasswordResetRequest, MessageResponse> => ({
            method: 'POST',
            endpoint: '/auth/password/reset/finish',
        }),
    },
};
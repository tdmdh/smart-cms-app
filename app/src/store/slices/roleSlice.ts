import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import type { AgencyRole, ClientRole, Permission } from '@/src/config/permissions';
import { hasAgencyPermission, hasClientPermission } from '@/src/config/permissions';
import { getBackendApiUrl } from '@/src/api/config';
import { getActiveWorkspaceId } from '@/src/api/workspace-utils';

function getRoleRequestHeaders(): HeadersInit {
    const headers: Record<string, string> = {};
    const workspaceID = getActiveWorkspaceId();
    if (workspaceID) {
        headers['X-Workspace-ID'] = workspaceID;
    }
    return headers;
}

export interface RoleState {
    agencyRole: AgencyRole | null;
    clientRole: ClientRole | null;
    currentClientId: string | null;
    isLoading: boolean;
    error: string | null;
    // Debug overrides (dev-only)
    _debugAgencyRoleOverride: AgencyRole | null;
    _debugClientRoleOverride: ClientRole | null;
}

const initialState: RoleState = {
    agencyRole: null,
    clientRole: null,
    currentClientId: null,
    isLoading: false,
    error: null,
    _debugAgencyRoleOverride: null,
    _debugClientRoleOverride: null,
};

export const fetchAgencyRole = createAsyncThunk<AgencyRole, void>(
    'role/fetchAgencyRole',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetch(`${getBackendApiUrl()}/agency/role`, {
                method: 'GET',
                credentials: 'include',
                headers: getRoleRequestHeaders(),
            });

            if (!response.ok) {
                if (response.status === 404) {
                    return rejectWithValue(null);
                }
                const data = await response.json();
                return rejectWithValue(data.error || 'Failed to fetch agency role');
            }

            const data = await response.json();
            return data.role as AgencyRole;
        } catch {
            return rejectWithValue('Network error');
        }
    }
);

export const fetchClientRole = createAsyncThunk<
    { clientId: string; role: ClientRole },
    string
>(
    'role/fetchClientRole',
    async (clientId, { rejectWithValue }) => {
        try {
            const workspaceID = getActiveWorkspaceId();
            const endpoint = workspaceID
                ? `${getBackendApiUrl()}/workspaces/${workspaceID}/clients/${clientId}/role`
                : `${getBackendApiUrl()}/clients/${clientId}/role`;

            const response = await fetch(endpoint, {
                method: 'GET',
                credentials: 'include',
                headers: getRoleRequestHeaders(),
            });

            if (!response.ok) {
                if (response.status === 404) {
                    return rejectWithValue(null);
                }
                const data = await response.json();
                return rejectWithValue(data.error || 'Failed to fetch client role');
            }

            const data = await response.json();
            return { clientId, role: data.role as ClientRole };
        } catch {
            return rejectWithValue('Network error');
        }
    }
);

const roleSlice = createSlice({
    name: 'role',
    initialState,
    reducers: {
        clearRoles: () => initialState,
        setCurrentClientId: (state, action: PayloadAction<string | null>) => {
            state.currentClientId = action.payload;
            if (!action.payload) {
                state.clientRole = null;
            }
        },
        clearError: (state) => {
            state.error = null;
        },
        setAgencyRoleOverride: (state, action: PayloadAction<AgencyRole | null>) => {
            if (process.env.NODE_ENV !== 'production') {
                state._debugAgencyRoleOverride = action.payload;
            }
        },
        setClientRoleOverride: (state, action: PayloadAction<ClientRole | null>) => {
            if (process.env.NODE_ENV !== 'production') {
                state._debugClientRoleOverride = action.payload;
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAgencyRole.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchAgencyRole.fulfilled, (state, action: PayloadAction<AgencyRole>) => {
                state.isLoading = false;
                state.agencyRole = action.payload;
            })
            .addCase(fetchAgencyRole.rejected, (state, action) => {
                state.isLoading = false;
                state.agencyRole = null;
                if (action.payload) {
                    state.error = action.payload as string;
                }
            });

        builder
            .addCase(fetchClientRole.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchClientRole.fulfilled, (state, action) => {
                state.isLoading = false;
                state.clientRole = action.payload.role;
                state.currentClientId = action.payload.clientId;
            })
            .addCase(fetchClientRole.rejected, (state, action) => {
                state.isLoading = false;
                state.clientRole = null;
                if (action.payload) {
                    state.error = action.payload as string;
                }
            });
    },
});

export const { clearRoles, setCurrentClientId, clearError, setAgencyRoleOverride, setClientRoleOverride } = roleSlice.actions;

export const selectRoleState = (state: RootState) => state.role;
export const selectAgencyRole = (state: RootState) => state.role._debugAgencyRoleOverride ?? state.role.agencyRole;
export const selectClientRole = (state: RootState) => state.role._debugClientRoleOverride ?? state.role.clientRole;
export const selectCurrentClientId = (state: RootState) => state.role.currentClientId;
export const selectRoleIsLoading = (state: RootState) => state.role.isLoading;
export const selectRoleError = (state: RootState) => state.role.error;
export const selectIsAgencyMember = (state: RootState) => (state.role._debugAgencyRoleOverride ?? state.role.agencyRole) !== null;

export const selectHasAgencyPermission = (permission: Permission) => (state: RootState) =>
    hasAgencyPermission(state.role.agencyRole, permission);

export const selectHasClientPermission = (permission: Permission) => (state: RootState) =>
    hasClientPermission(state.role.clientRole, permission);

export default roleSlice.reducer;

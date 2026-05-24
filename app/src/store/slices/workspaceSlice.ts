import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

interface WorkspaceState {
    currentWorkspaceId: string | null;
}

const initialState: WorkspaceState = {
    currentWorkspaceId: null,
};

const workspaceSlice = createSlice({
    name: 'workspace',
    initialState,
    reducers: {
        setCurrentWorkspaceId: (state, action: PayloadAction<string | null>) => {
            state.currentWorkspaceId = action.payload;
        },
        clearWorkspaceContext: () => initialState,
    },
});

export const { setCurrentWorkspaceId, clearWorkspaceContext } = workspaceSlice.actions;

export const selectCurrentWorkspaceId = (state: RootState) => state.workspace.currentWorkspaceId;

export default workspaceSlice.reducer;

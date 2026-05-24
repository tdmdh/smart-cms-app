import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface BreadcrumbState {
    mapping: Record<string, string>;
}

const initialState: BreadcrumbState = {
    mapping: {},
};

export const breadcrumbSlice = createSlice({
    name: 'breadcrumb',
    initialState,
    reducers: {
        setBreadcrumbMapping: (state, action: PayloadAction<{ id: string; name: string }>) => {
            const { id, name } = action.payload;
            if (id && name) {
                state.mapping[id] = name;
            }
        },
    },
});

export const { setBreadcrumbMapping } = breadcrumbSlice.actions;

export const selectBreadcrumbMapping = (state: { breadcrumb: BreadcrumbState }) => state.breadcrumb.mapping;

export default breadcrumbSlice.reducer;

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
    persistStore,
    persistReducer,
    FLUSH,
    REHYDRATE,
    PAUSE,
    PERSIST,
    PURGE,
    REGISTER,
} from 'redux-persist';
import storage from './storage';
import authReducer from './slices/authSlice';
import layoutReducer from './slices/layoutSlice';
import roleReducer from './slices/roleSlice';
import breadcrumbReducer from './slices/breadcrumbSlice';
import workspaceReducer from './slices/workspaceSlice';

const authPersistConfig = {
    key: 'auth',
    storage,
    blacklist: ['isInitialized', 'isLoading'],
};

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);

const rootReducer = combineReducers({
    auth: persistedAuthReducer,
    layout: layoutReducer,
    role: roleReducer,
    breadcrumb: breadcrumbReducer,
    workspace: workspaceReducer,
});

const rootPersistConfig = {
    key: 'root',
    version: 1,
    storage,
    whitelist: ['layout', 'workspace'],
};

const persistedReducer = persistReducer(rootPersistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }),
    devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

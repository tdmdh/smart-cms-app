import { useMutation } from '@tanstack/react-query';
import { api, UserLookupResponse } from './config';

// --------------------------------------------------------------------------
// User Lookup Hook
// --------------------------------------------------------------------------

/**
 * Hook to look up a user by username or email
 * Used primarily for adding team members
 */
export function useLookupUser() {
    return useMutation<UserLookupResponse, Error, string>({
        mutationFn: (identifier: string) => api.users.lookup(identifier),
    });
}

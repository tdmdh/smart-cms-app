'use client';

import { useEffect, useRef } from 'react';
import { useAppDispatch } from '@/src/store/hooks';
import { setMobile } from '@/src/store/slices/layoutSlice';
import { BREAKPOINTS } from '@/src/config/layout';

/**
 * Hook that handles mobile detection and layout initialization.
 * With fit-content sidebar, CSS variable syncing is no longer needed.
 */
export function useLayoutSync() {
    const dispatch = useAppDispatch();
    const mounted = useRef(false);

    // Handle mobile detection
    useEffect(() => {
        const checkMobile = () => {
            dispatch(setMobile(window.innerWidth < BREAKPOINTS.MOBILE));
        };

        checkMobile();
        mounted.current = true;

        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, [dispatch]);

    return { mounted: mounted.current };
}


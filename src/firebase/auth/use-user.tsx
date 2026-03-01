'use client';

import { useFirebase } from '@/firebase/provider';
import type { UserHookResult } from '@/firebase/provider';

/**
 * Hook to access the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 * @returns {UserHookResult} Object with user, isUserLoading, userError.
 */
export function useUser(): UserHookResult {
  const { user, isUserLoading, userError } = useFirebase();
  return { user, isUserLoading, userError };
}

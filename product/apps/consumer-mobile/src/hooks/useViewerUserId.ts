import { useMemo } from 'react';
import { useAuth } from '../auth';

export function useViewerUserId() {
  const { user, status } = useAuth();

  return useMemo(
    () => ({ userId: user?.id ?? null, isLoading: status === 'bootstrapping' }),
    [status, user?.id]
  );
}

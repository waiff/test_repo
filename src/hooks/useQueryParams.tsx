import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

export function useQueryParams() {
  const { search } = useLocation();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  return params;
}

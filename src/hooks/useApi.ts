import { useCallback, useEffect, useState } from "react";

import { apiFetch, ApiError } from "@/lib/api";

interface State<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  lastUpdatedAt: Date | null;
}

export function useApi<T>(path: string | null, refetchInterval?: number): State<T> & { refetch: () => void } {
  const [state, setState] = useState<State<T>>({
    data: null,
    loading: path !== null,
    error: null,
    lastUpdatedAt: null,
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (path === null) return;
    let active = true;
    setState((s) => ({ ...s, loading: s.data === null, error: null }));
    apiFetch<T>(path)
      .then((data) => active && setState({ data, loading: false, error: null, lastUpdatedAt: new Date() }))
      .catch((e) => active && setState((s) => ({ ...s, loading: false, error: e as ApiError })));
    return () => {
      active = false;
    };
  }, [path, tick]);

  useEffect(() => {
    if (refetchInterval == null || path === null) return;
    const id = setInterval(() => setTick((t) => t + 1), refetchInterval);
    return () => clearInterval(id);
  }, [path, refetchInterval]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, refetch };
}

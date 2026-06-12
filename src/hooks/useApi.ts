import { useCallback, useEffect, useState } from "react";

import { apiFetch, ApiError } from "@/lib/api";

interface State<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

export function useApi<T>(path: string | null): State<T> & { refetch: () => void } {
  const [state, setState] = useState<State<T>>({
    data: null,
    loading: path !== null,
    error: null,
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (path === null) return;
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    apiFetch<T>(path)
      .then((data) => active && setState({ data, loading: false, error: null }))
      .catch((e) => active && setState({ data: null, loading: false, error: e as ApiError }));
    return () => {
      active = false;
    };
  }, [path, tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, refetch };
}

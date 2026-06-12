import { useState } from "react";

import { useApi } from "@/hooks/useApi";
import type { ServerListResponse, ServerStatus } from "@/types/api";

export type StatusFilter = ServerStatus | "ALL";

export interface ServerFilters {
  status: StatusFilter;
  sort: string;
}

export function useServers() {
  const [filters, setFilters] = useState<ServerFilters>({ status: "ALL", sort: "name" });

  const qs = new URLSearchParams();
  if (filters.status !== "ALL") qs.set("status", filters.status);
  qs.set("sort", filters.sort);
  const { data, loading, error, refetch } = useApi<ServerListResponse>(`/servers?${qs.toString()}`);

  return {
    servers: data?.servers ?? [],
    loading,
    error,
    refetch,
    filters,
    setFilters,
  };
}

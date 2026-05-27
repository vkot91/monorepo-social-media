import { queryOptions, useQuery } from "@tanstack/react-query";

import { bffClient } from "#/shared/lib/api/api-client/bff-client";

import { authKeys } from "./routes";

export const getActiveUser = () => bffClient("/api/auth/me", "GET", {});

export const activeUserQueryOptions = () =>
  queryOptions({
    queryFn: getActiveUser,
    queryKey: authKeys.me(),
  });

export const useUser = () =>
  useQuery({
    ...activeUserQueryOptions(),
    staleTime: 60_000,
  });

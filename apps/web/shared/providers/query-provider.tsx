"use client";

import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { type ReactNode, useState } from "react";

import { ApiRequestError } from "#/shared/lib/api/utils/errors";
import { showMutationErrorToast } from "#/shared/lib/query/mutation-toast";
import { ToastViewport } from "#/shared/ui/toast/toast";

type QueryProviderProps = {
  children: ReactNode;
};

const maxQueryRetries = 3;

export const shouldRetryQuery = (failureCount: number, error: unknown) => {
  if (error instanceof ApiRequestError) {
    return false;
  }

  return failureCount < maxQueryRetries;
};

export const QueryProvider = ({ children }: QueryProviderProps) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        mutationCache: new MutationCache({
          onError: (error, _variables, _context, mutation) => {
            showMutationErrorToast(error, mutation.meta);
          },
        }),
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: shouldRetryQuery,
            staleTime: 30_000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ToastViewport />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

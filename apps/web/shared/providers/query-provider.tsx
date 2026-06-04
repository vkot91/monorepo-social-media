"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { type ReactNode, useState } from "react";

import { ApiRequestError } from "#/shared/lib/api/utils/errors";
import { showMutationErrorToast } from "#/shared/lib/query/mutation-toast";

type QueryProviderProps = {
  children: ReactNode;
};

const redirectToLogin = () => {
  // queryCache/mutationCache callbacks run outside React's render cycle,
  // so useRouter is unavailable here. A 401 is a hard session boundary —
  // a full navigation rather than a soft client-side push is appropriate.
  window.location.href = "/login";
};

const is401 = (error: unknown) => error instanceof ApiRequestError && error.status === 401;

export const QueryProvider = ({ children }: QueryProviderProps) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            if (is401(error)) redirectToLogin();
          },
        }),
        mutationCache: new MutationCache({
          onError: (error, _variables, _context, mutation) => {
            if (is401(error)) {
              redirectToLogin();
              return;
            }
            showMutationErrorToast(error, mutation.meta);
          },
        }),
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            // Retry is disabled globally — backendClient handles retries server-side
            // for transient errors (502/503/504). bffClient does not retry.
            retry: false,
            staleTime: 30_000,
          },
          mutations: {
            retry: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

export type HttpRequestWithMetadata = {
  headers?: Record<string, string | string[] | undefined>;
  method?: string;
  requestStartedAt?: number;
  url: string;
};

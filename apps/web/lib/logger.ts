type LogPayload = Record<string, unknown>;

export const logger = {
  error: (event: string, payload: LogPayload) => {
    // eslint-disable-next-line no-console
    console.error(event, payload);
  },
  info: (event: string, payload: LogPayload) => {
    // eslint-disable-next-line no-console
    console.info(event, payload);
  },
  warn: (event: string, payload: LogPayload) => {
    // eslint-disable-next-line no-console
    console.warn(event, payload);
  },
};

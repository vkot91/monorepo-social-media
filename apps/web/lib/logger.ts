type LogPayload = Record<string, unknown>;

const shouldWriteLogs = () => process.env.NODE_ENV !== "test";

export const logger = {
  error: (event: string, payload: LogPayload) => {
    if (!shouldWriteLogs()) {
      return;
    }

    // eslint-disable-next-line no-console
    console.error(event, payload);
  },
  info: (event: string, payload: LogPayload) => {
    if (!shouldWriteLogs()) {
      return;
    }

    // eslint-disable-next-line no-console
    console.info(event, payload);
  },
  warn: (event: string, payload: LogPayload) => {
    if (!shouldWriteLogs()) {
      return;
    }

    // eslint-disable-next-line no-console
    console.warn(event, payload);
  },
};

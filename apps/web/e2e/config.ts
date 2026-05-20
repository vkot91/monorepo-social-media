const parsePort = (name: string, value: string | undefined, fallback: number) => {
  const port = Number(value ?? fallback);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return port;
};

const webPort = parsePort("PLAYWRIGHT_PORT", process.env.PLAYWRIGHT_PORT, 3100);
const apiPort = parsePort("PLAYWRIGHT_API_PORT", process.env.PLAYWRIGHT_API_PORT ?? process.env.PORT, 3210);

export const e2eConfig = {
  apiPort,
  apiURL: `http://127.0.0.1:${apiPort}`,
  baseURL: `http://127.0.0.1:${webPort}`,
  webPort,
} as const;

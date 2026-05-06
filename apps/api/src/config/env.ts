import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { parseApiEnv, type ApiEnv } from "@social/env";

const ROOT_ENV_PATH = resolve(__dirname, "../../../../.env");
let cachedApiEnv: ApiEnv | undefined;

function parseEnvLine(line: string): [string, string] | null {
  const trimmedLine = line.trim();

  if (!trimmedLine || trimmedLine.startsWith("#")) {
    return null;
  }

  const separatorIndex = trimmedLine.indexOf("=");

  if (separatorIndex === -1) {
    return null;
  }

  const key = trimmedLine.slice(0, separatorIndex).trim();
  const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
  const value = rawValue.replace(/^(['"])(.*)\1$/, "$2");

  return [key, value];
}

export function loadRootEnv(envPath = ROOT_ENV_PATH) {
  if (!existsSync(envPath)) {
    return;
  }

  const fileContent = readFileSync(envPath, "utf8");

  for (const line of fileContent.split(/\r?\n/)) {
    const parsedLine = parseEnvLine(line);

    if (!parsedLine) {
      continue;
    }

    const [key, value] = parsedLine;
    process.env[key] ??= value;
  }
}

export function getApiEnv() {
  if (cachedApiEnv) {
    return cachedApiEnv;
  }

  loadRootEnv();
  cachedApiEnv = parseApiEnv();

  return cachedApiEnv;
}

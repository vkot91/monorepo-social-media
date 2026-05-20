import { parseApiEnv } from "@social/env";

export const env = parseApiEnv(); // reads process.env, throws if invalid

const DURATION_PATTERN = /^(\d+)(ms|s|m|h|d)$/;

const UNIT_TO_MS = {
  d: 24 * 60 * 60 * 1000,
  h: 60 * 60 * 1000,
  m: 60 * 1000,
  ms: 1,
  s: 1000,
} as const;

export function durationToMilliseconds(duration: string): number {
  const match = DURATION_PATTERN.exec(duration);

  if (!match) {
    throw new Error(`Unsupported duration format: ${duration}`);
  }

  const [, amount, unit] = match;
  return Number(amount) * UNIT_TO_MS[unit as keyof typeof UNIT_TO_MS];
}

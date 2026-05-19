export const themeCookieName = "social_theme";
export const themeCookieMaxAge = 60 * 60 * 24 * 365;

export const themePreferences = ["system", "light", "dark"] as const;

export type ThemePreference = (typeof themePreferences)[number];
export type ThemeAttribute = Exclude<ThemePreference, "system">;

export function parseThemePreference(value: unknown): ThemePreference {
  return themePreferences.find((theme) => theme === value) ?? "system";
}

export function getThemeAttribute(theme: ThemePreference): ThemeAttribute | undefined {
  return theme === "system" ? undefined : theme;
}

export function buildThemeCookie(theme: ThemePreference, secure = false) {
  return [
    `${themeCookieName}=${theme}`,
    "Path=/",
    `Max-Age=${themeCookieMaxAge}`,
    "SameSite=Lax",
    secure ? "Secure" : null,
  ]
    .filter(Boolean)
    .join("; ");
}

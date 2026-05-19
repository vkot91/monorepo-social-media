import { describe, expect, it } from "vitest";

import {
  buildThemeCookie,
  getThemeAttribute,
  parseThemePreference,
  themeCookieMaxAge,
  themeCookieName,
} from ".";

describe("theme preferences", () => {
  it("parses supported preferences and falls back to system", () => {
    expect(parseThemePreference("light")).toBe("light");
    expect(parseThemePreference("dark")).toBe("dark");
    expect(parseThemePreference("system")).toBe("system");
    expect(parseThemePreference("unknown")).toBe("system");
    expect(parseThemePreference(undefined)).toBe("system");
  });

  it("maps system preference to no html data attribute", () => {
    expect(getThemeAttribute("light")).toBe("light");
    expect(getThemeAttribute("dark")).toBe("dark");
    expect(getThemeAttribute("system")).toBeUndefined();
  });

  it("builds a persistent theme cookie", () => {
    expect(buildThemeCookie("dark")).toBe(
      `${themeCookieName}=dark; Path=/; Max-Age=${themeCookieMaxAge}; SameSite=Lax`,
    );
    expect(buildThemeCookie("light", true)).toBe(
      `${themeCookieName}=light; Path=/; Max-Age=${themeCookieMaxAge}; SameSite=Lax; Secure`,
    );
  });
});

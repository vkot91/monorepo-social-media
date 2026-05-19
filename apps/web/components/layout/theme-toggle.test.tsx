import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { themeCookieName } from "#/lib/theme";

import { ThemeToggle } from "./theme-toggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
    document.cookie = `${themeCookieName}=; Path=/; Max-Age=0`;
  });

  it("sets a concrete theme on the document and persists it", () => {
    render(<ThemeToggle initialTheme="system" />);

    fireEvent.click(screen.getByRole("button", { name: /theme preference: system/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /dark/i }));

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(document.cookie).toContain(`${themeCookieName}=dark`);
    expect(screen.getByRole("button", { name: /theme preference: dark/i })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /dark/i })).not.toBeInTheDocument();
  });

  it("removes the document theme attribute for system preference", () => {
    document.documentElement.dataset.theme = "dark";

    render(<ThemeToggle initialTheme="dark" />);

    fireEvent.click(screen.getByRole("button", { name: /theme preference: dark/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /system/i }));

    expect(document.documentElement).not.toHaveAttribute("data-theme");
    expect(document.cookie).toContain(`${themeCookieName}=system`);
    expect(screen.getByRole("button", { name: /theme preference: system/i })).toBeInTheDocument();
  });
});

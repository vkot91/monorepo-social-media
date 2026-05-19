"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useState } from "react";

import { DropdownMenu } from "#/components/ui/dropdown-menu";
import { buildThemeCookie, getThemeAttribute, type ThemePreference } from "#/lib/theme";

const themeOptions = [
  {
    icon: Monitor,
    label: "System",
    value: "system",
  },
  {
    icon: Sun,
    label: "Light",
    value: "light",
  },
  {
    icon: Moon,
    label: "Dark",
    value: "dark",
  },
] as const;

type ThemeToggleProps = {
  className?: string;
  initialTheme: ThemePreference;
};

export function ThemeToggle({ className, initialTheme }: ThemeToggleProps) {
  const [theme, setTheme] = useState(initialTheme);
  const selectedTheme = themeOptions.find((option) => option.value === theme) ?? themeOptions[0];
  const SelectedIcon = selectedTheme.icon;

  function selectTheme(nextTheme: ThemePreference) {
    const themeAttribute = getThemeAttribute(nextTheme);

    setTheme(nextTheme);

    if (themeAttribute) {
      document.documentElement.dataset.theme = themeAttribute;
    } else {
      document.documentElement.removeAttribute("data-theme");
    }

    document.cookie = buildThemeCookie(nextTheme, window.location.protocol === "https:");
  }

  return (
    <DropdownMenu
      className={className}
      items={themeOptions.map(({ icon, label, value }) => ({
        icon,
        label,
        onSelect: () => selectTheme(value),
      }))}
      label={`Theme preference: ${selectedTheme.label}`}
      trigger={<SelectedIcon aria-hidden className="h-5 w-5" />}
    />
  );
}

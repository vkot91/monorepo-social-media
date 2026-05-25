"use client";

import { Home, MessageCircle, Settings, User, Users } from "lucide-react";

import { NavigationLink } from "./navigation-link";

const navigationItems = [
  {
    href: "/feed",
    icon: Home,
    label: "Home",
  },
  {
    href: "/friends",
    icon: Users,
    label: "Friends",
  },
  {
    href: "/messages",
    icon: MessageCircle,
    label: "Messages",
  },
  {
    href: "/profile",
    icon: User,
    label: "Profile",
  },
  {
    href: "/settings",
    icon: Settings,
    label: "Settings",
  },
] as const;

type AppNavigationProps = {
  layout: "sidebar" | "topbar";
};

export function AppNavigation({ layout }: AppNavigationProps) {
  return (
    <nav
      aria-label="Primary navigation"
      className={
        layout === "sidebar"
          ? "grid gap-1.5"
          : "flex max-w-full gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      }
    >
      {navigationItems.map((item) => (
        <NavigationLink
          href={{ pathname: item.href }}
          icon={item.icon}
          key={item.href}
          label={item.label}
          layout={layout}
          path={item.href}
        />
      ))}
    </nav>
  );
}

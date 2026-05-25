import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DropdownMenu } from "./dropdown-menu";

describe("DropdownMenu", () => {
  it("opens menu items from the trigger", () => {
    render(
      <DropdownMenu
        items={[
          {
            href: "/profile",
            label: "Profile",
          },
        ]}
        label="Open account menu"
        trigger={<span>Avatar</span>}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /open account menu/i }));

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /profile/i })).toHaveAttribute(
      "href",
      "/profile",
    );
  });

  it("keeps the trigger content-sized by default", () => {
    render(
      <DropdownMenu
        items={[
          {
            href: "/profile",
            label: "Profile",
          },
        ]}
        label="Open account menu"
        trigger={<span>Account</span>}
      />,
    );

    expect(screen.getByRole("button", { name: /open account menu/i })).not.toHaveClass("w-10");
  });

  it("runs action items and closes the menu", () => {
    const onSelect = vi.fn();

    render(
      <DropdownMenu
        items={[
          {
            label: "Logout",
            onSelect,
          },
        ]}
        label="Open account menu"
        trigger={<span>Avatar</span>}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /open account menu/i }));
    const logoutItem = screen.getByRole("menuitem", { name: /logout/i });
    fireEvent.click(logoutItem);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(logoutItem.tagName).toBe("BUTTON");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes with escape and outside pointer interaction", () => {
    render(
      <div>
        <DropdownMenu
          items={[
            {
              href: "/profile",
              label: "Profile",
            },
          ]}
          label="Open account menu"
          trigger={<span>Avatar</span>}
        />
        <button type="button">Outside</button>
      </div>,
    );

    fireEvent.click(screen.getByRole("button", { name: /open account menu/i }));
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /open account menu/i }));
    fireEvent.pointerDown(screen.getByRole("button", { name: /outside/i }));

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});

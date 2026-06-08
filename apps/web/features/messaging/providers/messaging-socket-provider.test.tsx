import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useMessagingSocket } from "../hooks/use-messaging-socket";
import { MessagingSocketProvider } from "./messaging-socket-provider";

vi.mock("../hooks/use-messaging-socket", () => ({
  useMessagingSocket: vi.fn(),
}));

describe("MessagingSocketProvider", () => {
  it("mounts the socket hook and renders its children", () => {
    render(
      <MessagingSocketProvider>
        <span>child content</span>
      </MessagingSocketProvider>,
    );

    expect(useMessagingSocket).toHaveBeenCalled();
    expect(screen.getByText("child content")).toBeInTheDocument();
  });
});

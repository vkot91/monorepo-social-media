import { fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { useOutsideClick } from "./use-outside-click";

type TestComponentProps = {
  enabled?: boolean;
  onOutsideClick: () => void;
};

const TestComponent = ({ enabled, onOutsideClick }: TestComponentProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useOutsideClick({
    enabled,
    onOutsideClick,
    ref,
  });

  return (
    <div>
      <div ref={ref}>Inside</div>
      <button type="button">Outside</button>
    </div>
  );
};

describe("useOutsideClick", () => {
  it("calls the handler for pointer interactions outside the referenced element", () => {
    const onOutsideClick = vi.fn();

    render(<TestComponent onOutsideClick={onOutsideClick} />);

    fireEvent.pointerDown(screen.getByText("Inside"));
    expect(onOutsideClick).not.toHaveBeenCalled();

    fireEvent.pointerDown(screen.getByRole("button", { name: /outside/i }));
    expect(onOutsideClick).toHaveBeenCalledTimes(1);
  });

  it("does not register outside interactions when disabled", () => {
    const onOutsideClick = vi.fn();

    render(<TestComponent enabled={false} onOutsideClick={onOutsideClick} />);

    fireEvent.pointerDown(screen.getByRole("button", { name: /outside/i }));
    expect(onOutsideClick).not.toHaveBeenCalled();
  });
});

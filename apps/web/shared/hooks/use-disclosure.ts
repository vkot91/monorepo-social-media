"use client";

import { useCallback, useState } from "react";

type UseDisclosureOptions = {
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export const useDisclosure = ({ defaultOpen = false, onOpenChange }: UseDisclosureOptions = {}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const setOpen = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      onOpenChange?.(open);
    },
    [onOpenChange],
  );

  const open = useCallback(() => setOpen(true), [setOpen]);
  const close = useCallback(() => setOpen(false), [setOpen]);
  const toggle = useCallback(() => setOpen(!isOpen), [isOpen, setOpen]);

  return {
    close,
    isOpen,
    onOpenChange: setOpen,
    open,
    setOpen,
    toggle,
  };
};

"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";

import { Button } from "#/components/ui/button";
import { logout } from "#/lib/api/auth/actions";
import { cn } from "#/lib/utils";

type LogoutButtonProps = {
  className?: string;
};

export const LogoutButton = ({ className }: LogoutButtonProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    setIsSubmitting(true);
    await logout();
  }

  return (
    <Button className={cn(className)} loading={isSubmitting} onClick={handleLogout} size="sm" variant="secondary">
      {isSubmitting ? null : <LogOut aria-hidden className="mr-2 h-4 w-4" />}
      {isSubmitting ? "Signing out..." : "Sign out"}
    </Button>
  );
};

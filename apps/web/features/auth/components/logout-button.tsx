"use client";

import { useState } from "react";

import { Button } from "#/components/ui/button";
import { logout } from "#/lib/api/auth/actions";

export const LogoutButton = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    setIsSubmitting(true);
    await logout();
  }

  return (
    <Button  disabled={isSubmitting} onClick={handleLogout} size="sm" variant="secondary">
      {isSubmitting ? "Signing out..." : "Sign out"}
    </Button>
  );
};

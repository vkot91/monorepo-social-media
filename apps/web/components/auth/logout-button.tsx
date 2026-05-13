"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { authClientApi } from "#/lib/api/auth/client-actions";

export const LogoutButton = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    setIsSubmitting(true);
    await authClientApi.logout();
    router.replace("/login");
    router.refresh();
  }

  return (
    <Button disabled={isSubmitting} onClick={handleLogout} size="sm" variant="secondary">
      {isSubmitting ? "Signing out..." : "Sign out"}
    </Button>
  );
};

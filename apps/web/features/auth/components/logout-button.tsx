"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "#/components/ui/button";
import { useAuthStore } from "#/lib/store/auth";
import { cn } from "#/lib/utils";

import { logout } from "../lib/mutations";
import { authKeys } from "../lib/routes";

type LogoutButtonProps = {
  className?: string;
};

export const LogoutButton = ({ className }: LogoutButtonProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const logoutMutation = useMutation({
    mutationFn: logout,
  });
  const { clearUser } = useAuthStore();

  const handleLogout = async () => {
    clearUser();
    queryClient.removeQueries({ queryKey: authKeys.all });
    await logoutMutation.mutateAsync();
    router.replace("/login");
    router.refresh();
  };

  return (
    <Button
      className={cn(className)}
      loading={logoutMutation.isPending}
      onClick={handleLogout}
      size="sm"
      variant="secondary"
    >
      {logoutMutation.isPending ? null : <LogOut aria-hidden className="mr-2 h-4 w-4" />}
      {logoutMutation.isPending ? "Signing out..." : "Sign out"}
    </Button>
  );
};

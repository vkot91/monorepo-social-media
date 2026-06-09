import { Globe, Users } from "lucide-react";

export const visibilityConfig = {
  PUBLIC: { label: "Public", Icon: Globe },
  FRIENDS: { label: "Friends", Icon: Users },
} as const;

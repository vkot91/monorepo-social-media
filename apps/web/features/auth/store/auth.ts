import { AuthUserDto } from "@social/contracts";
import { create } from "zustand";

interface AuthStore {
  user: AuthUserDto | null;
  setUser: (user: AuthUserDto | null) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));

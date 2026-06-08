import { create } from "zustand";

type PresenceStore = {
  onlineUserIds: Set<string>;
  setOnline: (userId: string) => void;
  setOffline: (userId: string) => void;
};

export const usePresenceStore = create<PresenceStore>((set) => ({
  onlineUserIds: new Set<string>(),
  setOnline: (userId) =>
    set((state) => {
      if (state.onlineUserIds.has(userId)) {
        return state;
      }

      const next = new Set(state.onlineUserIds);
      next.add(userId);

      return { onlineUserIds: next };
    }),
  setOffline: (userId) =>
    set((state) => {
      if (!state.onlineUserIds.has(userId)) {
        return state;
      }

      const next = new Set(state.onlineUserIds);
      next.delete(userId);

      return { onlineUserIds: next };
    }),
}));

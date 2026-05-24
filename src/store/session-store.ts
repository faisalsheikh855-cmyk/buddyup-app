import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Session } from "@supabase/supabase-js";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type SessionState = {
  session: Session | null;
  previewMode: boolean;
  authReady: boolean;
  onboarded: boolean;
  storageReady: boolean;
  setSession: (session: Session | null) => void;
  startPreview: () => void;
  stopPreview: () => void;
  setAuthReady: (ready: boolean) => void;
  finishOnboarding: () => void;
  setStorageReady: (ready: boolean) => void;
  reset: () => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      session: null,
      previewMode: false,
      authReady: false,
      onboarded: false,
      storageReady: false,
      setSession: (session) => set({ session, previewMode: false }),
      startPreview: () => set({ previewMode: true }),
      stopPreview: () => set({ previewMode: false }),
      setAuthReady: (authReady) => set({ authReady }),
      finishOnboarding: () => set({ onboarded: true }),
      setStorageReady: (storageReady) => set({ storageReady }),
      reset: () => set({ session: null, previewMode: false, onboarded: false }),
    }),
    {
      name: "buddyup-session",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ onboarded: state.onboarded }),
      // Static web output renders before browser storage exists; hydrate after mount.
      skipHydration: true,
    },
  ),
);

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Session } from "@supabase/supabase-js";
import { create } from "zustand";

const STORAGE_KEY = "buddyup-session";

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
  hydrate: () => Promise<void>;
  reset: () => void;
};

async function persistOnboarding(onboarded: boolean) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ onboarded }));
}

export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  previewMode: false,
  authReady: false,
  onboarded: false,
  storageReady: false,
  setSession: (session) => set({ session, previewMode: false }),
  startPreview: () => set({ previewMode: true }),
  stopPreview: () => set({ previewMode: false }),
  setAuthReady: (authReady) => set({ authReady }),
  finishOnboarding: () => {
    set({ onboarded: true });
    void persistOnboarding(true).catch(() => undefined);
  },
  setStorageReady: (storageReady) => set({ storageReady }),
  hydrate: async () => {
    try {
      const rawValue = await AsyncStorage.getItem(STORAGE_KEY);
      if (!rawValue) return;
      const stored = JSON.parse(rawValue) as { onboarded?: boolean; state?: { onboarded?: boolean } };
      const onboarded = stored.onboarded ?? stored.state?.onboarded;
      if (typeof onboarded === "boolean") set({ onboarded });
    } catch {
      // A denied or corrupt browser storage record should not block app startup.
    } finally {
      set({ storageReady: true });
    }
  },
  reset: () => {
    set({ session: null, previewMode: false, onboarded: false });
    void persistOnboarding(false).catch(() => undefined);
  },
}));

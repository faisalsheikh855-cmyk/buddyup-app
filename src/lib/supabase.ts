import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, processLock } from "@supabase/supabase-js";
import { Platform } from "react-native";
import "react-native-url-polyfill/auto";

type RuntimeEnv = {
  EXPO_PUBLIC_SUPABASE_URL?: string;
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
  EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
};

declare global {
  interface Window {
    BUDDYUP_ENV?: RuntimeEnv;
  }
}

const runtimeEnv =
  Platform.OS === "web" && typeof window !== "undefined" ? window.BUDDYUP_ENV : undefined;

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? runtimeEnv?.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  runtimeEnv?.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  runtimeEnv?.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const canUseRuntimeStorage = Platform.OS !== "web" || typeof window !== "undefined";

export const isSupabaseConfigured = Boolean(url && publishableKey && canUseRuntimeStorage);

export const supabase = isSupabaseConfigured
  ? createClient(url!, publishableKey!, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === "web",
        lock: processLock,
      },
    })
  : null;

import type { Session } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";
import { ensureProfile } from "@/features/profile/api";

type Credentials = {
  email: string;
  password: string;
};

function getBaseUrl() {
  const baseUrl = process.env.EXPO_BASE_URL ?? "";
  return baseUrl ? `/${baseUrl.replace(/^\/+/, "").replace(/\/$/, "")}` : "";
}

function getEmailRedirectTo() {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `${window.location.origin}${getBaseUrl()}/auth`;
  }

  return Linking.createURL("auth");
}

export async function signIn(credentials: Credentials): Promise<Session> {
  if (!supabase) throw new Error("Add your Supabase environment keys to enable sign in.");
  const { data, error } = await supabase.auth.signInWithPassword(credentials);
  if (error) throw error;
  if (!data.session) throw new Error("No active session was returned.");
  await ensureProfile(data.session);
  return data.session;
}

export async function signUp(credentials: Credentials): Promise<Session | null> {
  if (!supabase) throw new Error("Add your Supabase environment keys to enable sign up.");
  const { data, error } = await supabase.auth.signUp({
    ...credentials,
    options: {
      emailRedirectTo: getEmailRedirectTo(),
    },
  });
  if (error) throw error;
  if (data.session) await ensureProfile(data.session);
  return data.session;
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

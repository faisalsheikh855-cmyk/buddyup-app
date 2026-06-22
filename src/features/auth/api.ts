import type { Session } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";
import { ensureProfile } from "@/features/profile/api";

type Credentials = {
  email: string;
  password: string;
  fullName?: string;
};

function getBaseUrl() {
  const baseUrl = process.env.EXPO_BASE_URL ?? "";
  return baseUrl ? `/${baseUrl.replace(/^\/+/, "").replace(/\/$/, "")}` : "";
}

function getRedirectTo(path: string) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `${window.location.origin}${getBaseUrl()}${path}`;
  }

  return Linking.createURL(path.replace(/^\//, ""));
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
    email: credentials.email,
    password: credentials.password,
    options: {
      emailRedirectTo: getRedirectTo("/auth"),
      data: credentials.fullName ? { full_name: credentials.fullName.trim() } : undefined,
    },
  });
  if (error) throw error;
  if (data.session) await ensureProfile(data.session);
  return data.session;
}

export async function requestPasswordReset(email: string) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: getRedirectTo("/auth"),
  });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function resendSignupConfirmation(email: string) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: email.trim(),
    options: { emailRedirectTo: getRedirectTo("/auth") },
  });
  if (error) throw error;
}

export async function deleteCurrentAccount() {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Sign in to delete your account.");

  const pageSize = 100;
  for (const bucket of ["avatars", "profile-photos", "selfie-verifications"]) {
    for (;;) {
      const { data: files, error: listError } = await supabase.storage
        .from(bucket)
        .list(userData.user.id, { limit: pageSize });
      if (listError) throw listError;
      const batch = files ?? [];
      if (batch.length === 0) break;
      const paths = batch.map((file) => `${userData.user!.id}/${file.name}`);
      const { error: removeError } = await supabase.storage.from(bucket).remove(paths);
      if (removeError) throw removeError;
      if (batch.length < pageSize) break;
    }
  }

  const { error } = await supabase.rpc("delete_current_account");
  if (error) throw error;
  await supabase.auth.signOut({ scope: "local" });
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

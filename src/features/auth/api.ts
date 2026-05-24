import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type Credentials = {
  email: string;
  password: string;
};

export async function signIn(credentials: Credentials): Promise<Session> {
  if (!supabase) throw new Error("Add your Supabase environment keys to enable sign in.");
  const { data, error } = await supabase.auth.signInWithPassword(credentials);
  if (error) throw error;
  if (!data.session) throw new Error("No active session was returned.");
  return data.session;
}

export async function signUp(credentials: Credentials): Promise<Session | null> {
  if (!supabase) throw new Error("Add your Supabase environment keys to enable sign up.");
  const { data, error } = await supabase.auth.signUp(credentials);
  if (error) throw error;
  return data.session;
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

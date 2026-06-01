import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type Profile = {
  id: string;
  name: string;
  age: number;
  neighborhood: string;
  bio: string | null;
  interests: string[];
  availability: string;
  radius_km: number;
  avatar: string | null;
  created_at: string;
};

export async function ensureProfile(session: Session): Promise<Profile> {
  if (!supabase) throw new Error("Add your Supabase environment keys to enable profiles.");

  const user = session.user;
  const { data: existing, error: readError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (readError) throw readError;
  if (existing) return existing as Profile;

  const fallbackName =
    user.user_metadata?.name ??
    user.email?.split("@")[0]?.replace(/[._-]+/g, " ") ??
    "BuddyUp user";

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      name: fallbackName,
      age: 18,
      neighborhood: "Vancouver",
      bio: "Ready to join local activities.",
      interests: ["Tennis", "Badminton", "Chess"],
      availability: "Flexible",
      radius_km: 8,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  if (!supabase) return null;
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData.session) return null;
  return ensureProfile(sessionData.session);
}

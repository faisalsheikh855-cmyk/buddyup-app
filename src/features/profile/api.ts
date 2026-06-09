import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

type ProfileRow = {
  id: string;
  full_name: string;
  username: string | null;
  city: string | null;
  bio: string | null;
  avatar_url: string | null;
  phone: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  selfie_verified: boolean;
  verification_status: VerificationStatus;
  verification_rejection_reason: string | null;
  interests: string[];
  trust_score: number;
  is_admin: boolean;
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
};

export type Profile = ProfileRow & {
  name: string;
  neighborhood: string;
  avatar: string | null;
  phone_number: string | null;
  selfie_verification_status: "not_started" | "pending" | "approved" | "rejected";
  photo_urls: string[];
};

export type ProfileUpdate = {
  full_name: string;
  username: string | null;
  city: string;
  bio: string;
  interests: string[];
  phone: string | null;
};

export type SelfieVerification = {
  id: string;
  user_id: string;
  selfie_url: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type PendingSelfieVerification = SelfieVerification & {
  signedSelfieUrl: string;
  profile: Profile;
};

function normalizeProfile(row: ProfileRow): Profile {
  return {
    ...row,
    interests: row.interests ?? [],
    name: row.full_name,
    neighborhood: row.city ?? "",
    avatar: row.avatar_url,
    phone_number: row.phone,
    selfie_verification_status: row.selfie_verified
      ? "approved"
      : row.verification_status === "pending"
        ? "pending"
        : row.verification_status === "rejected"
          ? "rejected"
          : "not_started",
    photo_urls: row.avatar_url ? [row.avatar_url] : [],
  };
}

async function requireSession() {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session) throw new Error("Sign in to continue.");
  return data.session;
}

function fileDetails(uri: string) {
  const cleanUri = uri.split("?")[0];
  const extension = cleanUri.match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase() ?? "jpg";
  return {
    extension,
    contentType: extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : "image/jpeg",
  };
}

async function uploadImage(bucket: string, path: string, uri: string) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const response = await fetch(uri);
  if (!response.ok) throw new Error("Could not read the selected image.");
  const { contentType } = fileDetails(uri);
  const { error } = await supabase.storage.from(bucket).upload(path, await response.arrayBuffer(), {
    contentType,
    upsert: true,
  });
  if (error) throw error;
}

export async function ensureProfile(session: Session): Promise<Profile> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.rpc("get_current_profile").single();
  if (error) throw error;
  return normalizeProfile(data as ProfileRow);
}

export async function getCurrentProfile(): Promise<Profile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session ? ensureProfile(data.session) : null;
}

export async function updateCurrentProfile(update: ProfileUpdate): Promise<Profile> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const session = await requireSession();
  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", session.user.id);
  if (error) throw error;
  return ensureProfile(session);
}

export async function uploadAvatar(uri: string): Promise<Profile> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const session = await requireSession();
  const { extension } = fileDetails(uri);
  const path = `${session.user.id}/avatar.${extension}`;
  await uploadImage("avatars", path, uri);
  const publicUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: `${publicUrl}?v=${Date.now()}` })
    .eq("id", session.user.id);
  if (error) throw error;
  return ensureProfile(session);
}

export async function submitSelfieVerification(uri: string): Promise<Profile> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const session = await requireSession();
  const { extension } = fileDetails(uri);
  const path = `${session.user.id}/${Date.now()}.${extension}`;
  await uploadImage("selfie-verifications", path, uri);
  const { error } = await supabase.rpc("submit_selfie_verification", { selfie_path: path });
  if (error) throw error;
  return ensureProfile(session);
}

export async function getMySelfieVerification(): Promise<SelfieVerification | null> {
  if (!supabase) return null;
  const session = await requireSession();
  const { data, error } = await supabase
    .from("selfie_verifications")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as SelfieVerification | null;
}

export async function listPendingSelfieVerifications(): Promise<PendingSelfieVerification[]> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const client = supabase;
  const { data, error } = await client
    .from("selfie_verifications")
    .select(`
      *,
      profile:profiles!selfie_verifications_user_id_fkey(
        id, full_name, username, city, bio, avatar_url,
        email_verified, phone_verified, selfie_verified, verification_status,
        interests, trust_score, created_at, updated_at
      )
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) throw error;

  return Promise.all((data ?? []).map(async (item) => {
    const { data: signed, error: signError } = await client.storage
      .from("selfie-verifications")
      .createSignedUrl(item.selfie_url, 900);
    if (signError) throw signError;
    return {
      ...(item as unknown as SelfieVerification),
      profile: normalizeProfile(item.profile as ProfileRow),
      signedSelfieUrl: signed.signedUrl,
    };
  }));
}

export async function reviewSelfieVerification({
  verificationId,
  decision,
  rejectionReason,
}: {
  verificationId: string;
  decision: "approved" | "rejected";
  rejectionReason?: string;
}) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.rpc("review_selfie_verification", {
    verification_id: verificationId,
    decision,
    rejection_reason: rejectionReason ?? null,
  });
  if (error) throw error;
}

export function isProfileVerified(profile: Profile | null | undefined) {
  return Boolean(
    profile?.email_verified &&
    profile.avatar_url &&
    profile.selfie_verified &&
    profile.verification_status === "verified",
  );
}

export const isProfileReady = isProfileVerified;

export function getVerificationChecklist(profile: Profile | null | undefined) {
  return {
    email: Boolean(profile?.email_verified),
    photo: Boolean(profile?.avatar_url),
    selfie: Boolean(profile?.selfie_verified),
  };
}

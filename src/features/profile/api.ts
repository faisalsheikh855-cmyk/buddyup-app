import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { PreparedImage } from "@/lib/media";

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

export type ProfilePhoto = {
  id: string;
  user_id: string;
  photo_url: string;
  storage_path: string;
  position: number;
  created_at: string;
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

async function uploadImage(bucket: string, path: string, image: PreparedImage) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.storage.from(bucket).upload(path, image.bytes, {
    contentType: image.contentType,
    cacheControl: "3600",
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

export async function getProfileById(id: string): Promise<Profile> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      id, full_name, username, city, bio, avatar_url,
      email_verified, phone_verified, selfie_verified, verification_status,
      interests, trust_score, created_at, updated_at
    `)
    .eq("id", id)
    .single();
  if (error) throw error;
  return normalizeProfile({
    ...data,
    phone: null,
    verification_rejection_reason: null,
    is_admin: false,
    is_blocked: false,
  } as ProfileRow);
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

export async function uploadAvatar(image: PreparedImage): Promise<Profile> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const session = await requireSession();
  const path = `${session.user.id}/avatar.${image.extension}`;
  await uploadImage("avatars", path, image);
  const publicUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: `${publicUrl}?v=${Date.now()}` })
    .eq("id", session.user.id);
  if (error) throw error;
  return ensureProfile(session);
}

export async function listProfilePhotos(userId?: string): Promise<ProfilePhoto[]> {
  if (!supabase) return [];
  const session = await requireSession();
  const { data, error } = await supabase
    .from("profile_photos")
    .select("*")
    .eq("user_id", userId ?? session.user.id)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ProfilePhoto[];
}

export async function uploadProfilePhoto(image: PreparedImage): Promise<ProfilePhoto> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const session = await requireSession();
  const { data: existing, error: existingError } = await supabase
    .from("profile_photos")
    .select("position")
    .eq("user_id", session.user.id)
    .order("position");
  if (existingError) throw existingError;
  if ((existing?.length ?? 0) >= 6) throw new Error("You can add up to 6 profile photos.");

  const used = new Set((existing ?? []).map((photo) => photo.position));
  const position = Array.from({ length: 6 }, (_, index) => index).find((index) => !used.has(index));
  if (position === undefined) throw new Error("You can add up to 6 profile photos.");

  const path = `${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  await uploadImage("profile-photos", path, image);
  const photoUrl = supabase.storage.from("profile-photos").getPublicUrl(path).data.publicUrl;
  const { data, error } = await supabase
    .from("profile_photos")
    .insert({
      user_id: session.user.id,
      photo_url: photoUrl,
      storage_path: path,
      position,
    })
    .select("*")
    .single();
  if (error) {
    await supabase.storage.from("profile-photos").remove([path]);
    throw error;
  }
  return data as ProfilePhoto;
}

export async function deleteProfilePhoto(photo: ProfilePhoto) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const session = await requireSession();
  if (photo.user_id !== session.user.id) throw new Error("You can only delete your own photos.");
  const { error } = await supabase.from("profile_photos").delete().eq("id", photo.id);
  if (error) throw error;
  const { error: storageError } = await supabase.storage.from("profile-photos").remove([photo.storage_path]);
  if (storageError) throw storageError;
}

export async function submitSelfieVerification(image: PreparedImage): Promise<Profile> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const session = await requireSession();
  const path = `${session.user.id}/${Date.now()}.${image.extension}`;
  await uploadImage("selfie-verifications", path, image);
  const { error } = await supabase.rpc("submit_selfie_verification", { selfie_path: path });
  if (error) {
    await supabase.storage.from("selfie-verifications").remove([path]);
    throw error;
  }
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

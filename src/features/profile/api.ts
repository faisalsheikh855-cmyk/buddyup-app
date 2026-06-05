import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type VerificationStatus = "not_started" | "pending" | "verified" | "rejected";
export type DocumentType = "drivers_license" | "passport" | "national_id";

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
  photo_urls: string[];
  verification_status: VerificationStatus;
  verification_submitted_at: string | null;
  created_at: string;
};

export type ProfileUpdate = Pick<
  Profile,
  "name" | "age" | "neighborhood" | "bio" | "interests" | "availability" | "radius_km"
>;

export type IdentitySubmission = {
  documentType: DocumentType;
  documentFrontUri: string;
  documentBackUri?: string | null;
  selfieUri: string;
};

function normalizeProfile(profile: Partial<Profile> & Pick<Profile, "id">): Profile {
  return {
    name: "BuddyUp user",
    age: 18,
    neighborhood: "Vancouver",
    bio: "",
    interests: [],
    availability: "Flexible",
    radius_km: 8,
    avatar: null,
    photo_urls: [],
    verification_status: "not_started",
    verification_submitted_at: null,
    created_at: new Date(0).toISOString(),
    ...profile,
  };
}

async function getSession() {
  if (!supabase) throw new Error("Add your Supabase environment keys to enable profiles.");
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session) throw new Error("Sign in to manage your profile.");
  return data.session;
}

function getFileDetails(uri: string, fallbackName: string) {
  const cleanUri = uri.split("?")[0];
  const extension = cleanUri.match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase() ?? "jpg";
  const contentType =
    extension === "png" ? "image/png" :
    extension === "webp" ? "image/webp" :
    "image/jpeg";
  return { extension, contentType, fileName: `${fallbackName}.${extension}` };
}

async function uploadImage(bucket: string, path: string, uri: string) {
  if (!supabase) throw new Error("Add your Supabase environment keys to upload photos.");
  const response = await fetch(uri);
  if (!response.ok) throw new Error("Could not read the selected image.");
  const file = await response.arrayBuffer();
  const { contentType } = getFileDetails(uri, path);
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType,
    upsert: true,
  });
  if (error) throw error;
}

export async function ensureProfile(session: Session): Promise<Profile> {
  if (!supabase) throw new Error("Add your Supabase environment keys to enable profiles.");

  const user = session.user;
  const { data: existing, error: readError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (readError) throw readError;
  if (existing) return normalizeProfile(existing as Profile);

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
  return normalizeProfile(data as Profile);
}

export async function getCurrentProfile(): Promise<Profile | null> {
  if (!supabase) return null;
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData.session) return null;
  return ensureProfile(sessionData.session);
}

export async function updateCurrentProfile(update: ProfileUpdate): Promise<Profile> {
  if (!supabase) throw new Error("Add your Supabase environment keys to update profiles.");
  const session = await getSession();
  const { data, error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", session.user.id)
    .select("*")
    .single();
  if (error) throw error;
  return normalizeProfile(data as Profile);
}

export async function uploadProfilePhotos(uris: string[]): Promise<Profile> {
  if (!supabase) throw new Error("Add your Supabase environment keys to upload photos.");
  const client = supabase;
  if (uris.length < 5) throw new Error("Add at least 5 recent photos.");
  const session = await getSession();
  const urls = await Promise.all(
    uris.map(async (uri, index) => {
      const { fileName } = getFileDetails(uri, `profile-${index + 1}`);
      const path = `${session.user.id}/${fileName}`;
      await uploadImage("profile-photos", path, uri);
      return client.storage.from("profile-photos").getPublicUrl(path).data.publicUrl;
    }),
  );

  const { data, error } = await client
    .from("profiles")
    .update({ photo_urls: urls, avatar: urls[0] })
    .eq("id", session.user.id)
    .select("*")
    .single();
  if (error) throw error;
  return normalizeProfile(data as Profile);
}

export async function submitIdentityVerification(submission: IdentitySubmission): Promise<Profile> {
  if (!supabase) throw new Error("Add your Supabase environment keys to verify identity.");
  const session = await getSession();
  const submissionId = `${Date.now()}`;
  const front = getFileDetails(submission.documentFrontUri, "document-front");
  const selfie = getFileDetails(submission.selfieUri, "selfie");
  const frontPath = `${session.user.id}/${submissionId}/${front.fileName}`;
  const selfiePath = `${session.user.id}/${submissionId}/${selfie.fileName}`;

  await uploadImage("identity-documents", frontPath, submission.documentFrontUri);
  await uploadImage("identity-documents", selfiePath, submission.selfieUri);

  let backPath: string | null = null;
  if (submission.documentBackUri) {
    const back = getFileDetails(submission.documentBackUri, "document-back");
    backPath = `${session.user.id}/${submissionId}/${back.fileName}`;
    await uploadImage("identity-documents", backPath, submission.documentBackUri);
  }

  const { error: submissionError } = await supabase.rpc("submit_identity_verification", {
    p_document_type: submission.documentType,
    p_document_front_path: frontPath,
    p_document_back_path: backPath,
    p_selfie_path: selfiePath,
  });
  if (submissionError) throw submissionError;

  return ensureProfile(session);
}

export function isProfileReady(profile: Profile | null | undefined) {
  return Boolean(
    profile &&
    profile.name.trim() &&
    profile.bio?.trim() &&
    profile.interests.length >= 3 &&
    profile.photo_urls.length >= 5 &&
    profile.verification_status === "verified",
  );
}

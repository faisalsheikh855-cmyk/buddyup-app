import { supabase } from "@/lib/supabase";
import { getCurrentProfile } from "@/features/profile/api";
import type { Profile } from "@/features/profile/api";

export type BlockedMember = {
  id: string;
  blocked_user_id: string;
  created_at: string;
  profile: Profile | null;
};

export type SafetyReport = {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  activity_id: string | null;
  reason: string;
  details: string | null;
  status: "open" | "reviewed" | "dismissed" | "action_taken";
  created_at: string;
  reporter: Pick<Profile, "id" | "full_name" | "username"> | null;
  reported: Pick<Profile, "id" | "full_name" | "username"> | null;
};

function requireClient() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

export async function reportUser({
  reportedUserId,
  activityId,
  reason,
  details,
}: {
  reportedUserId: string;
  activityId?: string;
  reason: string;
  details?: string;
}) {
  const client = requireClient();
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Sign in to report a user.");
  const { error } = await client.from("reports").insert({
    reporter_id: profile.id,
    reported_user_id: reportedUserId,
    activity_id: activityId ?? null,
    reason,
    details: details ?? null,
  });
  if (error) throw error;
}

export async function blockUser(blockedUserId: string) {
  const client = requireClient();
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Sign in to block a user.");
  const { error } = await client.from("blocks").upsert(
    { blocker_id: profile.id, blocked_user_id: blockedUserId },
    { onConflict: "blocker_id,blocked_user_id" },
  );
  if (error) throw error;
}

export async function unblockUser(blockedUserId: string) {
  const client = requireClient();
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Sign in to unblock a user.");
  const { error } = await client
    .from("blocks")
    .delete()
    .eq("blocker_id", profile.id)
    .eq("blocked_user_id", blockedUserId);
  if (error) throw error;
}

export async function listBlockedUsers(): Promise<BlockedMember[]> {
  const client = requireClient();
  const profile = await getCurrentProfile();
  if (!profile) return [];
  const { data, error } = await client
    .from("blocks")
    .select(`
      id, blocked_user_id, created_at,
      profile:profiles!blocks_blocked_user_id_fkey(
        id, full_name, username, city, bio, avatar_url,
        email_verified, phone_verified, selfie_verified, verification_status,
        interests, trust_score, created_at, updated_at
      )
    `)
    .eq("blocker_id", profile.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((item) => {
    const value = item.profile as unknown as Profile | null;
    return {
      id: item.id,
      blocked_user_id: item.blocked_user_id,
      created_at: item.created_at,
      profile: value ? {
        ...value,
        name: value.full_name,
        neighborhood: value.city ?? "",
        avatar: value.avatar_url,
        phone: null,
        phone_number: null,
        verification_rejection_reason: null,
        is_admin: false,
        is_blocked: false,
        selfie_verification_status: value.selfie_verified
          ? "approved"
          : value.verification_status === "pending"
            ? "pending"
            : value.verification_status === "rejected"
              ? "rejected"
              : "not_started",
        photo_urls: value.avatar_url ? [value.avatar_url] : [],
      } : null,
    };
  });
}

export async function submitSafetyCheckin({
  activityId,
  status,
  notes,
}: {
  activityId: string;
  status: "safe" | "issue_reported";
  notes?: string;
}) {
  const client = requireClient();
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Sign in to submit a safety check-in.");
  const { error } = await client.from("safety_checkins").upsert(
    {
      activity_id: activityId,
      user_id: profile.id,
      status,
      notes: notes ?? null,
    },
    { onConflict: "activity_id,user_id" },
  );
  if (error) throw error;
}

export async function listAdminReports(): Promise<SafetyReport[]> {
  const { data, error } = await requireClient()
    .from("reports")
    .select(`
      *,
      reporter:profiles!reports_reporter_id_fkey(id, full_name, username),
      reported:profiles!reports_reported_user_id_fkey(id, full_name, username)
    `)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as unknown as SafetyReport[];
}

export async function updateReportStatus({
  reportId,
  status,
}: {
  reportId: string;
  status: SafetyReport["status"];
}) {
  const { error } = await requireClient()
    .from("reports")
    .update({ status })
    .eq("id", reportId);
  if (error) throw error;
}

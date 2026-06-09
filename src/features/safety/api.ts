import { supabase } from "@/lib/supabase";
import { getCurrentProfile } from "@/features/profile/api";

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

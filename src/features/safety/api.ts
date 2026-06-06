import { supabase } from "@/lib/supabase";
import { getCurrentProfile } from "@/features/profile/api";

function requireClient() {
  if (!supabase) throw new Error("Add your Supabase environment keys to use safety tools.");
  return supabase;
}

export async function reportUser({
  reportedUserId,
  activityId,
  reason,
}: {
  reportedUserId: string;
  activityId?: string;
  reason: string;
}) {
  const client = requireClient();
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Sign in to report a user.");
  const { error } = await client.from("user_reports").insert({
    reporter_id: profile.id,
    reported_user_id: reportedUserId,
    activity_id: activityId ?? null,
    reason,
  });
  if (error) throw error;
}

export async function blockUser(blockedUserId: string) {
  const client = requireClient();
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Sign in to block a user.");
  const { error } = await client.from("user_blocks").upsert({
    blocker_id: profile.id,
    blocked_user_id: blockedUserId,
  });
  if (error) throw error;
}

export async function submitSafetyCheckin({
  activityId,
  status,
}: {
  activityId: string;
  status: "safe" | "need_help";
}) {
  const client = requireClient();
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Sign in to submit a safety check-in.");
  const { error } = await client.from("safety_checkins").upsert(
    {
      activity_id: activityId,
      profile_id: profile.id,
      status,
    },
    { onConflict: "activity_id,profile_id" },
  );
  if (error) throw error;
}

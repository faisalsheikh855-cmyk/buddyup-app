import { supabase } from "@/lib/supabase";
import { getCurrentProfile, isProfileVerified, type Profile } from "@/features/profile/api";

export type Activity = {
  id: string;
  created_by: string;
  title: string;
  description: string | null;
  category: string;
  city: string | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  activity_date: string | null;
  activity_time: string | null;
  max_people: number;
  status: "open" | "full" | "cancelled" | "completed";
  visibility: "public" | "private";
  created_at: string;
  updated_at: string;
  host?: Profile | null;
  request_status?: "pending" | "accepted" | "declined" | "cancelled" | null;
  date_label: string;
  starts_at: string;
  location: string;
  spots: number;
  pace: string;
  distance_km: number | null;
};

export type ActivityDraft = {
  title: string;
  category: string;
  city: string;
  locationName: string;
  activityDate: string;
  activityTime: string;
  maxPeople: number;
  description: string;
};

export type ActivityRequest = {
  id: string;
  activity_id: string;
  requester_id: string;
  host_id: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  message: string | null;
  created_at: string;
  updated_at: string;
  activity?: Activity | null;
  requester?: Profile | null;
};

function requireClient() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

const publicProfileColumns = `
  id, full_name, username, city, bio, avatar_url,
  email_verified, phone_verified, selfie_verified, verification_status,
  interests, trust_score, created_at, updated_at
`;

function normalizeRelatedProfile(value: unknown): Profile | null {
  if (!value) return null;
  const row = value as Profile;
  return {
    ...row,
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

function normalizeActivity(row: Record<string, unknown>): Activity {
  const activityDate = row.activity_date as string | null;
  const activityTime = row.activity_time as string | null;
  return {
    ...(row as unknown as Activity),
    host: normalizeRelatedProfile(row.host),
    date_label: activityDate ? new Date(`${activityDate}T12:00:00`).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }) : "Date to confirm",
    starts_at: activityTime ? activityTime.slice(0, 5) : "Time to confirm",
    location: (row.location_name as string | null) ?? (row.city as string | null) ?? "Location to confirm",
    spots: (row.max_people as number) ?? 2,
    pace: "All levels",
    distance_km: null,
  };
}

export async function listActivities(): Promise<Activity[]> {
  const client = requireClient();
  const profile = await getCurrentProfile();
  const { data, error } = await client
    .from("activities")
    .select(`*, host:profiles!activities_created_by_fkey(${publicProfileColumns})`)
    .eq("visibility", "public")
    .in("status", ["open", "full"])
    .order("activity_date", { ascending: true, nullsFirst: false })
    .order("activity_time", { ascending: true, nullsFirst: false })
    .limit(50);
  if (error) throw error;
  const activities = (data ?? []).map((row) => normalizeActivity(row));
  if (!profile || activities.length === 0) return activities;

  const { data: requests, error: requestError } = await client
    .from("activity_requests")
    .select("activity_id, status")
    .eq("requester_id", profile.id)
    .in("activity_id", activities.map((activity) => activity.id));
  if (requestError) throw requestError;
  const statuses = new Map((requests ?? []).map((request) => [request.activity_id, request.status]));
  return activities.map((activity) => ({
    ...activity,
    request_status: (statuses.get(activity.id) as Activity["request_status"]) ?? null,
  }));
}

export async function getActivity(id: string): Promise<Activity> {
  const client = requireClient();
  const profile = await getCurrentProfile();
  const { data, error } = await client
    .from("activities")
    .select(`*, host:profiles!activities_created_by_fkey(${publicProfileColumns})`)
    .eq("id", id)
    .single();
  if (error) throw error;
  const activity = normalizeActivity(data);
  if (!profile) return activity;
  const { data: request, error: requestError } = await client
    .from("activity_requests")
    .select("status")
    .eq("activity_id", id)
    .eq("requester_id", profile.id)
    .maybeSingle();
  if (requestError) throw requestError;
  return { ...activity, request_status: (request?.status as Activity["request_status"]) ?? null };
}

export async function createActivity(draft: ActivityDraft): Promise<Activity> {
  const client = requireClient();
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Sign in to create an activity.");
  if (!isProfileVerified(profile)) {
    throw new Error("To keep BuddyUp safe, only verified members can create activities or send join requests.");
  }
  const { data, error } = await client
    .from("activities")
    .insert({
      created_by: profile.id,
      title: draft.title,
      category: draft.category,
      city: draft.city,
      location_name: draft.locationName,
      activity_date: draft.activityDate,
      activity_time: draft.activityTime,
      max_people: draft.maxPeople,
      description: draft.description,
    })
    .select("*")
    .single();
  if (error) throw error;
  return normalizeActivity(data);
}

export async function updateActivity({
  id,
  update,
}: {
  id: string;
  update: Partial<Pick<Activity, "title" | "description" | "category" | "city" | "location_name" | "activity_date" | "activity_time" | "max_people" | "status">>;
}) {
  const client = requireClient();
  const { data, error } = await client.from("activities").update(update).eq("id", id).select("*").single();
  if (error) throw error;
  return normalizeActivity(data);
}

export async function cancelActivity(id: string) {
  return updateActivity({ id, update: { status: "cancelled" } });
}

export async function requestToJoin(activityId: string, message = "I'd like to join this activity.") {
  const client = requireClient();
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Sign in to request to join.");
  if (!isProfileVerified(profile)) {
    throw new Error("To keep BuddyUp safe, only verified members can create activities or send join requests.");
  }
  const { data: activity, error: activityError } = await client
    .from("activities")
    .select("created_by")
    .eq("id", activityId)
    .single();
  if (activityError) throw activityError;
  const { data, error } = await client
    .from("activity_requests")
    .insert({
      activity_id: activityId,
      requester_id: profile.id,
      host_id: activity.created_by,
      message,
    })
    .select("*")
    .single();
  if (error?.code === "23505") throw new Error("You already requested to join this activity.");
  if (error) throw error;
  return data as ActivityRequest;
}

export async function listHostRequests(): Promise<ActivityRequest[]> {
  const client = requireClient();
  const profile = await getCurrentProfile();
  if (!profile) return [];
  const { data, error } = await client
    .from("activity_requests")
    .select(`
      *,
      activity:activities!activity_requests_activity_id_fkey(*),
      requester:profiles!activity_requests_requester_id_fkey(${publicProfileColumns})
    `)
    .eq("host_id", profile.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...(row as unknown as ActivityRequest),
    activity: row.activity ? normalizeActivity(row.activity) : null,
    requester: normalizeRelatedProfile(row.requester),
  }));
}

export async function respondToRequest({ requestId, status }: { requestId: string; status: "accepted" | "declined" }) {
  const client = requireClient();
  if (status === "accepted") {
    const { data, error } = await client.rpc("accept_activity_request", { request_id: requestId });
    if (error) throw error;
    return data as string;
  }
  const { error } = await client.from("activity_requests").update({ status }).eq("id", requestId);
  if (error) throw error;
  return null;
}

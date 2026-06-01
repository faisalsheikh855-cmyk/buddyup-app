import { supabase } from "@/lib/supabase";
import { getCurrentProfile } from "@/features/profile/api";

export type Activity = {
  id: string;
  host_id: string;
  title: string;
  category: string;
  location: string;
  distance_km: number | null;
  date_label: string;
  starts_at: string;
  spots: number;
  pace: string;
  description: string;
  created_at: string;
  host?: {
    id: string;
    name: string;
    neighborhood: string;
    avatar: string | null;
  } | null;
  request_status?: "pending" | "accepted" | "declined" | null;
};

export type ActivityDraft = {
  title: string;
  category: string;
  location: string;
  dateLabel: string;
  startsAt: string;
  spots: number;
  pace: string;
  description: string;
};

export type ActivityRequest = {
  id: string;
  activity_id: string;
  requester_id: string;
  message: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  activity?: Activity | null;
  requester?: {
    id: string;
    name: string;
    neighborhood: string;
    avatar: string | null;
  } | null;
};

function requireClient() {
  if (!supabase) throw new Error("Add your Supabase environment keys to enable activities.");
  return supabase;
}

export async function listActivities(): Promise<Activity[]> {
  const client = requireClient();
  const profile = await getCurrentProfile();

  const { data, error } = await client
    .from("activities")
    .select(`
      *,
      host:profiles!activities_host_id_fkey(id, name, neighborhood, avatar)
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  const activities = (data ?? []) as Activity[];
  if (!profile || activities.length === 0) return activities;

  const { data: requests, error: requestError } = await client
    .from("activity_requests")
    .select("activity_id, status")
    .eq("requester_id", profile.id)
    .in("activity_id", activities.map((activity) => activity.id));

  if (requestError) throw requestError;

  const statusByActivity = new Map(
    (requests ?? []).map((request) => [request.activity_id, request.status as Activity["request_status"]]),
  );

  return activities.map((activity) => ({
    ...activity,
    request_status: statusByActivity.get(activity.id) ?? null,
  }));
}

export async function getActivity(id: string): Promise<Activity> {
  const client = requireClient();
  const profile = await getCurrentProfile();

  const { data, error } = await client
    .from("activities")
    .select(`
      *,
      host:profiles!activities_host_id_fkey(id, name, neighborhood, avatar)
    `)
    .eq("id", id)
    .single();

  if (error) throw error;

  let requestStatus: Activity["request_status"] = null;
  if (profile) {
    const { data: request, error: requestError } = await client
      .from("activity_requests")
      .select("status")
      .eq("activity_id", id)
      .eq("requester_id", profile.id)
      .maybeSingle();

    if (requestError) throw requestError;
    requestStatus = (request?.status as Activity["request_status"]) ?? null;
  }

  return { ...(data as Activity), request_status: requestStatus };
}

export async function createActivity(draft: ActivityDraft): Promise<Activity> {
  const client = requireClient();
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Sign in to create an activity.");

  const { data, error } = await client
    .from("activities")
    .insert({
      host_id: profile.id,
      title: draft.title,
      category: draft.category,
      location: draft.location,
      distance_km: 0,
      date_label: draft.dateLabel,
      starts_at: draft.startsAt,
      spots: draft.spots,
      pace: draft.pace,
      description: draft.description,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as Activity;
}

export async function requestToJoin(activityId: string, message = "I'd like to join this activity."): Promise<ActivityRequest> {
  const client = requireClient();
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Sign in to request to join.");

  const { data, error } = await client
    .from("activity_requests")
    .insert({
      activity_id: activityId,
      requester_id: profile.id,
      message,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") throw new Error("You already requested to join this activity.");
    throw error;
  }

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
      requester:profiles!activity_requests_requester_id_fkey(id, name, neighborhood, avatar)
    `)
    .eq("activity.host_id", profile.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as ActivityRequest[]).filter((request) => request.activity);
}

export async function respondToRequest({ requestId, status }: { requestId: string; status: "accepted" | "declined" }) {
  const client = requireClient();

  if (status === "accepted") {
    const { data, error } = await client.rpc("accept_activity_request", { p_request_id: requestId });
    if (error) throw error;
    return data as string;
  }

  const { error } = await client
    .from("activity_requests")
    .update({ status })
    .eq("id", requestId);

  if (error) throw error;
  return null;
}

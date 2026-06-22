import { supabase } from "@/lib/supabase";

export type AppNotification = {
  id: string;
  user_id: string;
  actor_id: string | null;
  activity_id: string | null;
  conversation_id: string | null;
  type: "join_request" | "request_accepted" | "request_declined" | "message" | "activity_updated" | "activity_cancelled" | "safety";
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

function requireClient() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

export async function listNotifications(): Promise<AppNotification[]> {
  const { data, error } = await requireClient()
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as AppNotification[];
}

export async function markNotificationRead(id: string) {
  const { error } = await requireClient()
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function markAllNotificationsRead() {
  const { error } = await requireClient()
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
  if (error) throw error;
}

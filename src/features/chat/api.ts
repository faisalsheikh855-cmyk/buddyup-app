import { supabase } from "@/lib/supabase";
import { getCurrentProfile, isProfileVerified } from "@/features/profile/api";

export type ConversationMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

export type Conversation = {
  id: string;
  activity_id: string;
  host_id: string;
  participant_id: string;
  created_at: string;
  activity?: {
    id: string;
    title: string;
    activity_date: string | null;
    activity_time: string | null;
    location_name: string | null;
  } | null;
};

function requireClient() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

export async function getConversation(id: string): Promise<Conversation> {
  const { data, error } = await requireClient()
    .from("conversations")
    .select("*, activity:activities!conversations_activity_id_fkey(id, title, activity_date, activity_time, location_name)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Conversation;
}

export async function listConversations(): Promise<Conversation[]> {
  const { data, error } = await requireClient()
    .from("conversations")
    .select("*, activity:activities!conversations_activity_id_fkey(id, title, activity_date, activity_time, location_name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Conversation[];
}

export async function listMessages(conversationId: string): Promise<ConversationMessage[]> {
  const client = requireClient();
  const { data, error } = await client
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  const profile = await getCurrentProfile();
  if (profile) {
    const unreadIds = (data ?? [])
      .filter((message) => message.sender_id !== profile.id && !message.read_at)
      .map((message) => message.id);
    if (unreadIds.length) {
      const { error: readError } = await client
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .in("id", unreadIds);
      if (readError) throw readError;
    }
  }
  return (data ?? []) as ConversationMessage[];
}

export async function sendMessage({ conversationId, body }: { conversationId: string; body: string }) {
  const client = requireClient();
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Sign in to send messages.");
  if (!isProfileVerified(profile)) throw new Error("Verify your profile before sending messages.");
  const { data, error } = await client
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: profile.id, body: body.trim() })
    .select("*")
    .single();
  if (error) throw error;
  return data as ConversationMessage;
}

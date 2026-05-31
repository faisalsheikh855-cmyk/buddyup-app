import { supabase } from "@/lib/supabase";
import { getCurrentProfile } from "@/features/profile/api";

export type ConversationMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type Conversation = {
  id: string;
  activity_id: string;
  created_at: string;
  activity?: {
    id: string;
    title: string;
    date_label: string;
    starts_at: string;
    location: string;
  } | null;
};

function requireClient() {
  if (!supabase) throw new Error("Add your Supabase environment keys to enable chat.");
  return supabase;
}

export async function getConversation(id: string): Promise<Conversation> {
  const client = requireClient();
  const { data, error } = await client
    .from("conversations")
    .select(`
      *,
      activity:activities!conversations_activity_id_fkey(id, title, date_label, starts_at, location)
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Conversation;
}

export async function listMessages(conversationId: string): Promise<ConversationMessage[]> {
  const client = requireClient();
  const { data, error } = await client
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ConversationMessage[];
}

export async function sendMessage({ conversationId, body }: { conversationId: string; body: string }): Promise<ConversationMessage> {
  const client = requireClient();
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Sign in to send messages.");

  const { data, error } = await client
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: profile.id,
      body,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as ConversationMessage;
}

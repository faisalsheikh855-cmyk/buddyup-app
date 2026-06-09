import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getConversation, listConversations, listMessages, sendMessage } from "./api";
import { supabase } from "@/lib/supabase";

export const chatKeys = {
  conversation: (id: string) => ["conversation", id] as const,
  conversations: ["conversations"] as const,
  messages: (id: string) => ["conversation", id, "messages"] as const,
};

export function useConversations() {
  return useQuery({ queryKey: chatKeys.conversations, queryFn: listConversations });
}

export function useConversation(id: string | undefined) {
  return useQuery({
    queryKey: chatKeys.conversation(id ?? ""),
    queryFn: () => getConversation(id!),
    enabled: Boolean(id) && id !== "preview",
  });
}

export function useMessages(id: string | undefined) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: chatKeys.messages(id ?? ""),
    queryFn: () => listMessages(id!),
    enabled: Boolean(id) && id !== "preview",
  });

  useEffect(() => {
    if (!supabase || !id || id === "preview") return;
    const channel = supabase
      .channel(`messages:${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
        () => void queryClient.invalidateQueries({ queryKey: chatKeys.messages(id) }),
      )
      .subscribe();
    return () => {
      void supabase?.removeChannel(channel);
    };
  }, [id, queryClient]);

  return query;
}

export function useSendMessage(conversationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => sendMessage({ conversationId: conversationId!, body }),
    onSuccess: () => {
      if (conversationId) void queryClient.invalidateQueries({ queryKey: chatKeys.messages(conversationId) });
    },
  });
}

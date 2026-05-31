import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getConversation, listMessages, sendMessage } from "./api";

export const chatKeys = {
  conversation: (id: string) => ["conversation", id] as const,
  messages: (id: string) => ["conversation", id, "messages"] as const,
};

export function useConversation(id: string | undefined) {
  return useQuery({
    queryKey: chatKeys.conversation(id ?? ""),
    queryFn: () => getConversation(id!),
    enabled: Boolean(id) && id !== "preview",
  });
}

export function useMessages(id: string | undefined) {
  return useQuery({
    queryKey: chatKeys.messages(id ?? ""),
    queryFn: () => listMessages(id!),
    enabled: Boolean(id) && id !== "preview",
  });
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

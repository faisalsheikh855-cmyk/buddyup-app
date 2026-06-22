import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "./api";

export const notificationKeys = {
  all: ["notifications"] as const,
};

export function useNotifications() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: notificationKeys.all,
    queryFn: listNotifications,
  });

  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel("my-notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => void queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
      )
      .subscribe();
    return () => {
      void supabase?.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

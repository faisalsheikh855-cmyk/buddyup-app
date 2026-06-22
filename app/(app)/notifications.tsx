import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Screen } from "@/components/ui/screen";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/features/notifications/hooks";
import type { AppNotification } from "@/features/notifications/api";
import { useThemeColors } from "@/theme/tokens";

const iconByType: Record<AppNotification["type"], keyof typeof Ionicons.glyphMap> = {
  join_request: "person-add-outline",
  request_accepted: "checkmark-circle-outline",
  request_declined: "close-circle-outline",
  message: "chatbubble-ellipses-outline",
  activity_updated: "create-outline",
  activity_cancelled: "calendar-outline",
  safety: "shield-checkmark-outline",
};

export default function NotificationsScreen() {
  const colors = useThemeColors();
  const notificationsQuery = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const notifications = notificationsQuery.data ?? [];
  const hasUnread = notifications.some((item) => !item.read_at);

  function openNotification(notification: AppNotification) {
    if (!notification.read_at) markRead.mutate(notification.id);
    if (notification.conversation_id) {
      router.push(`/(app)/chat/${notification.conversation_id}`);
    } else if (notification.type === "join_request") {
      router.push("/(app)/(tabs)/requests");
    } else if (notification.activity_id) {
      router.push(`/(app)/activities/${notification.activity_id}`);
    }
  }

  return (
    <Screen scroll>
      <View className="pb-10 pt-3">
        <View className="mb-8 flex-row items-center gap-4">
          <Pressable className="h-11 w-11 items-center justify-center rounded-full bg-surface" onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={23} color={colors.ink} />
          </Pressable>
          <Text className="min-w-0 flex-1 text-[25px] font-bold text-ink">Notifications</Text>
          {hasUnread ? (
            <Pressable onPress={() => markAllRead.mutate()}>
              <Text className="text-[12px] font-bold text-brand">Mark all read</Text>
            </Pressable>
          ) : null}
        </View>

        {notificationsQuery.isLoading ? (
          <View className="items-center py-16"><ActivityIndicator color={colors.brand} /></View>
        ) : null}

        {notificationsQuery.error ? (
          <View className="rounded-app bg-coral-soft p-4">
            <Text className="text-[13px] font-bold text-[#A4483F]">Could not load notifications.</Text>
          </View>
        ) : null}

        {!notificationsQuery.isLoading && notifications.length === 0 ? (
          <View className="rounded-app border border-line bg-surface p-5">
            <Text className="text-[15px] font-bold text-ink">You are all caught up</Text>
            <Text className="mt-2 text-[13px] leading-5 text-muted">Activity requests, decisions, and new messages will appear here.</Text>
          </View>
        ) : null}

        <View className="gap-2">
          {notifications.map((notification) => (
            <Pressable
              key={notification.id}
              className={`flex-row items-start gap-3 rounded-app border p-4 ${notification.read_at ? "border-line bg-surface" : "border-brand bg-brand-soft"}`}
              onPress={() => openNotification(notification)}
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-surface">
                <Ionicons name={iconByType[notification.type]} size={20} color={colors.brand} />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="text-[14px] font-extrabold text-ink">{notification.title}</Text>
                <Text className="mt-1 text-[12px] leading-5 text-muted">{notification.body}</Text>
                <Text className="mt-2 text-[10px] font-semibold text-muted">
                  {new Date(notification.created_at).toLocaleString()}
                </Text>
              </View>
              {!notification.read_at ? <View className="mt-1 h-2.5 w-2.5 rounded-full bg-brand" /> : null}
            </Pressable>
          ))}
        </View>
      </View>
    </Screen>
  );
}

import { ActivityIndicator, Alert, Pressable, Share, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href, useLocalSearchParams } from "expo-router";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { TrustBadges } from "@/components/trust-badges";
import { useActivity, useCancelActivity, useRequestToJoin } from "@/features/activities/hooks";
import { isProfileVerified } from "@/features/profile/api";
import { useCurrentProfile } from "@/features/profile/hooks";
import { nearbyActivities } from "@/features/activities/mock-data";
import { useBlockUser, useReportUser, useSafetyCheckin } from "@/features/safety/hooks";
import { useThemeColors } from "@/theme/tokens";
import { useConversations } from "@/features/chat/hooks";

export function generateStaticParams() {
  return nearbyActivities.map((activity) => ({ id: activity.id }));
}

export default function ActivityDetailScreen() {
  const colors = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const activityQuery = useActivity(id);
  const joinMutation = useRequestToJoin();
  const cancelMutation = useCancelActivity();
  const profileQuery = useCurrentProfile();
  const reportMutation = useReportUser();
  const blockMutation = useBlockUser();
  const checkinMutation = useSafetyCheckin();
  const conversationsQuery = useConversations();
  const activity = activityQuery.data;
  const isHost = Boolean(activity && profileQuery.data?.id === activity.created_by);
  const hasRequested = Boolean(activity?.request_status);
  const conversation = conversationsQuery.data?.find((item) => item.activity_id === activity?.id);
  const today = new Date();
  const todayDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
  const canCheckIn = Boolean(
    activity?.activity_date
    && activity.activity_date <= todayDate
    && (isHost || activity.request_status === "accepted"),
  );

  function requestJoin() {
    if (!id) return;
    if (!isProfileVerified(profileQuery.data)) {
      router.push("/verification" as Href);
      return;
    }
    joinMutation.mutate({ activityId: id });
  }

  function cancelPlan() {
    if (!activity) return;
    Alert.alert("Cancel this activity?", "People with requests will no longer be able to join.", [
      { text: "Keep activity", style: "cancel" },
      {
        text: "Cancel activity",
        style: "destructive",
        onPress: () => cancelMutation.mutate(activity.id, {
          onSuccess: () => Alert.alert("Activity cancelled", "This activity is now closed."),
        }),
      },
    ]);
  }

  async function sharePlan() {
    if (!activity) return;
    await Share.share({
      message: `${activity.title}\n${activity.date_label}, ${activity.starts_at}\n${activity.location}\nShared from BuddyUp`,
    });
  }

  function reportHost() {
    if (!activity?.host?.id) return;
    Alert.alert("Report this user?", "BuddyUp will review this report. The user is not notified.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Report",
        style: "destructive",
        onPress: () => {
          reportMutation.mutate(
            {
              reportedUserId: activity.host!.id,
              activityId: activity.id,
              reason: "Safety concern reported from activity details.",
            },
            {
              onSuccess: () => Alert.alert("Report sent", "Thank you for helping keep BuddyUp safe."),
              onError: (error) => Alert.alert("Could not send report", error.message),
            },
          );
        },
      },
    ]);
  }

  function blockHost() {
    if (!activity?.host?.id) return;
    Alert.alert("Block this user?", "They will no longer be able to interact with you through BuddyUp.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Block",
        style: "destructive",
        onPress: () => {
          blockMutation.mutate(activity.host!.id, {
            onSuccess: () => Alert.alert("User blocked", "Their profile and activity interactions are now blocked."),
            onError: (error) => Alert.alert("Could not block user", error.message),
          });
        },
      },
    ]);
  }

  function checkIn(status: "safe" | "issue_reported") {
    if (!activity) return;
    checkinMutation.mutate(
      { activityId: activity.id, status },
      {
        onSuccess: () => Alert.alert(
          status === "safe" ? "Check-in saved" : "Safety concern saved",
          status === "safe"
            ? "Glad you are safe."
            : "If you are in immediate danger, contact local emergency services now.",
        ),
        onError: (error) => Alert.alert("Could not save check-in", error.message),
      },
    );
  }

  return (
    <Screen scroll>
      <View className="pb-6 pt-3">
        <Pressable className="mb-8 h-11 w-11 items-center justify-center rounded-full bg-surface" onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={23} color={colors.ink} />
        </Pressable>

        {activityQuery.isLoading ? (
          <View className="items-center rounded-[22px] border border-line bg-surface p-8">
            <ActivityIndicator color={colors.brand} />
            <Text className="mt-3 text-[14px] font-semibold text-muted">Loading activity...</Text>
          </View>
        ) : null}

        {activityQuery.error ? (
          <View className="rounded-[22px] bg-coral-soft p-4">
            <Text className="text-[14px] font-bold text-[#A4483F]">Could not load this activity. Make sure the Supabase schema is applied and this activity exists.</Text>
          </View>
        ) : null}

        {activity ? (
          <>
            <Text className="mb-5 self-start rounded-full bg-brand-soft px-3 py-2 text-[12px] font-bold text-brand">{activity.category}</Text>
            <Text className="mb-5 text-[31px] font-extrabold leading-[37px] text-ink">{activity.title}</Text>

            <View className="mb-5 rounded-[22px] bg-ink p-5">
              <Text className="mb-3 text-[15px] font-extrabold text-white">Plan details</Text>
              <View className="gap-3">
                <Text className="text-[14px] font-semibold text-white/85"><Text className="font-extrabold text-white">When  </Text>{activity.date_label}, {activity.starts_at}</Text>
                <Text className="text-[14px] font-semibold text-white/85"><Text className="font-extrabold text-white">Where  </Text>{activity.location}</Text>
                <Text className="text-[14px] font-semibold text-white/85"><Text className="font-extrabold text-white">Level  </Text>{activity.pace}</Text>
                <Text className="text-[14px] font-semibold text-white/85"><Text className="font-extrabold text-white">Spots  </Text>{activity.spots} open</Text>
              </View>
            </View>

            <Pressable
              className="mb-5 rounded-[22px] border border-line bg-surface p-4"
              disabled={!activity.host?.id}
              onPress={() => activity.host?.id && router.push(`/(app)/profiles/${activity.host.id}` as Href)}
            >
              <Text className="text-[15px] font-extrabold text-ink">Host</Text>
              <Text className="mt-1 text-[14px] font-semibold text-muted">{activity.host?.name ?? "BuddyUp host"} · {activity.host?.neighborhood ?? "Nearby"}</Text>
              {activity.host ? <View className="mt-3"><TrustBadges profile={activity.host} compact /></View> : null}
            </Pressable>

            <View className="mb-8 rounded-[22px] border border-line bg-surface p-4">
              <Text className="text-[15px] font-extrabold text-ink">What to know</Text>
              <Text className="mt-2 text-[14px] leading-6 text-muted">{activity.description}</Text>
            </View>

            <View className="mb-5 rounded-app bg-brand-soft p-4">
              <View className="flex-row items-start">
                <Ionicons name="people-outline" size={21} color={colors.brand} />
                <View className="ml-3 min-w-0 flex-1">
                  <Text className="text-[14px] font-extrabold text-ink">Meet in public first</Text>
                  <Text className="mt-1 text-[12px] leading-5 text-muted">
                    Choose a busy, well-lit place and tell someone you trust where you are going.
                  </Text>
                </View>
              </View>
            </View>

            <View className="mb-5">
              <Text className="mb-3 text-[15px] font-extrabold text-ink">Safety tools</Text>
              <View className="flex-row flex-wrap gap-2">
                <Pressable className="flex-row items-center gap-2 rounded-app border border-line bg-surface px-3 py-3" onPress={sharePlan}>
                  <Ionicons name="share-outline" size={17} color={colors.brand} />
                  <Text className="text-[12px] font-bold text-ink">Share plan</Text>
                </Pressable>
                {!isHost ? (
                  <>
                    <Pressable className="flex-row items-center gap-2 rounded-app border border-line bg-surface px-3 py-3" onPress={reportHost}>
                      <Ionicons name="flag-outline" size={17} color={colors.coral} />
                      <Text className="text-[12px] font-bold text-ink">Report user</Text>
                    </Pressable>
                    <Pressable className="flex-row items-center gap-2 rounded-app border border-line bg-surface px-3 py-3" onPress={blockHost}>
                      <Ionicons name="ban-outline" size={17} color={colors.coral} />
                      <Text className="text-[12px] font-bold text-ink">Block user</Text>
                    </Pressable>
                  </>
                ) : null}
              </View>
            </View>

            {canCheckIn ? (
              <View className="mb-8 rounded-app border border-line bg-surface p-4">
                <Text className="text-[15px] font-extrabold text-ink">Post-activity check-in</Text>
                <Text className="mt-1 text-[12px] leading-5 text-muted">After the activity, let BuddyUp know whether you are safe.</Text>
                <View className="mt-4 flex-row gap-3">
                  <Pressable className="h-12 flex-1 items-center justify-center rounded-app bg-brand" onPress={() => checkIn("safe")}>
                    <Text className="text-[13px] font-bold text-white">I’m safe</Text>
                  </Pressable>
                  <Pressable className="h-12 flex-1 items-center justify-center rounded-app bg-coral-soft" onPress={() => checkIn("issue_reported")}>
                    <Text className="text-[13px] font-bold text-[#A4483F]">I need help</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {joinMutation.error ? (
              <View className="mb-4 rounded-[18px] bg-coral-soft px-4 py-3">
                <Text className="text-[13px] leading-5 text-[#A4483F]">{joinMutation.error.message}</Text>
              </View>
            ) : null}

            {isHost ? (
              <View className="gap-3">
                {conversation ? (
                  <Button onPress={() => router.push("/(app)/(tabs)/requests")}>Open member chats</Button>
                ) : null}
                {activity.status !== "cancelled" ? (
                  <Button variant="secondary" onPress={() => router.push(`/(app)/activities/${activity.id}/edit` as Href)}>Edit activity</Button>
                ) : null}
                <Button variant="secondary" loading={cancelMutation.isPending} disabled={activity.status === "cancelled"} onPress={cancelPlan}>
                  {activity.status === "cancelled" ? "Activity cancelled" : "Cancel activity"}
                </Button>
              </View>
            ) : conversation ? (
              <Button onPress={() => router.push(`/(app)/chat/${conversation.id}`)}>Open activity chat</Button>
            ) : (
              <Button loading={joinMutation.isPending} disabled={hasRequested || activity.status !== "open"} onPress={requestJoin}>
                {activity.status === "full" && !activity.request_status
                  ? "Activity full"
                  : activity.request_status === "accepted"
                  ? "Accepted"
                  : activity.request_status === "pending"
                    ? "Request pending"
                    : activity.request_status === "declined"
                      ? "Request declined"
                      : "Request to join"}
              </Button>
            )}
          </>
        ) : null}
      </View>
    </Screen>
  );
}

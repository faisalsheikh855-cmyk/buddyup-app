import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { useActivity, useRequestToJoin } from "@/features/activities/hooks";
import { nearbyActivities } from "@/features/activities/mock-data";
import { colors } from "@/theme/tokens";

export function generateStaticParams() {
  return nearbyActivities.map((activity) => ({ id: activity.id }));
}

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const activityQuery = useActivity(id);
  const joinMutation = useRequestToJoin();
  const activity = activityQuery.data;
  const isHost = false;
  const hasRequested = Boolean(activity?.request_status);

  function requestJoin() {
    if (!id) return;
    joinMutation.mutate({ activityId: id });
  }

  return (
    <Screen scroll>
      <View className="pb-6 pt-3">
        <Pressable className="mb-8 h-11 w-11 items-center justify-center rounded-full bg-white" onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={23} color={colors.ink} />
        </Pressable>

        {activityQuery.isLoading ? (
          <View className="items-center rounded-[22px] border border-line bg-white p-8">
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

            <View className="mb-5 rounded-[22px] border border-line bg-white p-4">
              <Text className="text-[15px] font-extrabold text-ink">Host</Text>
              <Text className="mt-1 text-[14px] font-semibold text-muted">{activity.host?.name ?? "BuddyUp host"} · {activity.host?.neighborhood ?? "Nearby"}</Text>
            </View>

            <View className="mb-8 rounded-[22px] border border-line bg-white p-4">
              <Text className="text-[15px] font-extrabold text-ink">What to know</Text>
              <Text className="mt-2 text-[14px] leading-6 text-muted">{activity.description}</Text>
            </View>

            {joinMutation.error ? (
              <View className="mb-4 rounded-[18px] bg-coral-soft px-4 py-3">
                <Text className="text-[13px] leading-5 text-[#A4483F]">{joinMutation.error.message}</Text>
              </View>
            ) : null}

            <Button loading={joinMutation.isPending} disabled={isHost || hasRequested} onPress={requestJoin}>
              {activity.request_status === "accepted"
                ? "Accepted"
                : activity.request_status === "pending"
                  ? "Request pending"
                  : activity.request_status === "declined"
                    ? "Request declined"
                    : "Request to join"}
            </Button>
          </>
        ) : null}
      </View>
    </Screen>
  );
}

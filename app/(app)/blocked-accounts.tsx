import { ActivityIndicator, Alert, Image, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { useBlockedUsers, useUnblockUser } from "@/features/safety/hooks";
import { useThemeColors } from "@/theme/tokens";

export default function BlockedAccountsScreen() {
  const colors = useThemeColors();
  const blockedQuery = useBlockedUsers();
  const unblockMutation = useUnblockUser();

  return (
    <Screen scroll>
      <View className="pb-10 pt-3">
        <View className="mb-8 flex-row items-center gap-4">
          <Pressable className="h-11 w-11 items-center justify-center rounded-full bg-surface" onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={23} color={colors.ink} />
          </Pressable>
          <Text className="text-[25px] font-bold text-ink">Blocked accounts</Text>
        </View>

        <Text className="mb-5 text-[13px] leading-5 text-muted">
          Blocked members cannot see your activities, request to join, or message you.
        </Text>

        {blockedQuery.isLoading ? <ActivityIndicator color={colors.brand} /> : null}
        {blockedQuery.error ? (
          <View className="rounded-app bg-coral-soft p-4">
            <Text className="text-[13px] font-bold text-[#A4483F]">Could not load blocked accounts.</Text>
          </View>
        ) : null}
        {!blockedQuery.isLoading && (blockedQuery.data?.length ?? 0) === 0 ? (
          <View className="rounded-app border border-line bg-surface p-6">
            <Text className="text-center text-[16px] font-extrabold text-ink">No blocked accounts</Text>
          </View>
        ) : null}

        <View className="gap-3">
          {blockedQuery.data?.map((item) => (
            <View key={item.id} className="flex-row items-center gap-3 rounded-app border border-line bg-surface p-4">
              <View className="h-12 w-12 overflow-hidden rounded-full bg-brand-soft">
                {item.profile?.avatar_url ? (
                  <Image source={{ uri: item.profile.avatar_url }} className="h-full w-full" />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <Ionicons name="person-outline" size={22} color={colors.brand} />
                  </View>
                )}
              </View>
              <View className="min-w-0 flex-1">
                <Text className="text-[14px] font-extrabold text-ink">{item.profile?.full_name ?? "Blocked member"}</Text>
                <Text className="mt-1 text-[11px] text-muted">@{item.profile?.username ?? "member"}</Text>
              </View>
              <Button
                className="h-11 px-3"
                variant="secondary"
                loading={unblockMutation.isPending}
                onPress={() => Alert.alert("Unblock this member?", "They will be able to see and interact with you again.", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Unblock",
                    onPress: () => unblockMutation.mutate(item.blocked_user_id, {
                      onError: (error) => Alert.alert("Could not unblock member", error.message),
                    }),
                  },
                ])}
              >
                Unblock
              </Button>
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}

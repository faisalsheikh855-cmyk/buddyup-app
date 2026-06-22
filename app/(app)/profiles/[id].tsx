import { ActivityIndicator, Alert, Image, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Screen } from "@/components/ui/screen";
import { TrustBadges } from "@/components/trust-badges";
import { useProfile, useProfilePhotos } from "@/features/profile/hooks";
import { useBlockUser, useReportUser } from "@/features/safety/hooks";
import { useThemeColors } from "@/theme/tokens";

export default function PublicProfileScreen() {
  const colors = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const profileQuery = useProfile(id);
  const photosQuery = useProfilePhotos(id);
  const reportMutation = useReportUser();
  const blockMutation = useBlockUser();
  const profile = profileQuery.data;

  function report() {
    if (!profile) return;
    Alert.alert("Report this member?", "BuddyUp will review the account. They will not be notified.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Report",
        style: "destructive",
        onPress: () => reportMutation.mutate(
          { reportedUserId: profile.id, reason: "Profile safety concern" },
          {
            onSuccess: () => Alert.alert("Report sent", "Thank you for helping keep BuddyUp safe."),
            onError: (error) => Alert.alert("Could not send report", error.message),
          },
        ),
      },
    ]);
  }

  function block() {
    if (!profile) return;
    Alert.alert("Block this member?", "You will no longer see or receive interactions from each other.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Block",
        style: "destructive",
        onPress: () => blockMutation.mutate(profile.id, {
          onSuccess: () => {
            Alert.alert("Member blocked");
            router.back();
          },
          onError: (error) => Alert.alert("Could not block member", error.message),
        }),
      },
    ]);
  }

  return (
    <Screen scroll>
      <View className="pb-12 pt-3">
        <Pressable className="mb-6 h-11 w-11 items-center justify-center rounded-full bg-surface" onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={23} color={colors.ink} />
        </Pressable>

        {profileQuery.isLoading ? (
          <View className="items-center py-20"><ActivityIndicator color={colors.brand} /></View>
        ) : null}

        {profileQuery.error ? (
          <View className="rounded-app bg-coral-soft p-4">
            <Text className="text-[13px] font-bold text-[#A4483F]">
              This profile is unavailable. The member may be blocked or no longer active.
            </Text>
          </View>
        ) : null}

        {profile ? (
          <>
            <View className="items-center">
              <View className="h-28 w-28 overflow-hidden rounded-full bg-brand-soft">
                {profile.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} className="h-full w-full" />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <Ionicons name="person-outline" size={36} color={colors.brand} />
                  </View>
                )}
              </View>
              <Text className="mt-4 text-[28px] font-extrabold text-ink">{profile.full_name}</Text>
              <Text className="mt-1 text-[13px] text-muted">
                @{profile.username ?? "member"}{profile.city ? ` · ${profile.city}` : ""}
              </Text>
              <View className="mt-4"><TrustBadges profile={profile} /></View>
            </View>

            <View className="mt-8 rounded-app border border-line bg-surface p-4">
              <Text className="text-[16px] font-extrabold text-ink">About</Text>
              <Text className="mt-2 text-[14px] leading-6 text-muted">
                {profile.bio || "This member has not added a bio yet."}
              </Text>
            </View>

            {(profile.interests?.length ?? 0) > 0 ? (
              <View className="mt-6">
                <Text className="mb-3 text-[16px] font-extrabold text-ink">Interests</Text>
                <View className="flex-row flex-wrap gap-2">
                  {profile.interests.map((interest) => (
                    <View key={interest} className="rounded-full bg-brand-soft px-3 py-2">
                      <Text className="text-[12px] font-bold text-brand">{interest}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {(photosQuery.data?.length ?? 0) > 0 ? (
              <View className="mt-6">
                <Text className="mb-3 text-[16px] font-extrabold text-ink">Recent photos</Text>
                <View className="flex-row flex-wrap gap-2">
                  {photosQuery.data?.map((photo) => (
                    <Image key={photo.id} source={{ uri: photo.photo_url }} className="aspect-[4/5] w-[31%] rounded-app bg-line" />
                  ))}
                </View>
              </View>
            ) : null}

            <View className="mt-8 flex-row gap-3">
              <Pressable className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-app border border-line bg-surface" onPress={report}>
                <Ionicons name="flag-outline" size={18} color={colors.coral} />
                <Text className="text-[13px] font-bold text-ink">Report</Text>
              </Pressable>
              <Pressable className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-app border border-line bg-surface" onPress={block}>
                <Ionicons name="ban-outline" size={18} color={colors.coral} />
                <Text className="text-[13px] font-bold text-ink">Block</Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </View>
    </Screen>
  );
}

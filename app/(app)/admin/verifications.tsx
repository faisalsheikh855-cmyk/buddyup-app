import { useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import {
  useCurrentProfile,
  usePendingSelfieVerifications,
  useReviewSelfieVerification,
} from "@/features/profile/hooks";
import { useThemeColors } from "@/theme/tokens";

export default function AdminVerificationsScreen() {
  const colors = useThemeColors();
  const profileQuery = useCurrentProfile();
  const isAdmin = Boolean(profileQuery.data?.is_admin);
  const verificationsQuery = usePendingSelfieVerifications(isAdmin);
  const reviewMutation = useReviewSelfieVerification();
  const [reasons, setReasons] = useState<Record<string, string>>({});

  function review(id: string, decision: "approved" | "rejected") {
    const rejectionReason = reasons[id]?.trim();
    if (decision === "rejected" && !rejectionReason) {
      Alert.alert("Add a rejection reason", "Explain how the member can submit a clearer selfie.");
      return;
    }
    reviewMutation.mutate(
      { verificationId: id, decision, rejectionReason },
      {
        onSuccess: () => Alert.alert(
          decision === "approved" ? "Selfie approved" : "Selfie rejected",
          decision === "approved" ? "The member is now verified." : "The member can submit a new selfie.",
        ),
        onError: (error) => Alert.alert("Review failed", error.message),
      },
    );
  }

  if (profileQuery.isLoading) {
    return <Screen><View className="flex-1 items-center justify-center"><ActivityIndicator color={colors.brand} /></View></Screen>;
  }

  if (!isAdmin) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="lock-closed-outline" size={36} color={colors.muted} />
          <Text className="mt-4 text-[22px] font-extrabold text-ink">Not authorized</Text>
          <Text className="mt-2 text-center text-[14px] leading-6 text-muted">This screen is available only to BuddyUp safety administrators.</Text>
          <View className="mt-6"><Button variant="secondary" onPress={() => router.back()}>Go back</Button></View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll keyboard>
      <View className="pb-16 pt-3">
        <Pressable className="mb-6 h-11 w-11 items-center justify-center rounded-full bg-surface" onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={23} color={colors.ink} />
        </Pressable>
        <Text className="text-[12px] font-bold uppercase text-brand">Admin safety review</Text>
        <Text className="mt-2 text-[30px] font-extrabold text-ink">Selfie verifications</Text>
        <Text className="mt-2 text-[13px] leading-5 text-muted">Compare the public avatar with the private live selfie. Approve only when they clearly match.</Text>

        {verificationsQuery.isLoading ? <ActivityIndicator className="mt-8" color={colors.brand} /> : null}
        {verificationsQuery.error ? (
          <View className="mt-6 rounded-app bg-coral-soft p-4">
            <Text className="text-[13px] font-bold text-[#A4483F]">{verificationsQuery.error.message}</Text>
          </View>
        ) : null}
        {!verificationsQuery.isLoading && (verificationsQuery.data?.length ?? 0) === 0 ? (
          <View className="mt-6 rounded-app border border-line bg-surface p-6">
            <Text className="text-center text-[16px] font-extrabold text-ink">No pending selfies</Text>
            <Text className="mt-2 text-center text-[13px] text-muted">New submissions will appear here.</Text>
          </View>
        ) : null}

        <View className="mt-6 gap-5">
          {verificationsQuery.data?.map((verification) => (
            <View key={verification.id} className="rounded-app border border-line bg-surface p-4">
              <Text className="text-[17px] font-extrabold text-ink">{verification.profile.full_name}</Text>
              <Text className="mt-1 text-[12px] text-muted">@{verification.profile.username ?? "no_username"} · {verification.profile.city ?? "City not added"}</Text>
              <View className="mt-4 flex-row gap-3">
                <View className="flex-1">
                  <Text className="mb-2 text-[11px] font-bold uppercase text-muted">Profile photo</Text>
                  {verification.profile.avatar_url ? (
                    <Image source={{ uri: verification.profile.avatar_url }} className="aspect-square w-full rounded-app" />
                  ) : <View className="aspect-square items-center justify-center rounded-app bg-line"><Text className="text-muted">Missing</Text></View>}
                </View>
                <View className="flex-1">
                  <Text className="mb-2 text-[11px] font-bold uppercase text-muted">Private selfie</Text>
                  <Image source={{ uri: verification.signedSelfieUrl }} className="aspect-square w-full rounded-app" />
                </View>
              </View>
              <TextInput
                className="mt-4 min-h-[76px] rounded-app border border-line bg-canvas px-4 py-3 text-[13px] text-ink"
                value={reasons[verification.id] ?? ""}
                onChangeText={(value) => setReasons((current) => ({ ...current, [verification.id]: value }))}
                placeholder="Rejection reason, if needed"
                multiline
                textAlignVertical="top"
              />
              <View className="mt-4 flex-row gap-3">
                <Button className="flex-1" variant="secondary" loading={reviewMutation.isPending} onPress={() => review(verification.id, "rejected")}>Reject</Button>
                <Button className="flex-1" loading={reviewMutation.isPending} onPress={() => review(verification.id, "approved")}>Approve</Button>
              </View>
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}

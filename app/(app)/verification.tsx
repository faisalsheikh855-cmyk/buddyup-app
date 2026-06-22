import { useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { getVerificationChecklist } from "@/features/profile/api";
import {
  useCurrentProfile,
  useSubmitSelfieVerification,
  useUploadAvatar,
} from "@/features/profile/hooks";
import { useThemeColors } from "@/theme/tokens";
import { prepareImage } from "@/lib/media";

function ChecklistItem({
  title,
  detail,
  complete,
  pending,
  icon,
  children,
}: {
  title: string;
  detail: string;
  complete: boolean;
  pending?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  children?: React.ReactNode;
}) {
  const colors = useThemeColors();
  return (
    <View className="rounded-app border border-line bg-surface p-4">
      <View className="flex-row items-start gap-3">
        <View className={`h-11 w-11 items-center justify-center rounded-full ${complete ? "bg-brand-soft" : "bg-canvas"}`}>
          <Ionicons name={complete ? "checkmark" : pending ? "time-outline" : icon} size={21} color={complete ? colors.brand : colors.muted} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-[15px] font-extrabold text-ink">{title}</Text>
          <Text className="mt-1 text-[12px] leading-5 text-muted">{detail}</Text>
        </View>
        <Text className={`text-[11px] font-bold ${complete ? "text-brand" : "text-muted"}`}>
          {complete ? "Complete" : pending ? "In review" : "Required"}
        </Text>
      </View>
      {children ? <View className="mt-4">{children}</View> : null}
    </View>
  );
}

export default function VerificationScreen() {
  const colors = useThemeColors();
  const profileQuery = useCurrentProfile();
  const uploadAvatar = useUploadAvatar();
  const submitSelfie = useSubmitSelfieVerification();
  const profile = profileQuery.data;
  const [avatarAsset, setAvatarAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [selfieAsset, setSelfieAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const checklist = getVerificationChecklist(profile);
  const completed = Object.values(checklist).filter(Boolean).length;
  const pending = profile?.verification_status === "pending";
  const rejected = profile?.verification_status === "rejected";
  const canSubmitSelfie = checklist.email && checklist.photo;

  async function chooseAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert("Photos permission needed", "Allow photo access to choose a clear profile photo.");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled) setAvatarAsset(result.assets[0]);
  }

  async function takeSelfie() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return Alert.alert("Camera permission needed", "Allow camera access to take your verification selfie.");
    const result = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.front,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!result.canceled) setSelfieAsset(result.assets[0]);
  }

  async function saveAvatar() {
    if (!avatarAsset) return;
    try {
      const image = await prepareImage(avatarAsset, 1200);
      await uploadAvatar.mutateAsync(image);
      setAvatarAsset(null);
      Alert.alert("Profile photo saved", "Your clear profile photo is now visible to other members.");
    } catch (error) {
      Alert.alert("Could not upload photo", error instanceof Error ? error.message : "Try again.");
    }
  }

  async function sendSelfie() {
    if (!selfieAsset) return;
    try {
      const image = await prepareImage(selfieAsset, 1200);
      await submitSelfie.mutateAsync(image);
      setSelfieAsset(null);
      Alert.alert("Selfie submitted", "Your selfie is private and is now waiting for review.");
    } catch (error) {
      Alert.alert("Could not submit selfie", error instanceof Error ? error.message : "Try again.");
    }
  }

  if (profileQuery.isLoading) {
    return <Screen><View className="flex-1 items-center justify-center"><ActivityIndicator color={colors.brand} /></View></Screen>;
  }

  return (
    <Screen scroll>
      <View className="pb-16 pt-3">
        <Pressable className="mb-6 h-11 w-11 items-center justify-center rounded-full bg-surface" onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={23} color={colors.ink} />
        </Pressable>
        <Text className="text-[12px] font-bold uppercase text-brand">Trust and safety</Text>
        <Text className="mt-2 text-[30px] font-extrabold leading-[36px] text-ink">Verify your profile</Text>
        <Text className="mt-3 text-[14px] leading-6 text-muted">
          BuddyUp is built around real people meeting safely. To create activities or join others, please verify your profile with a clear profile photo and quick selfie.
        </Text>

        <View className="my-7 rounded-app bg-ink p-5">
          <Text className="text-[15px] font-bold text-white">{completed} of 3 complete</Text>
          <View className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
            <View className="h-full rounded-full bg-brand" style={{ width: `${completed * 33.34}%` }} />
          </View>
          <Text className="mt-4 text-[12px] leading-5 text-white/70">
            {profile?.verification_status === "verified"
              ? "Your profile is verified. You can create activities and send join requests."
              : pending
                ? "Your selfie is under review. This usually takes a short time. You can still browse activities, but creating or joining will unlock once you’re verified."
                : rejected
                  ? "Your verification could not be approved. Please upload a clear selfie that matches your profile photo."
                  : "To keep BuddyUp safe, only verified members can create activities or send join requests."}
          </Text>
          {rejected && profile?.verification_rejection_reason ? (
            <Text className="mt-3 text-[12px] font-bold text-white">{profile.verification_rejection_reason}</Text>
          ) : null}
        </View>

        <View className="gap-3">
          <ChecklistItem title="Verified email" detail="Confirm the email used for your BuddyUp account." complete={checklist.email} icon="mail-outline" />
          <ChecklistItem title="Clear profile photo" detail="Use one current photo where your face is easy to recognize." complete={checklist.photo} icon="person-circle-outline">
            {!checklist.photo ? (
              <>
                {avatarAsset ? <Image source={{ uri: avatarAsset.uri }} className="mb-3 h-24 w-24 rounded-app" /> : null}
                <View className="flex-row gap-3">
                  <Button className="flex-1" variant="secondary" onPress={chooseAvatar}>Choose photo</Button>
                  <Button className="flex-1" loading={uploadAvatar.isPending} disabled={!avatarAsset} onPress={saveAvatar}>Upload</Button>
                </View>
              </>
            ) : null}
          </ChecklistItem>
          <ChecklistItem title="Selfie verification" detail="Take a quick live selfie. It stays private and is reviewed by BuddyUp." complete={checklist.selfie} pending={pending} icon="scan-outline">
            {!checklist.selfie && !pending ? (
              <>
                {selfieAsset ? <Image source={{ uri: selfieAsset.uri }} className="mb-3 h-24 w-24 rounded-app" /> : null}
                {!canSubmitSelfie ? (
                  <Text className="mb-3 text-[12px] font-semibold text-muted">
                    Complete your email and profile photo first.
                  </Text>
                ) : null}
                <View className="flex-row gap-3">
                  <Button className="flex-1" variant="secondary" disabled={!canSubmitSelfie} onPress={takeSelfie}>Take selfie</Button>
                  <Button className="flex-1" loading={submitSelfie.isPending} disabled={!selfieAsset || !canSubmitSelfie} onPress={sendSelfie}>Submit</Button>
                </View>
              </>
            ) : null}
          </ChecklistItem>
        </View>
      </View>
    </Screen>
  );
}

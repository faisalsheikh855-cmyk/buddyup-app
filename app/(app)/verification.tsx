import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { TrustBadges } from "@/components/trust-badges";
import { getVerificationChecklist } from "@/features/profile/api";
import {
  useCurrentProfile,
  useSubmitSelfieVerification,
  useUpdateProfile,
  useUploadPrimaryProfilePhoto,
} from "@/features/profile/hooks";
import { useThemeColors } from "@/theme/tokens";

type StepProps = {
  title: string;
  detail: string;
  complete: boolean;
  pending?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  children?: React.ReactNode;
};

function VerificationStep({ title, detail, complete, pending, icon, children }: StepProps) {
  const colors = useThemeColors();
  return (
    <View className="rounded-app border border-line bg-surface p-4">
      <View className="flex-row items-start">
        <View className={`h-11 w-11 items-center justify-center rounded-full ${complete ? "bg-brand-soft" : "bg-canvas"}`}>
          <Ionicons
            name={complete ? "checkmark" : pending ? "time-outline" : icon}
            size={21}
            color={complete ? colors.brand : colors.muted}
          />
        </View>
        <View className="ml-3 min-w-0 flex-1">
          <Text className="text-[15px] font-extrabold text-ink">{title}</Text>
          <Text className="mt-1 text-[12px] leading-5 text-muted">{detail}</Text>
        </View>
        <Text className={`text-[11px] font-bold ${complete ? "text-brand" : pending ? "text-[#7A5A18]" : "text-muted"}`}>
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
  const updateProfile = useUpdateProfile();
  const uploadPhoto = useUploadPrimaryProfilePhoto();
  const submitSelfie = useSubmitSelfieVerification();
  const profile = profileQuery.data;
  const [phone, setPhone] = useState(profile?.phone_number ?? "");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);

  const checklist = getVerificationChecklist(profile);
  const completed = Object.values(checklist).filter(Boolean).length;
  const progress = completed * 25;
  const selfiePending = profile?.selfie_verification_status === "pending";

  useEffect(() => {
    if (profile?.phone_number) setPhone(profile.phone_number);
  }, [profile?.phone_number]);

  const statusCopy = useMemo(() => {
    if (profile?.verification_status === "verified") return "You are verified and can create activities or send join requests.";
    if (selfiePending) return "Your selfie is being reviewed. We will unlock hosting and join requests after approval.";
    if (profile?.verification_status === "rejected") return "One verification step needs another attempt. Review the checklist below.";
    return "Complete each step to unlock hosting and join requests.";
  }, [profile?.verification_status, selfiePending]);

  async function choosePhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Photos permission needed", "Allow photo access to choose your profile photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  }

  async function takeSelfie() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera permission needed", "Allow camera access to take your verification selfie.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.front,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!result.canceled) setSelfieUri(result.assets[0].uri);
  }

  async function savePhone() {
    if (!profile || phone.trim().length < 7) {
      Alert.alert("Enter a phone number", "Add a valid phone number including area code.");
      return;
    }
    try {
      await updateProfile.mutateAsync({
        name: profile.name,
        age: profile.age,
        neighborhood: profile.neighborhood,
        bio: profile.bio,
        interests: profile.interests,
        availability: profile.availability,
        radius_km: profile.radius_km,
        phone_number: phone.trim(),
      });
      Alert.alert("Phone added", "Your phone requirement is complete.");
    } catch (error) {
      Alert.alert("Could not save phone", error instanceof Error ? error.message : "Try again.");
    }
  }

  async function savePhoto() {
    if (!photoUri) return;
    try {
      await uploadPhoto.mutateAsync(photoUri);
      Alert.alert("Profile photo saved", "Your public profile now has a clear photo.");
    } catch (error) {
      Alert.alert("Could not save photo", error instanceof Error ? error.message : "Try again.");
    }
  }

  async function sendSelfie() {
    if (!selfieUri) return;
    try {
      await submitSelfie.mutateAsync(selfieUri);
      Alert.alert("Selfie submitted", "Your selfie is private and is now waiting for approval.");
    } catch (error) {
      Alert.alert("Could not submit selfie", error instanceof Error ? error.message : "Try again.");
    }
  }

  if (profileQuery.isLoading) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.brand} />
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

        <Text className="text-[12px] font-bold uppercase text-brand">Trust and safety</Text>
        <Text className="mt-2 text-[30px] font-extrabold leading-[36px] text-ink">Verify your BuddyUp profile</Text>
        <Text className="mt-3 text-[14px] leading-6 text-muted">
          To keep BuddyUp safe, only verified members can create activities or send join requests.
        </Text>

        <View className="my-7 rounded-app bg-ink p-5">
          <View className="flex-row items-end justify-between">
            <Text className="text-[15px] font-bold text-white">{completed} of 4 complete</Text>
            <Text className="text-[28px] font-extrabold text-white">{progress}%</Text>
          </View>
          <View className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
            <View className="h-full rounded-full bg-brand" style={{ width: `${progress}%` }} />
          </View>
          <Text className="mt-4 text-[12px] leading-5 text-white/70">{statusCopy}</Text>
        </View>

        <View className="gap-3">
          <VerificationStep
            title="Verified email"
            detail="Your sign-up email must be confirmed."
            complete={checklist.email}
            icon="mail-outline"
          />

          <VerificationStep
            title="Phone number"
            detail="Add a reachable phone number for account safety."
            complete={checklist.phone}
            icon="call-outline"
          >
            {!checklist.phone ? (
              <>
                <TextInput
                  className="h-[50px] rounded-app border border-line bg-canvas px-4 text-[15px] text-ink"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="+1 604 555 0123"
                  placeholderTextColor="#93A19B"
                />
                <View className="mt-3">
                  <Button loading={updateProfile.isPending} onPress={savePhone}>Add phone</Button>
                </View>
              </>
            ) : null}
          </VerificationStep>

          <VerificationStep
            title="Profile photo"
            detail="Use one clear photo where your face is easy to recognize."
            complete={checklist.photo}
            icon="camera-outline"
          >
            {!checklist.photo ? (
              <>
                {photoUri ? <Image source={{ uri: photoUri }} className="mb-3 h-24 w-24 rounded-app" /> : null}
                <View className="flex-row gap-3">
                  <Pressable className="h-12 flex-1 items-center justify-center rounded-app border border-line" onPress={choosePhoto}>
                    <Text className="text-[13px] font-bold text-brand">Choose photo</Text>
                  </Pressable>
                  <Pressable
                    className={`h-12 flex-1 items-center justify-center rounded-app ${photoUri ? "bg-brand" : "bg-line"}`}
                    disabled={!photoUri || uploadPhoto.isPending}
                    onPress={savePhoto}
                  >
                    <Text className={`text-[13px] font-bold ${photoUri ? "text-white" : "text-muted"}`}>Upload</Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </VerificationStep>

          <VerificationStep
            title="Selfie verification"
            detail="Take a live selfie. Approval is required before trust actions unlock."
            complete={checklist.selfie}
            pending={selfiePending}
            icon="scan-outline"
          >
            {!checklist.selfie && !selfiePending ? (
              <>
                {selfieUri ? <Image source={{ uri: selfieUri }} className="mb-3 h-24 w-24 rounded-app" /> : null}
                <View className="flex-row gap-3">
                  <Pressable className="h-12 flex-1 items-center justify-center rounded-app border border-line" onPress={takeSelfie}>
                    <Text className="text-[13px] font-bold text-brand">Take selfie</Text>
                  </Pressable>
                  <Pressable
                    className={`h-12 flex-1 items-center justify-center rounded-app ${selfieUri ? "bg-brand" : "bg-line"}`}
                    disabled={!selfieUri || submitSelfie.isPending}
                    onPress={sendSelfie}
                  >
                    <Text className={`text-[13px] font-bold ${selfieUri ? "text-white" : "text-muted"}`}>Submit</Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </VerificationStep>
        </View>

        <View className="mt-7">
          <Text className="mb-3 text-[15px] font-extrabold text-ink">Your trust badges</Text>
          <TrustBadges profile={profile} />
        </View>
      </View>
    </Screen>
  );
}

import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, type Href } from "expo-router";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/ui/header";
import { Screen } from "@/components/ui/screen";
import { TrustBadges } from "@/components/trust-badges";
import {
  useCurrentProfile,
  useDeleteProfilePhoto,
  useProfilePhotos,
  useUpdateProfile,
  useUploadAvatar,
  useUploadProfilePhoto,
} from "@/features/profile/hooks";
import { useThemeColors } from "@/theme/tokens";
import { prepareImage } from "@/lib/media";

const interestOptions = [
  "Badminton", "Tennis", "Gym", "Shopping", "Soccer", "Pickleball",
  "Coffee", "Walks", "Hiking", "Rec Room", "Basketball", "Chess",
];

export default function ProfileScreen() {
  const colors = useThemeColors();
  const profileQuery = useCurrentProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const profile = profileQuery.data;
  const photosQuery = useProfilePhotos(profile?.id);
  const uploadPhoto = useUploadProfilePhoto(profile?.id);
  const deletePhoto = useDeleteProfilePhoto(profile?.id);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [avatarAsset, setAvatarAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [galleryAsset, setGalleryAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name);
    setUsername(profile.username ?? "");
    setCity(profile.city ?? "");
    setBio(profile.bio ?? "");
    setPhone(profile.phone ?? "");
    setInterests(profile.interests ?? []);
  }, [profile]);

  async function chooseAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert("Photos permission needed", "Allow photo access to choose your profile photo.");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled) setAvatarAsset(result.assets[0]);
  }

  async function saveAvatar() {
    if (!avatarAsset) return;
    try {
      const image = await prepareImage(avatarAsset, 1200);
      await uploadAvatar.mutateAsync(image);
      setAvatarAsset(null);
      Alert.alert("Photo updated", "Your profile photo is now live.");
    } catch (error) {
      Alert.alert("Could not update photo", error instanceof Error ? error.message : "Try again.");
    }
  }

  async function chooseGalleryPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return Alert.alert("Photos permission needed", "Allow photo access to add a recent profile photo.");
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.85,
    });
    if (!result.canceled) setGalleryAsset(result.assets[0]);
  }

  async function saveGalleryPhoto() {
    if (!galleryAsset) return;
    try {
      const image = await prepareImage(galleryAsset, 1600);
      await uploadPhoto.mutateAsync(image);
      setGalleryAsset(null);
      Alert.alert("Photo added", "Your profile gallery has been updated.");
    } catch (error) {
      Alert.alert("Could not add photo", error instanceof Error ? error.message : "Try again.");
    }
  }

  function removeGalleryPhoto(photo: NonNullable<typeof photosQuery.data>[number]) {
    Alert.alert("Remove this photo?", "It will no longer appear on your profile.", [
      { text: "Keep photo", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => deletePhoto.mutate(photo, {
          onError: (error) => Alert.alert("Could not remove photo", error.message),
        }),
      },
    ]);
  }

  async function saveProfile() {
    if (!fullName.trim() || !username.trim() || !city.trim()) {
      return Alert.alert("Complete your profile", "Add your name, username, and city.");
    }
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(username.trim())) {
      return Alert.alert("Choose another username", "Use 3–24 letters, numbers, or underscores.");
    }
    try {
      await updateProfile.mutateAsync({
        full_name: fullName.trim(),
        username: username.trim().toLowerCase(),
        city: city.trim(),
        bio: bio.trim(),
        phone: phone.trim() || null,
        interests,
      });
      Alert.alert("Profile saved", "Your BuddyUp profile is up to date.");
    } catch (error) {
      Alert.alert("Could not save profile", error instanceof Error ? error.message : "Try again.");
    }
  }

  function toggleInterest(interest: string) {
    setInterests((current) => current.includes(interest)
      ? current.filter((item) => item !== interest)
      : [...current, interest]);
  }

  if (profileQuery.isLoading) {
    return <Screen><View className="flex-1 items-center justify-center"><ActivityIndicator color={colors.brand} /></View></Screen>;
  }

  return (
    <Screen scroll keyboard>
      <View className="pb-24 pt-4">
        <Header
          title="Your profile"
          subtitle="Real people, safer meetups"
          action={(
            <Pressable className="h-11 w-11 items-center justify-center rounded-full bg-surface" onPress={() => router.push("/(app)/settings")}>
              <Ionicons name="settings-outline" size={21} color={colors.ink} />
            </Pressable>
          )}
        />

        <View className="mb-8 items-center">
          <Pressable className="h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-brand-soft" onPress={chooseAvatar}>
            {avatarAsset?.uri || profile?.avatar_url ? (
              <Image source={{ uri: avatarAsset?.uri ?? profile?.avatar_url ?? "" }} className="h-full w-full" />
            ) : (
              <Ionicons name="camera-outline" size={30} color={colors.brand} />
            )}
          </Pressable>
          <View className="mt-4 flex-row gap-3">
            <Button variant="secondary" onPress={chooseAvatar}>Choose photo</Button>
            {avatarAsset ? <Button loading={uploadAvatar.isPending} onPress={saveAvatar}>Upload</Button> : null}
          </View>
        </View>

        <View className="mb-8 rounded-app border border-line bg-surface p-4">
          <View className="flex-row items-center justify-between">
            <View className="min-w-0 flex-1 pr-3">
              <Text className="text-[16px] font-extrabold text-ink">
                {profile?.verification_status === "verified" ? "Selfie Verified" : "Verify your profile"}
              </Text>
              <Text className="mt-1 text-[12px] leading-5 text-muted">
                {profile?.verification_status === "verified"
                  ? "Your profile has completed BuddyUp’s selfie review."
                  : "Verification unlocks creating activities and sending join requests."}
              </Text>
            </View>
            <Ionicons name={profile?.verification_status === "verified" ? "shield-checkmark" : "shield-outline"} size={26} color={colors.brand} />
          </View>
          <View className="mt-4"><TrustBadges profile={profile} /></View>
          {profile?.verification_status !== "verified" ? (
            <View className="mt-4">
              <Button onPress={() => router.push("/verification" as Href)}>Open verification</Button>
            </View>
          ) : null}
        </View>

        <View className="mb-8">
          <View className="mb-3 flex-row items-end justify-between">
            <View className="min-w-0 flex-1 pr-3">
              <Text className="text-[20px] font-extrabold text-ink">Recent photos</Text>
              <Text className="mt-1 text-[12px] leading-5 text-muted">
                Add 4–6 current photos so activity partners can recognize you.
              </Text>
            </View>
            <Text className="text-[12px] font-bold text-muted">{photosQuery.data?.length ?? 0}/6</Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {photosQuery.data?.map((photo) => (
              <View key={photo.id} className="relative h-28 w-[31%] overflow-hidden rounded-app bg-line">
                <Image source={{ uri: photo.photo_url }} className="h-full w-full" />
                <Pressable
                  accessibilityLabel="Remove profile photo"
                  className="absolute right-1.5 top-1.5 h-8 w-8 items-center justify-center rounded-full bg-black/60"
                  onPress={() => removeGalleryPhoto(photo)}
                >
                  <Ionicons name="close" size={17} color="#FFFFFF" />
                </Pressable>
              </View>
            ))}
            {(photosQuery.data?.length ?? 0) < 6 ? (
              <Pressable
                className="h-28 w-[31%] items-center justify-center rounded-app border border-dashed border-line bg-surface"
                onPress={chooseGalleryPhoto}
              >
                <Ionicons name="add" size={25} color={colors.brand} />
                <Text className="mt-1 text-[11px] font-bold text-brand">Add photo</Text>
              </Pressable>
            ) : null}
          </View>
          {galleryAsset ? (
            <View className="mt-3 flex-row items-center gap-3 rounded-app border border-line bg-surface p-3">
              <Image source={{ uri: galleryAsset.uri }} className="h-16 w-16 rounded-app" />
              <View className="min-w-0 flex-1">
                <Text className="text-[13px] font-bold text-ink">Ready to add</Text>
                <Text className="mt-1 text-[11px] text-muted">Photos are resized before upload.</Text>
              </View>
              <Button loading={uploadPhoto.isPending} onPress={saveGalleryPhoto}>Upload</Button>
            </View>
          ) : null}
        </View>

        <View className="mb-8 gap-4">
          <Text className="text-[20px] font-extrabold text-ink">About you</Text>
          <TextInput className="h-[52px] rounded-app border border-line bg-surface px-4 text-[15px] text-ink" value={fullName} onChangeText={setFullName} placeholder="Full name" />
          <TextInput autoCapitalize="none" className="h-[52px] rounded-app border border-line bg-surface px-4 text-[15px] text-ink" value={username} onChangeText={setUsername} placeholder="Username" />
          <TextInput className="h-[52px] rounded-app border border-line bg-surface px-4 text-[15px] text-ink" value={city} onChangeText={setCity} placeholder="City" />
          <TextInput className="h-[52px] rounded-app border border-line bg-surface px-4 text-[15px] text-ink" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Phone (optional for MVP)" />
          <TextInput
            className="min-h-[108px] rounded-app border border-line bg-surface px-4 py-3 text-[15px] leading-5 text-ink"
            value={bio}
            onChangeText={setBio}
            multiline
            maxLength={280}
            textAlignVertical="top"
            placeholder="What activities do you enjoy?"
          />
        </View>

        <View className="mb-8">
          <Text className="mb-3 text-[20px] font-extrabold text-ink">Interests</Text>
          <View className="flex-row flex-wrap gap-2">
            {interestOptions.map((interest) => {
              const selected = interests.includes(interest);
              return (
                <Pressable key={interest} className={`rounded-full border px-3 py-2 ${selected ? "border-brand bg-brand-soft" : "border-line bg-surface"}`} onPress={() => toggleInterest(interest)}>
                  <Text className={`text-[12px] font-semibold ${selected ? "text-brand" : "text-muted"}`}>{interest}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <Button loading={updateProfile.isPending} onPress={saveProfile}>Save profile</Button>
      </View>
    </Screen>
  );
}

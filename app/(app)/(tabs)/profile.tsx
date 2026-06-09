import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, type Href } from "expo-router";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/ui/header";
import { Screen } from "@/components/ui/screen";
import { TrustBadges } from "@/components/trust-badges";
import { useCurrentProfile, useUpdateProfile, useUploadAvatar } from "@/features/profile/hooks";
import { useThemeColors } from "@/theme/tokens";

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
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

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
    if (!result.canceled) setAvatarUri(result.assets[0].uri);
  }

  async function saveAvatar() {
    if (!avatarUri) return;
    try {
      await uploadAvatar.mutateAsync(avatarUri);
      setAvatarUri(null);
      Alert.alert("Photo updated", "Your profile photo is now live.");
    } catch (error) {
      Alert.alert("Could not update photo", error instanceof Error ? error.message : "Try again.");
    }
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
            {avatarUri || profile?.avatar_url ? (
              <Image source={{ uri: avatarUri ?? profile?.avatar_url ?? "" }} className="h-full w-full" />
            ) : (
              <Ionicons name="camera-outline" size={30} color={colors.brand} />
            )}
          </Pressable>
          <View className="mt-4 flex-row gap-3">
            <Button variant="secondary" onPress={chooseAvatar}>Choose photo</Button>
            {avatarUri ? <Button loading={uploadAvatar.isPending} onPress={saveAvatar}>Upload</Button> : null}
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

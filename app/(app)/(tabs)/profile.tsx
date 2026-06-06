import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { router, type Href } from "expo-router";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/ui/header";
import { Screen } from "@/components/ui/screen";
import { TrustBadges } from "@/components/trust-badges";
import {
  type DocumentType,
  type IdentitySubmission,
  type VerificationStatus,
} from "@/features/profile/api";
import {
  useCurrentProfile,
  useSubmitIdentityVerification,
  useUpdateProfile,
  useUploadProfilePhotos,
} from "@/features/profile/hooks";
import { useThemeColors } from "@/theme/tokens";

const interestOptions = [
  "Tennis",
  "Chess",
  "Badminton",
  "Table tennis",
  "Coffee walks",
  "Basketball",
  "Hiking",
  "Gym",
];

function getVerificationCopy(colors: ReturnType<typeof useThemeColors>): Record<VerificationStatus, { label: string; detail: string; icon: keyof typeof Ionicons.glyphMap; color: string; background: string }> {
  return {
    unverified: {
      label: "Profile not verified",
      detail: "Complete email, phone, photo, and selfie checks to unlock trust actions.",
      icon: "shield-outline",
      color: colors.coral,
      background: colors.coralSoft,
    },
    pending: {
      label: "Verification in review",
      detail: "Your private submission is waiting for review.",
      icon: "time-outline",
      color: colors.muted,
      background: colors.brandSoft,
    },
    verified: {
      label: "Identity verified",
      detail: "Your identity check has been approved.",
      icon: "shield-checkmark",
      color: colors.brand,
      background: colors.brandSoft,
    },
    rejected: {
      label: "Verification needs attention",
      detail: "Submit clear, current document and selfie images again.",
      icon: "alert-circle-outline",
      color: colors.coral,
      background: colors.coralSoft,
    },
  };
}

function PhotoTile({
  uri,
  index,
  onPress,
}: {
  uri?: string;
  index: number;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      className="aspect-square w-[48.5%] items-center justify-center overflow-hidden rounded-app border border-line bg-surface"
      onPress={onPress}
    >
      {uri ? (
        <>
          <Image source={{ uri }} className="h-full w-full" resizeMode="cover" />
          {index === 0 ? (
            <View className="absolute bottom-2 left-2 rounded-full bg-ink/80 px-2 py-1">
              <Text className="text-[10px] font-bold text-white">Main photo</Text>
            </View>
          ) : null}
        </>
      ) : (
        <>
          <Ionicons name="add" size={25} color={colors.brand} />
          <Text className="mt-1 text-[11px] font-semibold text-muted">Add photo {index + 1}</Text>
        </>
      )}
    </Pressable>
  );
}

function VerificationAsset({
  label,
  detail,
  uri,
  icon,
  onPress,
}: {
  label: string;
  detail: string;
  uri: string | null;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  return (
    <Pressable className="min-h-[76px] flex-row items-center rounded-app border border-line bg-surface px-4 py-3" onPress={onPress}>
      <View className={`h-11 w-11 items-center justify-center rounded-full ${uri ? "bg-brand-soft" : "bg-canvas"}`}>
        <Ionicons name={uri ? "checkmark" : icon} size={21} color={colors.brand} />
      </View>
      <View className="ml-3 min-w-0 flex-1">
        <Text className="text-[14px] font-bold text-ink">{label}</Text>
        <Text className="mt-0.5 text-[12px] leading-4 text-muted">{uri ? "Added" : detail}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const colors = useThemeColors();
  const profileQuery = useCurrentProfile();
  const updateProfile = useUpdateProfile();
  const uploadPhotos = useUploadProfilePhotos();
  const submitVerification = useSubmitIdentityVerification();
  const profile = profileQuery.data;

  const [photos, setPhotos] = useState<string[]>([]);
  const [recentPhotosConfirmed, setRecentPhotosConfirmed] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState("18");
  const [neighborhood, setNeighborhood] = useState("");
  const [bio, setBio] = useState("");
  const [availability, setAvailability] = useState("Flexible");
  const [interests, setInterests] = useState<string[]>([]);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [documentType, setDocumentType] = useState<DocumentType>("drivers_license");
  const [documentFrontUri, setDocumentFrontUri] = useState<string | null>(null);
  const [documentBackUri, setDocumentBackUri] = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setPhotos(profile.photo_urls ?? []);
    setName(profile.name);
    setAge(String(profile.age));
    setNeighborhood(profile.neighborhood);
    setBio(profile.bio ?? "");
    setAvailability(profile.availability);
    setInterests(profile.interests ?? []);
  }, [profile]);

  const verification = getVerificationCopy(colors)[profile?.verification_status ?? "unverified"];
  const completionItems = useMemo(() => [
    photos.length >= 5,
    Boolean(name.trim() && bio.trim() && neighborhood.trim()),
    interests.length >= 3,
    profile?.verification_status === "verified",
  ], [bio, interests.length, name, neighborhood, photos.length, profile?.verification_status]);
  const completion = completionItems.filter(Boolean).length * 25;

  async function requestLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Photos permission needed", "Enable photo access to add profile pictures.");
      return false;
    }
    return true;
  }

  async function chooseProfilePhotos() {
    if (!(await requestLibrary())) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 6,
      quality: 0.82,
    });
    if (!result.canceled) setPhotos(result.assets.map((asset) => asset.uri).slice(0, 6));
  }

  async function takeProfilePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera permission needed", "Enable camera access to take a current profile photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 5], quality: 0.82 });
    if (!result.canceled) setPhotos((current) => [...current, result.assets[0].uri].slice(0, 6));
  }

  async function savePhotos() {
    if (photos.length < 5) {
      Alert.alert("Add more photos", "Your profile needs at least 5 clear, recent photos.");
      return;
    }
    if (!recentPhotosConfirmed) {
      Alert.alert("Confirm photo recency", "Confirm that these photos show how you look now.");
      return;
    }
    try {
      await uploadPhotos.mutateAsync(photos);
      Alert.alert("Photos saved", "Your profile gallery has been updated.");
    } catch (error) {
      Alert.alert("Could not save photos", error instanceof Error ? error.message : "Try again.");
    }
  }

  async function pickVerificationImage(kind: "front" | "back") {
    if (!(await requestLibrary())) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.9,
    });
    if (!result.canceled) {
      if (kind === "front") setDocumentFrontUri(result.assets[0].uri);
      else setDocumentBackUri(result.assets[0].uri);
    }
  }

  async function takeSelfie() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera permission needed", "A live selfie is required for identity review.");
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

  async function submitId() {
    const requiresBack = documentType !== "passport";
    if (!documentFrontUri || !selfieUri || (requiresBack && !documentBackUri)) {
      Alert.alert("Missing images", "Add the required document images and a live selfie.");
      return;
    }
    try {
      const submission: IdentitySubmission = {
        documentType,
        documentFrontUri,
        documentBackUri,
        selfieUri,
      };
      await submitVerification.mutateAsync(submission);
      setVerificationOpen(false);
      Alert.alert("Submitted for review", "Your documents are private and your status is now pending.");
    } catch (error) {
      Alert.alert("Could not submit verification", error instanceof Error ? error.message : "Try again.");
    }
  }

  async function saveDetails() {
    const parsedAge = Number(age);
    if (!name.trim() || !neighborhood.trim() || !bio.trim()) {
      Alert.alert("Complete your profile", "Add your name, area, and a short introduction.");
      return;
    }
    if (!Number.isInteger(parsedAge) || parsedAge < 18) {
      Alert.alert("Age requirement", "BuddyUp profiles must be 18 or older.");
      return;
    }
    if (interests.length < 3) {
      Alert.alert("Choose more interests", "Select at least 3 activities.");
      return;
    }
    try {
      await updateProfile.mutateAsync({
        name: name.trim(),
        age: parsedAge,
        neighborhood: neighborhood.trim(),
        bio: bio.trim(),
        interests,
        availability: availability.trim() || "Flexible",
        radius_km: profile?.radius_km ?? 8,
        phone_number: profile?.phone_number ?? null,
      });
      Alert.alert("Profile saved", "Your profile details are up to date.");
    } catch (error) {
      Alert.alert("Could not save profile", error instanceof Error ? error.message : "Try again.");
    }
  }

  async function enableNearby() {
    const permission = await Location.requestForegroundPermissionsAsync();
    setLocationEnabled(permission.granted);
    if (!permission.granted) Alert.alert("Location not enabled", "Location access is needed to find activities nearby.");
  }

  function toggleInterest(interest: string) {
    setInterests((current) =>
      current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest],
    );
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
    <>
      <Screen scroll>
        <View className="pb-24 pt-4">
          <Header
            title="Your profile"
            subtitle="Build trust before you meet"
            action={(
              <Pressable className="h-11 w-11 items-center justify-center rounded-full bg-surface" onPress={() => router.push("/(app)/settings")}>
                <Ionicons name="settings-outline" size={21} color={colors.ink} />
              </Pressable>
            )}
          />

          <View className="mb-7">
            <View className="flex-row items-end justify-between">
              <View>
                <Text className="text-[12px] font-bold uppercase text-muted">Profile strength</Text>
                <Text className="mt-1 text-[30px] font-extrabold text-ink">{completion}%</Text>
              </View>
              <Text className="mb-1 text-[12px] font-semibold text-muted">
                {completion === 100 ? "Ready to connect" : "Complete all trust steps"}
              </Text>
            </View>
            <View className="mt-3 h-2 overflow-hidden rounded-full bg-line">
              <View className="h-full rounded-full bg-brand" style={{ width: `${completion}%` }} />
            </View>
            <View className="mt-4">
              <TrustBadges profile={profile} />
            </View>
          </View>

          <View className="mb-8">
            <View className="mb-4 flex-row items-start justify-between">
              <View className="min-w-0 flex-1 pr-3">
                <Text className="text-[20px] font-extrabold text-ink">Recent photos</Text>
                <Text className="mt-1 text-[13px] leading-5 text-muted">
                  Add at least 5 clear photos that show how you look now.
                </Text>
              </View>
              <View className="rounded-full bg-brand-soft px-3 py-2">
                <Text className="text-[12px] font-bold text-brand">{photos.length}/5 minimum</Text>
              </View>
            </View>
            <View className="flex-row flex-wrap justify-between gap-y-3">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <PhotoTile key={index} uri={photos[index]} index={index} onPress={chooseProfilePhotos} />
              ))}
            </View>
            <View className="mt-4 flex-row gap-3">
              <Pressable className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-app border border-line bg-surface" onPress={chooseProfilePhotos}>
                <Ionicons name="images-outline" size={18} color={colors.brand} />
                <Text className="text-[13px] font-bold text-brand">Choose photos</Text>
              </Pressable>
              <Pressable className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-app border border-line bg-surface" onPress={takeProfilePhoto}>
                <Ionicons name="camera-outline" size={18} color={colors.brand} />
                <Text className="text-[13px] font-bold text-brand">Take photo</Text>
              </Pressable>
            </View>
            <Pressable className="mt-4 flex-row items-start" onPress={() => setRecentPhotosConfirmed((value) => !value)}>
              <Ionicons name={recentPhotosConfirmed ? "checkbox" : "square-outline"} size={22} color={colors.brand} />
              <Text className="ml-2 min-w-0 flex-1 text-[12px] leading-5 text-muted">
                I confirm these photos are recent and accurately show how I look today.
              </Text>
            </Pressable>
            <View className="mt-4">
              <Button loading={uploadPhotos.isPending} disabled={photos.length < 5 || !recentPhotosConfirmed} onPress={savePhotos}>
                Save photo gallery
              </Button>
            </View>
          </View>

          <View className="mb-8">
            <Text className="mb-4 text-[20px] font-extrabold text-ink">Trust and safety</Text>
            <View className="rounded-app p-4" style={{ backgroundColor: verification.background }}>
              <View className="flex-row items-start">
                <View className="h-11 w-11 items-center justify-center rounded-full bg-surface">
                  <Ionicons name={verification.icon} size={23} color={verification.color} />
                </View>
                <View className="ml-3 min-w-0 flex-1">
                  <Text className="text-[15px] font-extrabold" style={{ color: verification.color }}>{verification.label}</Text>
                  <Text className="mt-1 text-[12px] leading-5 text-muted">{verification.detail}</Text>
                </View>
              </View>
              {profile?.verification_status !== "verified" && profile?.verification_status !== "pending" ? (
                <Pressable className="mt-4 h-12 items-center justify-center rounded-app bg-ink" onPress={() => router.push("/verification" as Href)}>
                  <Text className="text-[14px] font-bold text-white">Open verification checklist</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <View className="mb-8">
            <Text className="mb-4 text-[20px] font-extrabold text-ink">About you</Text>
            <View className="gap-4">
              <View>
                <Text className="mb-2 text-[12px] font-bold text-ink">Display name</Text>
                <TextInput className="h-[52px] rounded-app border border-line bg-surface px-4 text-[15px] text-ink" value={name} onChangeText={setName} placeholder="Your name" />
              </View>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="mb-2 text-[12px] font-bold text-ink">Age</Text>
                  <TextInput className="h-[52px] rounded-app border border-line bg-surface px-4 text-[15px] text-ink" value={age} onChangeText={setAge} keyboardType="number-pad" />
                </View>
                <View className="flex-[2]">
                  <Text className="mb-2 text-[12px] font-bold text-ink">Area</Text>
                  <TextInput className="h-[52px] rounded-app border border-line bg-surface px-4 text-[15px] text-ink" value={neighborhood} onChangeText={setNeighborhood} placeholder="Neighborhood" />
                </View>
              </View>
              <View>
                <Text className="mb-2 text-[12px] font-bold text-ink">About me</Text>
                <TextInput
                  className="min-h-[108px] rounded-app border border-line bg-surface px-4 py-3 text-[15px] leading-5 text-ink"
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  textAlignVertical="top"
                  maxLength={280}
                  placeholder="What do you enjoy, and what kind of people or plans are you looking for?"
                />
                <Text className="mt-1 text-right text-[11px] text-muted">{bio.length}/280</Text>
              </View>
              <View>
                <Text className="mb-2 text-[12px] font-bold text-ink">Usually available</Text>
                <TextInput className="h-[52px] rounded-app border border-line bg-surface px-4 text-[15px] text-ink" value={availability} onChangeText={setAvailability} placeholder="Weeknights and weekends" />
              </View>
            </View>
          </View>

          <View className="mb-8">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-[20px] font-extrabold text-ink">Interests</Text>
              <Text className="text-[12px] font-semibold text-muted">Choose at least 3</Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {interestOptions.map((interest) => {
                const selected = interests.includes(interest);
                return (
                  <Pressable
                    key={interest}
                    className={`rounded-full border px-3 py-2 ${selected ? "border-brand bg-brand-soft" : "border-line bg-surface"}`}
                    onPress={() => toggleInterest(interest)}
                  >
                    <Text className={`text-[12px] font-semibold ${selected ? "text-brand" : "text-muted"}`}>{interest}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="mb-8 flex-row items-center rounded-app bg-ink p-4">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-white/10">
              <Ionicons name={locationEnabled ? "location" : "location-outline"} size={22} color={colors.white} />
            </View>
            <View className="ml-3 min-w-0 flex-1">
              <Text className="text-[14px] font-bold text-white">Nearby matching</Text>
              <Text className="mt-1 text-[11px] leading-4 text-white/70">Your precise location is used only to calculate distance.</Text>
            </View>
            <Pressable className="ml-3 rounded-app bg-brand px-3 py-2" onPress={enableNearby}>
              <Text className="text-[12px] font-bold text-white">{locationEnabled ? "Enabled" : "Enable"}</Text>
            </Pressable>
          </View>

          <Button loading={updateProfile.isPending} onPress={saveDetails}>
            Save profile
          </Button>
        </View>
      </Screen>

      <Modal visible={verificationOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setVerificationOpen(false)}>
        <View className="flex-1 bg-canvas">
          <View className="flex-row items-center justify-between border-b border-line px-5 pb-4 pt-5">
            <View>
              <Text className="text-[20px] font-extrabold text-ink">Verify your identity</Text>
              <Text className="mt-1 text-[12px] text-muted">Private documents are never shown on your profile.</Text>
            </View>
            <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-surface" onPress={() => setVerificationOpen(false)}>
              <Ionicons name="close" size={22} color={colors.ink} />
            </Pressable>
          </View>
          <ScrollView contentContainerClassName="px-5 pb-10 pt-5" keyboardShouldPersistTaps="handled">
            <Text className="mb-2 text-[13px] font-bold text-ink">Document type</Text>
            <View className="mb-6 flex-row rounded-app bg-line p-1">
              {([
                ["drivers_license", "Driver's licence"],
                ["passport", "Passport"],
                ["national_id", "National ID"],
              ] as const).map(([value, label]) => (
                <Pressable key={value} className={`min-h-[44px] flex-1 items-center justify-center rounded-md px-1 ${documentType === value ? "bg-surface" : ""}`} onPress={() => setDocumentType(value)}>
                  <Text className={`text-center text-[11px] font-bold ${documentType === value ? "text-ink" : "text-muted"}`}>{label}</Text>
                </Pressable>
              ))}
            </View>

            <View className="gap-3">
              <VerificationAsset label="Document front" detail="Clear image with all edges visible" uri={documentFrontUri} icon="card-outline" onPress={() => pickVerificationImage("front")} />
              {documentType !== "passport" ? (
                <VerificationAsset label="Document back" detail="Clear image with all edges visible" uri={documentBackUri} icon="card-outline" onPress={() => pickVerificationImage("back")} />
              ) : null}
              <VerificationAsset label="Live selfie" detail="Take a new photo in good lighting" uri={selfieUri} icon="camera-outline" onPress={takeSelfie} />
            </View>

            <View className="my-6 flex-row rounded-app bg-brand-soft p-4">
              <Ionicons name="lock-closed-outline" size={20} color={colors.brand} />
              <Text className="ml-3 min-w-0 flex-1 text-[12px] leading-5 text-muted">
                ID images are stored privately for review. Other BuddyUp members only see your verification badge.
              </Text>
            </View>

            <Button loading={submitVerification.isPending} onPress={submitId}>
              Submit for review
            </Button>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

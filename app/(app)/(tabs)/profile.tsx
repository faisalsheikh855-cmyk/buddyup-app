import { useState } from "react";
import { Alert, Image, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { router } from "expo-router";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/ui/header";
import { Screen } from "@/components/ui/screen";
import { colors } from "@/theme/tokens";

export default function ProfileScreen() {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);

  async function choosePhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Photos permission needed", "Enable photo access to select a profile picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera permission needed", "Enable camera access to take a profile picture.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  }

  async function enableNearby() {
    const permission = await Location.requestForegroundPermissionsAsync();
    setLocationEnabled(permission.granted);
    if (!permission.granted) Alert.alert("Location not enabled", "Location access is needed to find activities nearby.");
  }

  return (
    <Screen scroll>
      <View className="pt-4">
        <Header
          title="Profile"
          action={(
            <Pressable className="h-12 w-12 items-center justify-center rounded-full bg-white" onPress={() => router.push("/(app)/settings")}>
              <Ionicons name="settings-outline" size={22} color={colors.ink} />
            </Pressable>
          )}
        />
        <View className="mb-7 items-center">
          <View className="h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-brand-soft">
            {photoUri ? <Image source={{ uri: photoUri }} className="h-full w-full" /> : <Ionicons name="camera-outline" size={28} color={colors.brand} />}
          </View>
          <View className="mt-4 flex-row gap-3">
            <Pressable className="flex-row items-center gap-2 rounded-full border border-line bg-white px-4 py-3" onPress={choosePhoto}>
              <Ionicons name="images-outline" size={17} color={colors.brand} />
              <Text className="text-[13px] font-semibold text-brand">Gallery</Text>
            </Pressable>
            <Pressable className="flex-row items-center gap-2 rounded-full border border-line bg-white px-4 py-3" onPress={takePhoto}>
              <Ionicons name="camera-outline" size={17} color={colors.brand} />
              <Text className="text-[13px] font-semibold text-brand">Camera</Text>
            </Pressable>
          </View>
        </View>
        <View className="mb-5 rounded-app border border-line bg-white p-4">
          <Text className="mb-2 text-[16px] font-bold text-ink">Find activities nearby</Text>
          <Text className="mb-4 text-[13px] leading-5 text-muted">Your precise location is used only to calculate nearby plans.</Text>
          <Button variant={locationEnabled ? "secondary" : "primary"} onPress={enableNearby}>
            {locationEnabled ? "Location enabled" : "Enable location"}
          </Button>
        </View>
        <View className="rounded-app border border-line bg-white p-4">
          <Text className="text-[15px] font-bold text-ink">Interests</Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {["Badminton", "Coffee", "Hiking", "Rec Room"].map((tag) => (
              <Text key={tag} className="rounded-full bg-brand-soft px-3 py-2 text-[12px] font-semibold text-brand">{tag}</Text>
            ))}
          </View>
        </View>
      </View>
    </Screen>
  );
}

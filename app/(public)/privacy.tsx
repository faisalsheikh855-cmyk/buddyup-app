import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Screen } from "@/components/ui/screen";
import { useThemeColors } from "@/theme/tokens";

const sections = [
  ["Information we collect", "BuddyUp stores account details, profile information, activity participation, messages, safety reports, blocks, and photos you choose to upload. Verification selfies are private and visible only to you and authorized safety administrators."],
  ["How we use information", "We use this information to operate the app, connect activity participants, prevent abuse, review selfie verification, provide safety tools, and maintain the security of BuddyUp."],
  ["Location", "Location access is optional. When enabled, precise location is used to calculate nearby activities. Do not publish a private home address as an activity location."],
  ["Your choices", "You can edit your profile, remove gallery photos, block members, and permanently delete your account from Settings. Account deletion removes your Auth account and associated BuddyUp data."],
  ["Safety and retention", "Reports and verification records may be retained as needed to investigate safety incidents, comply with law, and prevent repeated abuse."],
  ["Contact", "Privacy questions can be sent to the BuddyUp support contact listed in the app-store listing."],
];

export default function PrivacyScreen() {
  const colors = useThemeColors();
  return (
    <Screen scroll>
      <View className="pb-12 pt-3">
        <Pressable className="mb-6 h-11 w-11 items-center justify-center rounded-full bg-surface" onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={23} color={colors.ink} />
        </Pressable>
        <Text className="text-[30px] font-extrabold text-ink">Privacy policy</Text>
        <Text className="mb-8 mt-2 text-[12px] text-muted">Effective June 10, 2026</Text>
        <View className="gap-6">
          {sections.map(([title, body]) => (
            <View key={title}>
              <Text className="text-[17px] font-extrabold text-ink">{title}</Text>
              <Text className="mt-2 text-[14px] leading-6 text-muted">{body}</Text>
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}

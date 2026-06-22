import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Screen } from "@/components/ui/screen";
import { useThemeColors } from "@/theme/tokens";

const sections = [
  ["Purpose", "BuddyUp helps adults find people for social and recreational activities. It is not a dating service and does not guarantee the identity, conduct, or suitability of any member."],
  ["Eligibility", "You must be at least 18 years old and provide accurate account and profile information."],
  ["Member conduct", "Do not harass, threaten, impersonate, discriminate against, exploit, or endanger another person. Do not use BuddyUp for dating solicitation, commercial spam, illegal activity, or private-address meetups with strangers."],
  ["Safety", "Meet in a public place, tell someone you trust where you are going, arrange your own transportation, and contact local emergency services if you are in immediate danger."],
  ["Content and enforcement", "You are responsible for content you submit. BuddyUp may remove content, restrict features, suspend accounts, preserve safety records, or cooperate with lawful investigations."],
  ["Account termination", "You may delete your account in Settings. BuddyUp may suspend or terminate accounts that violate these terms or create safety risk."],
];

export default function TermsScreen() {
  const colors = useThemeColors();
  return (
    <Screen scroll>
      <View className="pb-12 pt-3">
        <Pressable className="mb-6 h-11 w-11 items-center justify-center rounded-full bg-surface" onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={23} color={colors.ink} />
        </Pressable>
        <Text className="text-[30px] font-extrabold text-ink">Terms of use</Text>
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

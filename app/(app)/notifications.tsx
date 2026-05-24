import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Screen } from "@/components/ui/screen";
import { colors } from "@/theme/tokens";

export default function NotificationsScreen() {
  return (
    <Screen>
      <View className="pt-3">
        <View className="mb-8 flex-row items-center gap-4">
          <Pressable className="h-11 w-11 items-center justify-center rounded-full bg-white" onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={23} color={colors.ink} />
          </Pressable>
          <Text className="text-[25px] font-bold text-ink">Notifications</Text>
        </View>
        <View className="rounded-app border border-line bg-white p-5">
          <Text className="text-[15px] font-bold text-ink">You are all caught up</Text>
          <Text className="mt-2 text-[13px] leading-5 text-muted">Activity requests and plan updates will land here.</Text>
        </View>
      </View>
    </Screen>
  );
}

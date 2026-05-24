import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { nearbyActivities } from "@/features/activities/mock-data";
import { colors } from "@/theme/tokens";

export function generateStaticParams() {
  return nearbyActivities.map((activity) => ({ id: activity.id }));
}

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const activity = nearbyActivities.find((item) => item.id === id) ?? nearbyActivities[0];

  return (
    <Screen scroll>
      <View className="pb-6 pt-3">
        <Pressable className="mb-8 h-11 w-11 items-center justify-center rounded-full bg-white" onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={23} color={colors.ink} />
        </Pressable>
        <Text className="mb-5 self-start rounded-full bg-brand-soft px-3 py-2 text-[12px] font-bold text-brand">{activity.category}</Text>
        <Text className="mb-8 text-[30px] font-bold leading-[37px] text-ink">{activity.title}</Text>
        <View className="mb-6 gap-5 rounded-app border border-line bg-white p-4">
          <Text className="text-[15px] text-ink"><Text className="font-bold">When  </Text>{activity.when}</Text>
          <Text className="text-[15px] text-ink"><Text className="font-bold">Where  </Text>{activity.location}</Text>
          <Text className="text-[15px] text-ink"><Text className="font-bold">Host  </Text>{activity.host}</Text>
        </View>
        <Text className="mb-8 text-[15px] leading-6 text-muted">Friendly, platonic meetup. Confirm details in chat once your request is accepted.</Text>
        <Button onPress={() => router.push("/(app)/chat/preview")}>Request to join</Button>
      </View>
    </Screen>
  );
}

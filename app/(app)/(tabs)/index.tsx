import { FlatList, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Screen } from "@/components/ui/screen";
import { Header } from "@/components/ui/header";
import { nearbyActivities, FeedActivity } from "@/features/activities/mock-data";
import { colors } from "@/theme/tokens";

function ActivityCard({ item }: { item: FeedActivity }) {
  return (
    <Pressable className="mb-3 rounded-app border border-line bg-white p-4 active:bg-brand-soft" onPress={() => router.push(`/(app)/activities/${item.id}`)}>
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="rounded-full bg-brand-soft px-3 py-2 text-[12px] font-bold text-brand">{item.category}</Text>
        <Text className="text-[12px] text-muted">{item.distance}</Text>
      </View>
      <Text className="mb-3 text-[17px] font-bold text-ink">{item.title}</Text>
      <Text className="mb-2 text-[13px] text-muted">{item.when}  |  {item.location}</Text>
      <Text className="text-[13px] font-semibold text-ink">{item.host}  -  {item.spots} open spots</Text>
    </Pressable>
  );
}

export default function FeedScreen() {
  return (
    <Screen>
      <View className="pt-4">
        <Header
          title="Explore"
          subtitle="Plans happening near you"
          action={(
            <Pressable className="h-12 w-12 items-center justify-center rounded-full bg-white" onPress={() => router.push("/(app)/notifications")}>
              <Ionicons name="notifications-outline" size={22} color={colors.ink} />
            </Pressable>
          )}
        />
      </View>
      <FlatList
        data={nearbyActivities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ActivityCard item={item} />}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

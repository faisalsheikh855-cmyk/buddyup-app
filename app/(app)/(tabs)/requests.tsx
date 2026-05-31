import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Header } from "@/components/ui/header";
import { Screen } from "@/components/ui/screen";
import { colors } from "@/theme/tokens";

export default function RequestsScreen() {
  return (
    <Screen>
      <View className="pt-4">
        <Header title="Requests" subtitle="People ready to join your plans" />
        <View className="rounded-[22px] border border-line bg-white px-5 py-10">
          <View className="mx-auto mb-4 h-14 w-14 items-center justify-center rounded-full bg-brand-soft">
            <Ionicons name="people-outline" size={25} color={colors.brand} />
          </View>
          <Text className="text-center text-[18px] font-extrabold text-ink">No join requests yet</Text>
          <Text className="mt-2 text-center text-[14px] leading-5 text-muted">When someone wants to play tennis, chess, badminton, or another plan you host, they will show up here.</Text>
        </View>
        <View className="mt-4 rounded-[20px] bg-ink p-4">
          <Text className="text-[15px] font-extrabold text-white">Tip</Text>
          <Text className="mt-1 text-[13px] leading-5 text-white/70">Plans with a clear time, venue, and skill level usually get faster responses.</Text>
        </View>
      </View>
    </Screen>
  );
}

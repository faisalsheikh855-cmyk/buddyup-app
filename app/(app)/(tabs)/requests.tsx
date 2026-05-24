import { Text, View } from "react-native";
import { Header } from "@/components/ui/header";
import { Screen } from "@/components/ui/screen";

export default function RequestsScreen() {
  return (
    <Screen>
      <View className="pt-4">
        <Header title="Requests" subtitle="People ready to join your plans" />
        <View className="rounded-app border border-line bg-white px-4 py-10">
          <Text className="text-center text-[15px] font-semibold text-ink">No requests yet</Text>
          <Text className="mt-2 text-center text-[13px] text-muted">New join requests will appear here.</Text>
        </View>
      </View>
    </Screen>
  );
}

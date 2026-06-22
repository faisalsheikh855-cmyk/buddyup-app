import { Text, View } from "react-native";
import { router } from "expo-router";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";

export default function NotFoundScreen() {
  return (
    <Screen>
      <View className="flex-1 items-center justify-center px-4">
        <Text className="text-center text-[28px] font-extrabold text-ink">Page not found</Text>
        <Text className="mt-3 text-center text-[14px] leading-6 text-muted">
          This BuddyUp link may have expired or the activity is no longer available.
        </Text>
        <View className="mt-7 w-full">
          <Button onPress={() => router.replace("/")}>Return to BuddyUp</Button>
        </View>
      </View>
    </Screen>
  );
}

import { Text, TextInput, View } from "react-native";
import { Header } from "@/components/ui/header";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";

export default function CreateActivityScreen() {
  return (
    <Screen scroll keyboard>
      <View className="pt-4">
        <Header title="Create activity" subtitle="Make a plan people can join" />
        <View className="gap-4">
          <TextInput className="h-[54px] rounded-app border border-line bg-white px-4 text-[16px] text-ink" placeholder="Activity title" placeholderTextColor="#93A19B" />
          <TextInput className="h-[54px] rounded-app border border-line bg-white px-4 text-[16px] text-ink" placeholder="Place or venue" placeholderTextColor="#93A19B" />
          <TextInput className="h-28 rounded-app border border-line bg-white p-4 text-[16px] text-ink" placeholder="What should buddies know?" placeholderTextColor="#93A19B" multiline textAlignVertical="top" />
          <Text className="text-[13px] text-muted">Activity publishing will connect to Supabase in the activity slice.</Text>
          <Button disabled>Post activity</Button>
        </View>
      </View>
    </Screen>
  );
}

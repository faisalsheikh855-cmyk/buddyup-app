import { Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Header } from "@/components/ui/header";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { colors } from "@/theme/tokens";

const activities = ["Tennis", "Badminton", "Chess", "Table tennis", "Basketball", "Run club"];
const levels = ["Beginner", "Casual", "Intermediate"];

export default function CreateActivityScreen() {
  return (
    <Screen scroll keyboard>
      <View className="pt-4">
        <Header title="Create activity" subtitle="Make a plan people can join" />
        <View className="mb-5 rounded-[20px] bg-ink p-5">
          <View className="mb-4 h-11 w-11 items-center justify-center rounded-full bg-white/15">
            <Ionicons name="calendar-outline" size={22} color={colors.white} />
          </View>
          <Text className="text-[23px] font-extrabold leading-tight text-white">Host a game people can actually join.</Text>
          <Text className="mt-2 text-[14px] font-semibold leading-5 text-white/70">Add the sport, place, skill level, and a short note. BuddyUp will handle join requests here next.</Text>
        </View>

        <View className="gap-5">
          <View>
            <Text className="mb-2 text-[13px] font-extrabold text-ink">Activity</Text>
            <View className="flex-row flex-wrap gap-2">
              {activities.map((activity, index) => (
                <Pressable key={activity} className={`rounded-full px-3.5 py-2.5 ${index === 0 ? "bg-brand" : "border border-line bg-white"}`}>
                  <Text className={`text-[12px] font-extrabold ${index === 0 ? "text-white" : "text-ink"}`}>{activity}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <TextInput className="h-[56px] rounded-[16px] border border-line bg-white px-4 text-[16px] text-ink" placeholder="Plan title, e.g. doubles at Kits courts" placeholderTextColor="#93A19B" />
          <TextInput className="h-[56px] rounded-[16px] border border-line bg-white px-4 text-[16px] text-ink" placeholder="Place or venue" placeholderTextColor="#93A19B" />

          <View>
            <Text className="mb-2 text-[13px] font-extrabold text-ink">Skill level</Text>
            <View className="flex-row gap-2">
              {levels.map((level, index) => (
                <Pressable key={level} className={`flex-1 rounded-[14px] px-3 py-3 ${index === 1 ? "bg-brand-soft" : "bg-white"}`}>
                  <Text className={`text-center text-[12px] font-extrabold ${index === 1 ? "text-brand" : "text-muted"}`}>{level}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <TextInput className="h-28 rounded-[16px] border border-line bg-white p-4 text-[16px] text-ink" placeholder="What should buddies know?" placeholderTextColor="#93A19B" multiline textAlignVertical="top" />
          <Text className="text-[13px] leading-5 text-muted">Activity publishing will connect to Supabase in the activity slice.</Text>
          <Button disabled>Post activity</Button>
        </View>
      </View>
    </Screen>
  );
}

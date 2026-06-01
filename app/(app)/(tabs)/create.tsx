import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Header } from "@/components/ui/header";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { useCreateActivity } from "@/features/activities/hooks";
import { colors } from "@/theme/tokens";

const activities = ["Tennis", "Badminton", "Chess", "Table tennis", "Basketball", "Run club"];
const levels = ["Beginner", "Casual", "Intermediate"];
const dates = ["Today", "Tomorrow", "Friday", "This weekend"];

export default function CreateActivityScreen() {
  const [activity, setActivity] = useState(activities[0]);
  const [level, setLevel] = useState(levels[1]);
  const [dateLabel, setDateLabel] = useState(dates[0]);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState("6:30 PM");
  const [spots, setSpots] = useState("4");
  const [description, setDescription] = useState("");
  const createMutation = useCreateActivity();
  const canPost = title.trim() && location.trim() && startsAt.trim() && Number(spots) > 0;

  function postActivity() {
    if (!canPost) return;
    createMutation.mutate(
      {
        title: title.trim(),
        category: activity,
        location: location.trim(),
        dateLabel,
        startsAt: startsAt.trim(),
        spots: Number(spots),
        pace: level,
        description: description.trim() || "Friendly activity. Request to join and confirm details with the host.",
      },
      {
        onSuccess: (created) => {
          setTitle("");
          setLocation("");
          setDescription("");
          router.push(`/(app)/activities/${created.id}`);
        },
      },
    );
  }

  return (
    <Screen scroll keyboard>
      <View className="pt-4">
        <Header title="Create activity" subtitle="Make a plan people can join" />
        <View className="mb-5 rounded-[20px] bg-ink p-5">
          <View className="mb-4 h-11 w-11 items-center justify-center rounded-full bg-white/15">
            <Ionicons name="calendar-outline" size={22} color={colors.white} />
          </View>
          <Text className="text-[23px] font-extrabold leading-tight text-white">Host a game people can actually join.</Text>
          <Text className="mt-2 text-[14px] font-semibold leading-5 text-white/70">Add a clear time, place, skill level, and how many people can join.</Text>
        </View>

        {createMutation.error ? (
          <View className="mb-4 rounded-[18px] bg-coral-soft px-4 py-3">
            <Text className="text-[13px] leading-5 text-[#A4483F]">{createMutation.error.message}</Text>
          </View>
        ) : null}

        <View className="gap-5">
          <View>
            <Text className="mb-2 text-[13px] font-extrabold text-ink">Activity</Text>
            <View className="flex-row flex-wrap gap-2">
              {activities.map((item) => (
                <Pressable key={item} className={`rounded-full px-3.5 py-2.5 ${activity === item ? "bg-brand" : "border border-line bg-white"}`} onPress={() => setActivity(item)}>
                  <Text className={`text-[12px] font-extrabold ${activity === item ? "text-white" : "text-ink"}`}>{item}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <TextInput
            className="h-[56px] rounded-[16px] border border-line bg-white px-4 text-[16px] text-ink"
            value={title}
            onChangeText={setTitle}
            placeholder="Plan title, e.g. doubles at Kits courts"
            placeholderTextColor="#93A19B"
          />
          <TextInput
            className="h-[56px] rounded-[16px] border border-line bg-white px-4 text-[16px] text-ink"
            value={location}
            onChangeText={setLocation}
            placeholder="Place or venue"
            placeholderTextColor="#93A19B"
          />

          <View className="flex-row gap-3">
            <TextInput
              className="h-[56px] flex-1 rounded-[16px] border border-line bg-white px-4 text-[16px] text-ink"
              value={startsAt}
              onChangeText={setStartsAt}
              placeholder="Start time"
              placeholderTextColor="#93A19B"
            />
            <TextInput
              className="h-[56px] w-[92px] rounded-[16px] border border-line bg-white px-4 text-[16px] text-ink"
              value={spots}
              onChangeText={setSpots}
              keyboardType="number-pad"
              placeholder="Spots"
              placeholderTextColor="#93A19B"
            />
          </View>

          <View>
            <Text className="mb-2 text-[13px] font-extrabold text-ink">Date</Text>
            <View className="flex-row flex-wrap gap-2">
              {dates.map((date) => (
                <Pressable key={date} className={`rounded-[14px] px-3 py-3 ${dateLabel === date ? "bg-brand-soft" : "bg-white"}`} onPress={() => setDateLabel(date)}>
                  <Text className={`text-center text-[12px] font-extrabold ${dateLabel === date ? "text-brand" : "text-muted"}`}>{date}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View>
            <Text className="mb-2 text-[13px] font-extrabold text-ink">Skill level</Text>
            <View className="flex-row gap-2">
              {levels.map((item) => (
                <Pressable key={item} className={`flex-1 rounded-[14px] px-3 py-3 ${level === item ? "bg-brand-soft" : "bg-white"}`} onPress={() => setLevel(item)}>
                  <Text className={`text-center text-[12px] font-extrabold ${level === item ? "text-brand" : "text-muted"}`}>{item}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <TextInput
            className="h-28 rounded-[16px] border border-line bg-white p-4 text-[16px] text-ink"
            value={description}
            onChangeText={setDescription}
            placeholder="What should buddies know?"
            placeholderTextColor="#93A19B"
            multiline
            textAlignVertical="top"
          />
          <Button loading={createMutation.isPending} disabled={!canPost} onPress={postActivity}>Post activity</Button>
        </View>
      </View>
    </Screen>
  );
}

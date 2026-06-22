import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { useActivity, useUpdateActivity } from "@/features/activities/hooks";
import { useCurrentProfile } from "@/features/profile/hooks";
import { useThemeColors } from "@/theme/tokens";

export default function EditActivityScreen() {
  const colors = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const activityQuery = useActivity(id);
  const profileQuery = useCurrentProfile();
  const updateMutation = useUpdateActivity();
  const activity = activityQuery.data;
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [maxPeople, setMaxPeople] = useState("2");

  useEffect(() => {
    if (!activity) return;
    setTitle(activity.title);
    setLocation(activity.location_name ?? "");
    setDescription(activity.description ?? "");
    setDate(activity.activity_date ?? "");
    setTime(activity.activity_time?.slice(0, 5) ?? "");
    setMaxPeople(String(activity.max_people));
  }, [activity]);

  if (activityQuery.isLoading || profileQuery.isLoading) {
    return <Screen><View className="flex-1 items-center justify-center"><ActivityIndicator color={colors.brand} /></View></Screen>;
  }

  if (!activity || activity.created_by !== profileQuery.data?.id) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-[22px] font-extrabold text-ink">Not authorized</Text>
          <Text className="mt-2 text-center text-[13px] leading-5 text-muted">Only the host can edit this activity.</Text>
          <View className="mt-6"><Button variant="secondary" onPress={() => router.back()}>Go back</Button></View>
        </View>
      </Screen>
    );
  }

  function save() {
    if (!activity) return;
    const groupSize = Number(maxPeople);
    if (!title.trim() || !location.trim() || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
      Alert.alert("Check activity details", "Add a title, place, date as YYYY-MM-DD, and time as HH:MM.");
      return;
    }
    if (groupSize < activity.joined_count || groupSize > 100) {
      Alert.alert("Check group size", `Group size must be between ${activity.joined_count} and 100.`);
      return;
    }
    updateMutation.mutate(
      {
        id: activity.id,
        update: {
          title: title.trim(),
          location_name: location.trim(),
          description: description.trim(),
          activity_date: date,
          activity_time: time,
          max_people: groupSize,
        },
      },
      {
        onSuccess: () => {
          Alert.alert("Activity updated");
          router.back();
        },
        onError: (error) => Alert.alert("Could not update activity", error.message),
      },
    );
  }

  return (
    <Screen scroll keyboard>
      <View className="pb-12 pt-3">
        <Pressable className="mb-6 h-11 w-11 items-center justify-center rounded-full bg-surface" onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={23} color={colors.ink} />
        </Pressable>
        <Text className="text-[30px] font-extrabold text-ink">Edit activity</Text>
        <Text className="mb-7 mt-2 text-[13px] leading-5 text-muted">Keep accepted members informed when details change.</Text>

        <View className="gap-4">
          <TextInput className="h-[54px] rounded-app border border-line bg-surface px-4 text-[15px] text-ink" value={title} onChangeText={setTitle} placeholder="Title" />
          <TextInput className="h-[54px] rounded-app border border-line bg-surface px-4 text-[15px] text-ink" value={location} onChangeText={setLocation} placeholder="Venue or public place" />
          <View className="flex-row gap-3">
            <TextInput className="h-[54px] flex-1 rounded-app border border-line bg-surface px-4 text-[15px] text-ink" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
            <TextInput className="h-[54px] w-28 rounded-app border border-line bg-surface px-4 text-[15px] text-ink" value={time} onChangeText={setTime} placeholder="HH:MM" />
          </View>
          <TextInput className="h-[54px] rounded-app border border-line bg-surface px-4 text-[15px] text-ink" value={maxPeople} onChangeText={setMaxPeople} keyboardType="number-pad" placeholder="Total group size" />
          <TextInput className="min-h-28 rounded-app border border-line bg-surface p-4 text-[15px] leading-5 text-ink" value={description} onChangeText={setDescription} multiline textAlignVertical="top" placeholder="Description" />
          <Button loading={updateMutation.isPending} onPress={save}>Save changes</Button>
        </View>
      </View>
    </Screen>
  );
}

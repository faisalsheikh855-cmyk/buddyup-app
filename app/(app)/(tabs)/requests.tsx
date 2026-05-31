import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Header } from "@/components/ui/header";
import { Screen } from "@/components/ui/screen";
import { useHostRequests, useRespondToRequest } from "@/features/activities/hooks";
import type { ActivityRequest } from "@/features/activities/api";
import { colors } from "@/theme/tokens";

function RequestCard({ request, onRespond, pending }: { request: ActivityRequest; onRespond: (status: "accepted" | "declined") => void; pending: boolean }) {
  return (
    <View className="rounded-[22px] border border-line bg-white p-4">
      <View className="mb-3 flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="text-[17px] font-extrabold text-ink">{request.requester?.name ?? "BuddyUp user"}</Text>
          <Text className="mt-1 text-[13px] font-semibold text-muted">{request.requester?.neighborhood ?? "Nearby"} · wants to join</Text>
        </View>
        <View className={`rounded-full px-3 py-1.5 ${request.status === "pending" ? "bg-brand-soft" : "bg-[#EDF1EE]"}`}>
          <Text className={`text-[11px] font-extrabold ${request.status === "pending" ? "text-brand" : "text-muted"}`}>{request.status}</Text>
        </View>
      </View>
      <Text className="text-[15px] font-extrabold text-ink">{request.activity?.title}</Text>
      <Text className="mt-1 text-[13px] font-semibold text-muted">{request.activity?.date_label}, {request.activity?.starts_at} · {request.activity?.location}</Text>
      <Text className="mt-3 rounded-[16px] bg-[#F3F5F3] px-3 py-3 text-[13px] leading-5 text-muted">{request.message}</Text>
      {request.status === "pending" ? (
        <View className="mt-4 flex-row gap-3">
          <Pressable disabled={pending} className="h-11 flex-1 items-center justify-center rounded-full bg-brand" onPress={() => onRespond("accepted")}>
            <Text className="text-[13px] font-extrabold text-white">Accept</Text>
          </Pressable>
          <Pressable disabled={pending} className="h-11 flex-1 items-center justify-center rounded-full border border-line bg-white" onPress={() => onRespond("declined")}>
            <Text className="text-[13px] font-extrabold text-muted">Decline</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

export default function RequestsScreen() {
  const requestsQuery = useHostRequests();
  const respondMutation = useRespondToRequest();
  const requests = requestsQuery.data ?? [];

  return (
    <Screen>
      <View className="pt-4">
        <Header title="Requests" subtitle="People ready to join your plans" />

        {requestsQuery.isLoading ? (
          <View className="rounded-[22px] border border-line bg-white p-8">
            <ActivityIndicator color={colors.brand} />
            <Text className="mt-3 text-center text-[14px] font-semibold text-muted">Loading requests...</Text>
          </View>
        ) : null}

        {requestsQuery.error ? (
          <View className="rounded-[22px] bg-coral-soft p-4">
            <Text className="text-[13px] font-bold text-[#A4483F]">Could not load join requests. Make sure the Supabase schema has been applied.</Text>
          </View>
        ) : null}

        {!requestsQuery.isLoading && !requestsQuery.error && requests.length === 0 ? (
          <>
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
          </>
        ) : null}

        <View className="gap-3">
          {requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              pending={respondMutation.isPending}
              onRespond={(status) => respondMutation.mutate(
                { requestId: request.id, status },
                {
                  onSuccess: (conversationId) => {
                    if (status === "accepted" && conversationId) router.push(`/(app)/chat/${conversationId}`);
                  },
                },
              )}
            />
          ))}
        </View>
      </View>
    </Screen>
  );
}

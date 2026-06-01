import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useConversation, useMessages, useSendMessage } from "@/features/chat/hooks";
import { useSessionStore } from "@/store/session-store";
import { colors } from "@/theme/tokens";

const previewMessages = [
  { id: "1", body: "Hey! Still good for badminton tonight?", mine: false },
  { id: "2", body: "Yes, I can be there ten minutes early.", mine: true },
  { id: "3", body: "Perfect. See you by court 2.", mine: false },
];

export function generateStaticParams() {
  return [{ id: "preview" }];
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [message, setMessage] = useState("");
  const [localPreviewMessages, setLocalPreviewMessages] = useState(previewMessages);
  const session = useSessionStore((state) => state.session);
  const conversationQuery = useConversation(id);
  const messagesQuery = useMessages(id);
  const sendMutation = useSendMessage(id);
  const isPreview = id === "preview";
  const messages = isPreview
    ? localPreviewMessages
    : (messagesQuery.data ?? []).map((item) => ({ id: item.id, body: item.body, mine: item.sender_id === session?.user.id }));
  const activity = conversationQuery.data?.activity;

  function send() {
    if (!message.trim()) return;
    const nextMessage = message.trim();
    setMessage("");
    if (isPreview) {
      setLocalPreviewMessages((current) => [...current, { id: String(Date.now()), body: nextMessage, mine: true }]);
      return;
    }
    sendMutation.mutate(nextMessage);
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View className="h-16 flex-row items-center gap-4 border-b border-line px-5">
          <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={colors.ink} /></Pressable>
          <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-soft"><Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.brand} /></View>
          <View className="min-w-0 flex-1">
            <Text className="text-[15px] font-bold text-ink">{activity?.title ?? "Activity chat"}</Text>
            <Text className="text-[12px] text-muted">{activity ? `${activity.date_label}, ${activity.starts_at}` : "Confirm details with your buddy"}</Text>
          </View>
        </View>
        <View className="m-4 rounded-app bg-brand-soft px-4 py-3">
          <Text className="text-[13px] font-semibold text-brand">{activity ? `${activity.location}` : "Accepted members can use this chat to coordinate."}</Text>
        </View>

        {conversationQuery.isLoading || messagesQuery.isLoading ? (
          <View className="items-center py-6">
            <ActivityIndicator color={colors.brand} />
          </View>
        ) : null}

        {conversationQuery.error || messagesQuery.error || sendMutation.error ? (
          <View className="mx-4 rounded-[18px] bg-coral-soft px-4 py-3">
            <Text className="text-[13px] leading-5 text-[#A4483F]">Could not load or send chat messages.</Text>
          </View>
        ) : null}

        <View className="flex-1 gap-3 px-5 pt-4">
          {messages.length === 0 ? (
            <View className="rounded-[20px] bg-[#F3F5F3] p-4">
              <Text className="text-center text-[14px] font-semibold text-muted">No messages yet. Say hello and confirm the plan.</Text>
            </View>
          ) : null}
          {messages.map((item) => (
            <View key={item.id} className={`max-w-[82%] rounded-app px-4 py-3 ${item.mine ? "self-end bg-brand" : "self-start bg-[#EDF1EE]"}`}>
              <Text className={`text-[15px] leading-5 ${item.mine ? "text-white" : "text-ink"}`}>{item.body}</Text>
            </View>
          ))}
        </View>
        <View className="flex-row items-center gap-3 border-t border-line px-4 py-3">
          <TextInput
            className="h-[48px] flex-1 rounded-full bg-[#F3F5F3] px-5 text-[15px] text-ink"
            value={message}
            onChangeText={setMessage}
            placeholder="Message"
            placeholderTextColor="#93A19B"
          />
          <Pressable className="h-[48px] w-[48px] items-center justify-center rounded-full bg-brand" onPress={send} disabled={sendMutation.isPending}>
            <Ionicons name="send" size={19} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

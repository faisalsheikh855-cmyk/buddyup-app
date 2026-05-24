import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/theme/tokens";

const initialMessages = [
  { id: "1", body: "Hey! Still good for badminton tonight?", mine: false },
  { id: "2", body: "Yes, I can be there ten minutes early.", mine: true },
  { id: "3", body: "Perfect. See you by court 2.", mine: false },
];

export function generateStaticParams() {
  return [{ id: "preview" }];
}

export default function ChatScreen() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(initialMessages);

  function send() {
    if (!message.trim()) return;
    setMessages((current) => [...current, { id: String(Date.now()), body: message.trim(), mine: true }]);
    setMessage("");
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View className="h-16 flex-row items-center gap-4 border-b border-line px-5">
          <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={colors.ink} /></Pressable>
          <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-soft"><Text className="font-bold text-brand">MA</Text></View>
          <View><Text className="text-[15px] font-bold text-ink">Maya</Text><Text className="text-[12px] text-muted">Badminton doubles</Text></View>
        </View>
        <View className="m-4 rounded-app bg-brand-soft px-4 py-3">
          <Text className="text-[13px] font-semibold text-brand">Today, 6:30 PM  |  Roundhouse Centre</Text>
        </View>
        <View className="flex-1 gap-3 px-5 pt-4">
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
          <Pressable className="h-[48px] w-[48px] items-center justify-center rounded-full bg-brand" onPress={send}>
            <Ionicons name="send" size={19} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

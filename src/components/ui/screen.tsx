import { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function Screen({ children, scroll = false, keyboard = false }: { children: ReactNode; scroll?: boolean; keyboard?: boolean }) {
  const body = scroll ? (
    <ScrollView className="flex-1" contentContainerClassName="flex-grow px-5 pb-8" keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  ) : <View className="flex-1 px-5">{children}</View>;

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={["top", "bottom"]}>
      {keyboard ? (
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
          {body}
        </KeyboardAvoidingView>
      ) : body}
    </SafeAreaView>
  );
}

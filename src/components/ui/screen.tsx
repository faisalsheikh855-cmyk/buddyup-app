import { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function Screen({ children, scroll = false, keyboard = false }: { children: ReactNode; scroll?: boolean; keyboard?: boolean }) {
  const { width } = useWindowDimensions();
  const webFrameStyle = Platform.OS === "web"
    ? { alignSelf: "center" as const, maxWidth: "100%" as const, width: Math.min(width || 390, 480) }
    : undefined;
  const body = scroll ? (
    <ScrollView
      className="flex-1"
      contentContainerClassName="flex-grow px-5 pb-8"
      contentContainerStyle={{ width: "100%" }}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : <View className="flex-1 px-5">{children}</View>;

  return (
    <SafeAreaView className="w-full min-w-0 flex-1 overflow-hidden bg-canvas" edges={["top", "bottom"]} style={webFrameStyle}>
      {keyboard ? (
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
          {body}
        </KeyboardAvoidingView>
      ) : body}
    </SafeAreaView>
  );
}

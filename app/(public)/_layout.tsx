import { Stack } from "expo-router";

export default function PublicLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      <Stack.Screen name="auth" />
    </Stack>
  );
}

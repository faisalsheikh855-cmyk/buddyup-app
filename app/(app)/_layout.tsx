import { Redirect, Stack } from "expo-router";
import { useSessionStore } from "@/store/session-store";

export default function AppLayout() {
  const session = useSessionStore((state) => state.session);
  if (!session) return <Redirect href="/(public)/auth" />;

  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="activities/[id]" />
      <Stack.Screen name="activities/[id]/edit" />
      <Stack.Screen name="profiles/[id]" />
      <Stack.Screen name="chat/[id]" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="blocked-accounts" />
      <Stack.Screen name="verification" />
      <Stack.Screen name="admin/verifications" />
      <Stack.Screen name="admin/reports" />
    </Stack>
  );
}

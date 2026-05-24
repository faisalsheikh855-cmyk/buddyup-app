import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { useSignOut } from "@/features/auth/hooks";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useSessionStore } from "@/store/session-store";
import { colors } from "@/theme/tokens";

export default function SettingsScreen() {
  const signOutMutation = useSignOut();
  const setSession = useSessionStore((state) => state.setSession);
  const previewMode = useSessionStore((state) => state.previewMode);
  const stopPreview = useSessionStore((state) => state.stopPreview);

  async function logout() {
    if (!previewMode && isSupabaseConfigured) {
      await signOutMutation.mutateAsync();
    }
    stopPreview();
    setSession(null);
    router.replace("/(public)/auth");
  }

  return (
    <Screen>
      <View className="pt-3">
        <View className="mb-8 flex-row items-center gap-4">
          <Pressable className="h-11 w-11 items-center justify-center rounded-full bg-white" onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={23} color={colors.ink} />
          </Pressable>
          <Text className="text-[25px] font-bold text-ink">Settings</Text>
        </View>
        <View className="mb-8 rounded-app border border-line bg-white">
          {["Privacy and safety", "Notification preferences", "Blocked accounts"].map((label) => (
            <View key={label} className="h-14 flex-row items-center justify-between border-b border-line px-4 last:border-b-0">
              <Text className="text-[15px] text-ink">{label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </View>
          ))}
        </View>
        <Button variant="secondary" loading={signOutMutation.isPending} onPress={logout}>Log out</Button>
      </View>
    </Screen>
  );
}

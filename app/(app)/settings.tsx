import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { useSignOut } from "@/features/auth/hooks";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useSessionStore } from "@/store/session-store";
import { useCurrentProfile } from "@/features/profile/hooks";
import { type ThemeMode, useTheme } from "@/theme/tokens";

const themeOptions: { value: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: "light", label: "Light", icon: "sunny-outline" },
  { value: "dark", label: "Dark", icon: "moon-outline" },
  { value: "system", label: "Device", icon: "phone-portrait-outline" },
];

export default function SettingsScreen() {
  const signOutMutation = useSignOut();
  const setSession = useSessionStore((state) => state.setSession);
  const previewMode = useSessionStore((state) => state.previewMode);
  const stopPreview = useSessionStore((state) => state.stopPreview);
  const { colors, mode, setMode } = useTheme();
  const profileQuery = useCurrentProfile();

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
          <Pressable className="h-11 w-11 items-center justify-center rounded-full bg-surface" onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={23} color={colors.ink} />
          </Pressable>
          <Text className="text-[25px] font-bold text-ink">Settings</Text>
        </View>
        <View className="mb-8">
          <Text className="mb-2 text-[16px] font-extrabold text-ink">Appearance</Text>
          <Text className="mb-4 text-[13px] leading-5 text-muted">Choose how BuddyUp looks on this device.</Text>
          <View className="flex-row rounded-app bg-line p-1">
            {themeOptions.map((option) => {
              const selected = mode === option.value;
              return (
                <Pressable
                  key={option.value}
                  className={`h-12 flex-1 flex-row items-center justify-center gap-2 rounded-md ${selected ? "bg-surface" : ""}`}
                  onPress={() => setMode(option.value)}
                >
                  <Ionicons name={option.icon} size={17} color={selected ? colors.ink : colors.muted} />
                  <Text className={`text-[12px] font-bold ${selected ? "text-ink" : "text-muted"}`}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View className="mb-8 rounded-app border border-line bg-surface">
          {["Privacy and safety", "Notification preferences", "Blocked accounts"].map((label) => (
            <View key={label} className="h-14 flex-row items-center justify-between border-b border-line px-4 last:border-b-0">
              <Text className="text-[15px] text-ink">{label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </View>
          ))}
        </View>
        {profileQuery.data?.is_admin ? (
          <Pressable
            className="mb-8 h-14 flex-row items-center justify-between rounded-app border border-line bg-surface px-4"
            onPress={() => router.push("/(app)/admin/verifications" as Href)}
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.brand} />
              <Text className="text-[15px] font-bold text-ink">Selfie verification reviews</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        ) : null}
        <Button variant="secondary" loading={signOutMutation.isPending} onPress={logout}>Log out</Button>
      </View>
    </Screen>
  );
}

import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Screen } from "@/components/ui/screen";
import { useUpdatePassword } from "@/features/auth/hooks";
import { useThemeColors } from "@/theme/tokens";
import { useSessionStore } from "@/store/session-store";

export default function ResetPasswordScreen() {
  const colors = useThemeColors();
  const mutation = useUpdatePassword();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const setPasswordRecovery = useSessionStore((state) => state.setPasswordRecovery);

  async function save() {
    setNotice(null);
    if (password.length < 8) {
      setNotice("Use at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setNotice("Passwords do not match.");
      return;
    }
    try {
      await mutation.mutateAsync(password);
      setPasswordRecovery(false);
      setNotice("Password updated. You can continue to BuddyUp.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not update the password.");
    }
  }

  return (
    <Screen scroll keyboard>
      <View className="flex-1 justify-center py-10">
        <Pressable className="mb-8 h-11 w-11 items-center justify-center rounded-full bg-surface" onPress={() => router.replace("/(public)/auth")}>
          <Ionicons name="chevron-back" size={23} color={colors.ink} />
        </Pressable>
        <Text className="text-[30px] font-extrabold text-ink">Choose a new password</Text>
        <Text className="mb-7 mt-2 text-[14px] leading-6 text-muted">
          Use at least 8 characters and avoid a password you use elsewhere.
        </Text>
        <View className="gap-4">
          <Field
            label="New password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secure}
            autoComplete="new-password"
            icon={<Ionicons name="lock-closed-outline" size={19} color={colors.muted} />}
            trailing={(
              <Pressable hitSlop={12} onPress={() => setSecure((value) => !value)}>
                <Ionicons name={secure ? "eye-outline" : "eye-off-outline"} size={20} color={colors.muted} />
              </Pressable>
            )}
          />
          <Field
            label="Confirm password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={secure}
            autoComplete="new-password"
            icon={<Ionicons name="checkmark-circle-outline" size={19} color={colors.muted} />}
          />
        </View>
        {notice ? (
          <View className="mt-5 rounded-app bg-brand-soft px-4 py-3">
            <Text className="text-[13px] leading-5 text-ink">{notice}</Text>
          </View>
        ) : null}
        <View className="mt-6">
          <Button loading={mutation.isPending} onPress={save}>Update password</Button>
        </View>
        {mutation.isSuccess ? (
          <View className="mt-3">
            <Button variant="secondary" onPress={() => router.replace("/")}>Continue</Button>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

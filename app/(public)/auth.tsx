import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Screen } from "@/components/ui/screen";
import {
  useRequestPasswordReset,
  useResendSignupConfirmation,
  useSignIn,
  useSignUp,
} from "@/features/auth/hooks";
import { useSessionStore } from "@/store/session-store";
import { useThemeColors } from "@/theme/tokens";

type AuthMode = "signup" | "login";

export default function AuthScreen() {
  const colors = useThemeColors();
  const [mode, setMode] = useState<AuthMode>("signup");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const signInMutation = useSignIn();
  const signUpMutation = useSignUp();
  const resetMutation = useRequestPasswordReset();
  const resendMutation = useResendSignupConfirmation();
  const setSession = useSessionStore((state) => state.setSession);
  const session = useSessionStore((state) => state.session);
  const passwordRecovery = useSessionStore((state) => state.passwordRecovery);
  const pending = signInMutation.isPending || signUpMutation.isPending;

  useEffect(() => {
    if (session) router.replace(passwordRecovery ? "/(public)/reset-password" : "/");
  }, [passwordRecovery, session]);

  async function submit() {
    setNotice(null);
    try {
      if (mode === "login") {
        const session = await signInMutation.mutateAsync({ email: email.trim(), password });
        setSession(session);
        router.replace("/");
        return;
      }
      const session = await signUpMutation.mutateAsync({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
      });
      if (!session) {
        setMode("login");
        setNotice("Check your email to verify your account, then log in.");
        return;
      }
      setSession(session);
      router.replace("/");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed. Try again.";
      setNotice(
        message.toLowerCase().includes("rate limit")
          ? "Supabase is rate-limiting signup emails right now. Try logging in if you already have an account, or use Preview while the limit resets."
          : message,
      );
    }
  }

  async function resetPassword() {
    if (!email.trim()) {
      setNotice("Enter your email address first.");
      return;
    }
    try {
      await resetMutation.mutateAsync(email);
      setNotice("Password reset email sent. Open the link on this device to choose a new password.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not send the reset email.");
    }
  }

  async function resendConfirmation() {
    if (!email.trim()) return;
    try {
      await resendMutation.mutateAsync(email);
      setNotice("A new confirmation email has been sent.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not resend the confirmation email.");
    }
  }

  return (
    <Screen scroll keyboard>
      <View className="pt-3">
        <Pressable className="h-11 w-11 items-center justify-center rounded-full bg-surface" onPress={() => router.replace("/(public)/onboarding")}>
          <Ionicons name="chevron-back" size={23} color={colors.ink} />
        </Pressable>
      </View>
      <Animated.View entering={FadeInDown.duration(380)} className="w-full min-w-0 flex-1 justify-center pb-9">
        <Text className="mb-2 text-[14px] font-bold text-brand">BuddyUp</Text>
        <Text className="block w-full mb-3 text-[31px] font-bold leading-[37px] text-ink">
          {mode === "signup" ? "Find your activity crew" : "Welcome back"}
        </Text>
        <Text className="block w-full mb-8 text-[15px] leading-6 text-muted">
          {mode === "signup" ? "Connect through plans, sports and spontaneous hangs." : "Your next plan is one tap away."}
        </Text>
        <View className="mb-7 h-[52px] flex-row rounded-app bg-line p-1">
          {(["signup", "login"] as AuthMode[]).map((item) => (
            <Pressable key={item} className={`flex-1 items-center justify-center rounded-md ${mode === item ? "bg-surface" : ""}`} onPress={() => { setMode(item); setNotice(null); }}>
              <Text className={`text-[14px] font-bold ${mode === item ? "text-ink" : "text-muted"}`}>
                {item === "signup" ? "Sign up" : "Log in"}
              </Text>
            </Pressable>
          ))}
        </View>
        <View className="gap-4">
          {mode === "signup" ? (
            <Field
              label="Full name"
              value={fullName}
              onChangeText={setFullName}
              autoComplete="name"
              placeholder="Your name"
              icon={<Ionicons name="person-outline" size={19} color={colors.muted} />}
            />
          ) : null}
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
            placeholder="you@email.com"
            icon={<Ionicons name="mail-outline" size={19} color={colors.muted} />}
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secure}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder="At least 8 characters"
            icon={<Ionicons name="lock-closed-outline" size={19} color={colors.muted} />}
            trailing={(
              <Pressable hitSlop={12} onPress={() => setSecure((value) => !value)}>
                <Ionicons name={secure ? "eye-outline" : "eye-off-outline"} size={20} color={colors.muted} />
              </Pressable>
            )}
          />
          {mode === "login" ? (
            <Pressable className="self-end" onPress={resetPassword} disabled={resetMutation.isPending}>
              <Text className="text-[12px] font-bold text-brand">
                {resetMutation.isPending ? "Sending..." : "Forgot password?"}
              </Text>
            </Pressable>
          ) : null}
        </View>
        {notice ? (
          <View className="mt-5 rounded-app bg-coral-soft px-4 py-3">
            <Text className="text-[13px] leading-5 text-[#A4483F]">{notice}</Text>
          </View>
        ) : null}
        {mode === "login" && notice?.toLowerCase().includes("confirm") ? (
          <Pressable className="mt-3 self-start" onPress={resendConfirmation} disabled={resendMutation.isPending}>
            <Text className="text-[12px] font-bold text-brand">
              {resendMutation.isPending ? "Sending..." : "Resend confirmation email"}
            </Text>
          </Pressable>
        ) : null}
        <View className="mt-8">
          <Button
            loading={pending}
            disabled={!email.trim() || password.length < 8 || (mode === "signup" && !fullName.trim())}
            onPress={submit}
          >
            {mode === "signup" ? "Create account" : "Log in"}
          </Button>
        </View>
        <Text className="mt-5 text-center text-[11px] leading-5 text-muted">
          By continuing, you agree to BuddyUp’s{" "}
          <Text className="font-bold text-brand" onPress={() => router.push("/(public)/terms" as Href)}>Terms of Use</Text>
          {" "}and acknowledge the{" "}
          <Text className="font-bold text-brand" onPress={() => router.push("/(public)/privacy" as Href)}>Privacy Policy</Text>.
        </Text>
      </Animated.View>
    </Screen>
  );
}

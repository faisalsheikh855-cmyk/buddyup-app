import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Screen } from "@/components/ui/screen";
import { useSignIn, useSignUp } from "@/features/auth/hooks";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useSessionStore } from "@/store/session-store";
import { colors } from "@/theme/tokens";

type AuthMode = "signup" | "login";

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const signInMutation = useSignIn();
  const signUpMutation = useSignUp();
  const setSession = useSessionStore((state) => state.setSession);
  const startPreview = useSessionStore((state) => state.startPreview);
  const pending = signInMutation.isPending || signUpMutation.isPending;

  async function submit() {
    setNotice(null);
    try {
      if (mode === "login") {
        const session = await signInMutation.mutateAsync({ email: email.trim(), password });
        setSession(session);
        router.replace("/(app)/(tabs)");
        return;
      }
      const session = await signUpMutation.mutateAsync({ email: email.trim(), password });
      if (!session) {
        setMode("login");
        setNotice("Check your email to verify your account, then log in.");
        return;
      }
      setSession(session);
      router.replace("/(app)/(tabs)");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Authentication failed. Try again.");
    }
  }

  return (
    <Screen scroll keyboard>
      <View className="pt-3">
        <Pressable className="h-11 w-11 items-center justify-center rounded-full bg-white" onPress={() => router.replace("/(public)/onboarding")}>
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
        <View className="mb-7 h-[52px] flex-row rounded-app bg-[#ECF0ED] p-1">
          {(["signup", "login"] as AuthMode[]).map((item) => (
            <Pressable key={item} className={`flex-1 items-center justify-center rounded-md ${mode === item ? "bg-white" : ""}`} onPress={() => { setMode(item); setNotice(null); }}>
              <Text className={`text-[14px] font-bold ${mode === item ? "text-ink" : "text-muted"}`}>
                {item === "signup" ? "Sign up" : "Log in"}
              </Text>
            </Pressable>
          ))}
        </View>
        <View className="gap-4">
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
            placeholder="At least 6 characters"
            icon={<Ionicons name="lock-closed-outline" size={19} color={colors.muted} />}
            trailing={(
              <Pressable hitSlop={12} onPress={() => setSecure((value) => !value)}>
                <Ionicons name={secure ? "eye-outline" : "eye-off-outline"} size={20} color={colors.muted} />
              </Pressable>
            )}
          />
        </View>
        {notice ? (
          <View className="mt-5 rounded-app bg-coral-soft px-4 py-3">
            <Text className="text-[13px] leading-5 text-[#A4483F]">{notice}</Text>
          </View>
        ) : null}
        {!isSupabaseConfigured ? (
          <View className="mt-5 rounded-app border border-line bg-white px-4 py-3">
            <Text className="block w-full text-[13px] leading-5 text-muted">Add Expo Supabase environment keys to enable authentication.</Text>
            <View className="mt-3">
              <Button
                variant="secondary"
                onPress={() => {
                  startPreview();
                  router.replace("/(app)/(tabs)");
                }}
              >
                Preview the app
              </Button>
            </View>
          </View>
        ) : null}
        <View className="mt-8">
          <Button loading={pending} disabled={!email.trim() || password.length < 6} onPress={submit}>
            {mode === "signup" ? "Create account" : "Log in"}
          </Button>
        </View>
      </Animated.View>
    </Screen>
  );
}

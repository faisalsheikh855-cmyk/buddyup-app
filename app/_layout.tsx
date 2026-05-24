import { useEffect } from "react";
import { ActivityIndicator, AppState, Platform, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { queryClient, subscribeToAppFocus } from "@/lib/query-client";
import { supabase } from "@/lib/supabase";
import { useSessionStore } from "@/store/session-store";
import { colors } from "@/theme/tokens";
import "../global.css";

export default function RootLayout() {
  const storageReady = useSessionStore((state) => state.storageReady);
  const authReady = useSessionStore((state) => state.authReady);
  const setSession = useSessionStore((state) => state.setSession);
  const setAuthReady = useSessionStore((state) => state.setAuthReady);
  const setStorageReady = useSessionStore((state) => state.setStorageReady);
  const ready = Platform.OS === "web" || (storageReady && authReady);

  useEffect(() => subscribeToAppFocus(), []);

  useEffect(() => {
    let mounted = true;
    const storageTimeout = setTimeout(() => {
      if (mounted) setStorageReady(true);
    }, 1500);

    void useSessionStore
      .getState()
      .hydrate()
      .catch(() => undefined)
      .finally(() => {
        clearTimeout(storageTimeout);
        if (mounted) setStorageReady(true);
      });

    return () => {
      mounted = false;
      clearTimeout(storageTimeout);
    };
  }, [setStorageReady]);

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return;
    }
    const client = supabase;
    let mounted = true;
    const authTimeout = setTimeout(() => {
      if (mounted) setAuthReady(true);
    }, 2000);

    void client.auth
      .getSession()
      .then(({ data }) => {
        if (mounted) setSession(data.session);
      })
      .catch(() => undefined)
      .finally(() => {
        clearTimeout(authTimeout);
        if (mounted) setAuthReady(true);
      });

    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
        setAuthReady(true);
      }
    });

    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") client.auth.startAutoRefresh();
      else client.auth.stopAutoRefresh();
    });

    return () => {
      mounted = false;
      clearTimeout(authTimeout);
      data.subscription.unsubscribe();
      appState.remove();
    };
  }, [setAuthReady, setSession]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          {!ready ? (
            <View className="flex-1 items-center justify-center bg-canvas">
              <ActivityIndicator size="large" color={colors.brand} />
            </View>
          ) : (
            <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(public)" />
              <Stack.Screen name="(app)" />
            </Stack>
          )}
          <StatusBar style="dark" />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

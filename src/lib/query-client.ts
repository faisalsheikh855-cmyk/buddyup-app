import { AppState, AppStateStatus, Platform } from "react-native";
import { focusManager, QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

export function subscribeToAppFocus() {
  if (Platform.OS === "web") return () => undefined;

  const onAppStateChange = (status: AppStateStatus) => {
    focusManager.setFocused(status === "active");
  };

  const subscription = AppState.addEventListener("change", onAppStateChange);
  return () => subscription.remove();
}

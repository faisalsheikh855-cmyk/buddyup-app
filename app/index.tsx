import { Redirect } from "expo-router";
import { useSessionStore } from "@/store/session-store";

export default function Index() {
  const onboarded = useSessionStore((state) => state.onboarded);
  const session = useSessionStore((state) => state.session);
  const previewMode = useSessionStore((state) => state.previewMode);

  if (!onboarded) return <Redirect href="/(public)/onboarding" />;
  if (!session && !previewMode) return <Redirect href="/(public)/auth" />;
  return <Redirect href="/(app)/(tabs)" />;
}

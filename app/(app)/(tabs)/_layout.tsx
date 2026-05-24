import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { colors } from "@/theme/tokens";

const icons = {
  index: ["compass-outline", "compass"] as const,
  create: ["add-circle-outline", "add-circle"] as const,
  requests: ["chatbubble-ellipses-outline", "chatbubble-ellipses"] as const,
  profile: ["person-outline", "person"] as const,
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: "#84918C",
        tabBarStyle: { height: 82, paddingTop: 9, paddingBottom: 24, borderTopColor: colors.line },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarIcon: ({ color, focused, size }) => {
          const set = icons[route.name as keyof typeof icons];
          return <Ionicons name={set ? set[focused ? 1 : 0] : "ellipse-outline"} color={color} size={size} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Explore" }} />
      <Tabs.Screen name="create" options={{ title: "Create" }} />
      <Tabs.Screen name="requests" options={{ title: "Requests" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}

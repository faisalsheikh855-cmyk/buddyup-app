import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { useWindowDimensions } from "react-native";
import { useThemeColors } from "@/theme/tokens";

const icons = {
  index: ["compass-outline", "compass"] as const,
  create: ["add-circle-outline", "add-circle"] as const,
  requests: ["chatbubble-ellipses-outline", "chatbubble-ellipses"] as const,
  profile: ["person-outline", "person"] as const,
};

export default function TabsLayout() {
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const tabBarWidth = Math.min(width - 36, 430);

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.white,
        tabBarInactiveTintColor: "rgba(255,255,255,0.68)",
        tabBarBackground: () => <BlurView intensity={55} tint="dark" style={{ flex: 1 }} />,
        tabBarStyle: {
          position: "absolute",
          left: (width - tabBarWidth) / 2,
          bottom: 18,
          width: tabBarWidth,
          height: 70,
          paddingTop: 10,
          paddingBottom: 12,
          borderTopWidth: 1,
          borderColor: "rgba(255,255,255,0.22)",
          borderRadius: 35,
          overflow: "hidden",
          backgroundColor: "rgba(20,37,31,0.62)",
        },
        tabBarItemStyle: { borderRadius: 34, marginHorizontal: 3 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
        tabBarIcon: ({ color, focused, size }) => {
          const set = icons[route.name as keyof typeof icons];
          return (
            <Ionicons
              name={set ? set[focused ? 1 : 0] : "ellipse-outline"}
              color={color}
              size={focused ? size + 2 : size}
            />
          );
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

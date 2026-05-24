import { ReactNode } from "react";
import { Text, View } from "react-native";

export function Header({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <View className="mb-6 flex-row items-center justify-between">
      <View>
        <Text className="mb-1 text-[13px] font-bold text-brand">BuddyUp</Text>
        <Text className="text-[27px] font-bold text-ink">{title}</Text>
        {subtitle ? <Text className="mt-2 text-[14px] text-muted">{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

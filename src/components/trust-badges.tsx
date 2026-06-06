import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Profile } from "@/features/profile/api";
import { colors } from "@/theme/tokens";

type TrustBadgesProps = {
  profile?: Pick<
    Profile,
    "email_verified" | "phone_number" | "avatar" | "selfie_verification_status" | "verification_status"
  > | null;
  compact?: boolean;
  showPlaceholder?: boolean;
};

const badges = [
  { key: "email", label: "Email verified", icon: "mail-outline" as const },
  { key: "phone", label: "Phone verified", icon: "call-outline" as const },
  { key: "photo", label: "Photo verified", icon: "camera-outline" as const },
  { key: "id", label: "ID verified", icon: "card-outline" as const },
  { key: "host", label: "Trusted host", icon: "shield-checkmark-outline" as const },
];

export function TrustBadges({ profile, compact = false, showPlaceholder = true }: TrustBadgesProps) {
  const active = {
    email: Boolean(profile?.email_verified),
    phone: Boolean(profile?.phone_number?.trim()),
    photo: Boolean(profile?.avatar?.trim() && profile?.selfie_verification_status === "approved"),
    id: false,
    host: profile?.verification_status === "verified",
  };

  return (
    <View className="flex-row flex-wrap gap-2">
      {badges.map((badge) => {
        const isActive = active[badge.key as keyof typeof active];
        if (!isActive && !showPlaceholder) return null;
        return (
          <View
            key={badge.key}
            className={`flex-row items-center rounded-full border ${
              compact ? "gap-1 px-2 py-1" : "gap-1.5 px-3 py-2"
            } ${isActive ? "border-brand bg-brand-soft" : "border-line bg-white"}`}
          >
            <Ionicons
              name={isActive ? "checkmark-circle" : badge.icon}
              size={compact ? 12 : 15}
              color={isActive ? colors.brand : colors.muted}
            />
            <Text className={`${compact ? "text-[9px]" : "text-[11px]"} font-bold ${isActive ? "text-brand" : "text-muted"}`}>
              {badge.label}{badge.key === "id" && !isActive ? " soon" : ""}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

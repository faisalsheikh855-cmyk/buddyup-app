import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Profile } from "@/features/profile/api";
import { useThemeColors } from "@/theme/tokens";

type TrustBadgesProps = {
  profile?: Pick<
    Profile,
    "email_verified" | "phone_verified" | "avatar_url" | "selfie_verified" | "verification_status"
  > | null;
  compact?: boolean;
  showPlaceholder?: boolean;
};

const badges = [
  { key: "email", label: "Email verified", icon: "mail-outline" as const },
  { key: "phone", label: "Phone verified", icon: "call-outline" as const },
  { key: "photo", label: "Profile photo", icon: "camera-outline" as const },
  { key: "selfie", label: "Selfie Verified", icon: "scan-outline" as const },
  { key: "host", label: "Trusted host", icon: "shield-checkmark-outline" as const },
];

export function TrustBadges({ profile, compact = false, showPlaceholder = true }: TrustBadgesProps) {
  const colors = useThemeColors();
  const active = {
    email: Boolean(profile?.email_verified),
    phone: Boolean(profile?.phone_verified),
    photo: Boolean(profile?.avatar_url),
    selfie: Boolean(profile?.selfie_verified),
    host: Boolean(
      profile?.verification_status === "verified"
      && profile.email_verified
      && profile.avatar_url
      && profile.selfie_verified
    ),
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
            } ${isActive ? "border-brand bg-brand-soft" : "border-line bg-surface"}`}
          >
            <Ionicons
              name={isActive ? "checkmark-circle" : badge.icon}
              size={compact ? 12 : 15}
              color={isActive ? colors.brand : colors.muted}
            />
            <Text className={`${compact ? "text-[9px]" : "text-[11px]"} font-bold ${isActive ? "text-brand" : "text-muted"}`}>
              {badge.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

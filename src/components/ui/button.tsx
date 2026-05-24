import { ActivityIndicator, Pressable, PressableProps, Text, View } from "react-native";
import { colors } from "@/theme/tokens";

type ButtonProps = PressableProps & {
  children: string;
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
  icon?: React.ReactNode;
};

const variants = {
  primary: "bg-brand",
  secondary: "bg-white border border-line",
  ghost: "bg-transparent",
};

const labels = {
  primary: "text-white",
  secondary: "text-brand",
  ghost: "text-muted",
};

export function Button({ children, variant = "primary", loading, disabled, icon, className, ...props }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      className={`h-[54px] flex-row items-center justify-center gap-2 rounded-app ${variants[variant]} ${disabled || loading ? "opacity-50" : "active:opacity-85"} ${className ?? ""}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <ActivityIndicator color={variant === "primary" ? colors.white : colors.brand} /> : (
        <View className="flex-row items-center gap-2">
          <Text className={`text-[16px] font-bold ${labels[variant]}`}>{children}</Text>
          {icon}
        </View>
      )}
    </Pressable>
  );
}

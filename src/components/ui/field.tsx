import { forwardRef, ReactNode } from "react";
import { Text, TextInput, TextInputProps, View } from "react-native";

type FieldProps = TextInputProps & {
  label: string;
  icon?: ReactNode;
  trailing?: ReactNode;
};

export const Field = forwardRef<TextInput, FieldProps>(function Field({ label, icon, trailing, ...props }, ref) {
  return (
    <View className="gap-2">
      <Text className="text-[13px] font-semibold text-ink">{label}</Text>
      <View className="h-[54px] flex-row items-center rounded-app border border-line bg-white px-4 focus:border-brand">
        {icon ? <View className="mr-3">{icon}</View> : null}
        <TextInput
          ref={ref}
          className="flex-1 text-[16px] text-ink"
          placeholderTextColor="#93A19B"
          autoCapitalize="none"
          {...props}
        />
        {trailing}
      </View>
    </View>
  );
});

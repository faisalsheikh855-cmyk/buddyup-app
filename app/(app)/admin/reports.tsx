import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { useCurrentProfile } from "@/features/profile/hooks";
import { useAdminReports, useUpdateReportStatus } from "@/features/safety/hooks";
import { useThemeColors } from "@/theme/tokens";

export default function AdminReportsScreen() {
  const colors = useThemeColors();
  const profileQuery = useCurrentProfile();
  const isAdmin = Boolean(profileQuery.data?.is_admin);
  const reportsQuery = useAdminReports(isAdmin);
  const updateMutation = useUpdateReportStatus();

  if (profileQuery.isLoading) {
    return <Screen><View className="flex-1 items-center justify-center"><ActivityIndicator color={colors.brand} /></View></Screen>;
  }

  if (!isAdmin) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="lock-closed-outline" size={36} color={colors.muted} />
          <Text className="mt-4 text-[22px] font-extrabold text-ink">Not authorized</Text>
          <View className="mt-6"><Button variant="secondary" onPress={() => router.back()}>Go back</Button></View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View className="pb-12 pt-3">
        <Pressable className="mb-6 h-11 w-11 items-center justify-center rounded-full bg-surface" onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={23} color={colors.ink} />
        </Pressable>
        <Text className="text-[12px] font-bold uppercase text-brand">Admin safety review</Text>
        <Text className="mt-2 text-[30px] font-extrabold text-ink">Member reports</Text>

        {reportsQuery.isLoading ? <ActivityIndicator className="mt-8" color={colors.brand} /> : null}
        {reportsQuery.error ? (
          <View className="mt-6 rounded-app bg-coral-soft p-4">
            <Text className="text-[13px] font-bold text-[#A4483F]">{reportsQuery.error.message}</Text>
          </View>
        ) : null}
        {!reportsQuery.isLoading && (reportsQuery.data?.length ?? 0) === 0 ? (
          <View className="mt-6 rounded-app border border-line bg-surface p-6">
            <Text className="text-center text-[16px] font-extrabold text-ink">No reports</Text>
          </View>
        ) : null}

        <View className="mt-6 gap-4">
          {reportsQuery.data?.map((report) => (
            <View key={report.id} className="rounded-app border border-line bg-surface p-4">
              <View className="flex-row items-start justify-between gap-3">
                <View className="min-w-0 flex-1">
                  <Text className="text-[16px] font-extrabold text-ink">{report.reason}</Text>
                  <Text className="mt-1 text-[11px] text-muted">
                    {report.reporter?.full_name ?? "Member"} reported {report.reported?.full_name ?? "Member"}
                  </Text>
                </View>
                <Text className="rounded-full bg-line px-3 py-1 text-[10px] font-bold text-muted">{report.status}</Text>
              </View>
              {report.details ? <Text className="mt-3 text-[13px] leading-5 text-muted">{report.details}</Text> : null}
              <Text className="mt-3 text-[10px] text-muted">{new Date(report.created_at).toLocaleString()}</Text>
              {report.status === "open" ? (
                <View className="mt-4 flex-row gap-3">
                  <Button
                    className="flex-1"
                    variant="secondary"
                    loading={updateMutation.isPending}
                    onPress={() => updateMutation.mutate(
                      { reportId: report.id, status: "dismissed" },
                      { onError: (error) => Alert.alert("Could not update report", error.message) },
                    )}
                  >
                    Dismiss
                  </Button>
                  <Button
                    className="flex-1"
                    loading={updateMutation.isPending}
                    onPress={() => updateMutation.mutate(
                      { reportId: report.id, status: "reviewed" },
                      { onError: (error) => Alert.alert("Could not update report", error.message) },
                    )}
                  >
                    Mark reviewed
                  </Button>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}

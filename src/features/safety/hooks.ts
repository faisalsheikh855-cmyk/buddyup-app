import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  blockUser,
  listAdminReports,
  listBlockedUsers,
  reportUser,
  submitSafetyCheckin,
  unblockUser,
  updateReportStatus,
} from "./api";

export const safetyKeys = {
  blocks: ["safety", "blocks"] as const,
  reports: ["admin", "safety", "reports"] as const,
};

export function useReportUser() {
  return useMutation({ mutationFn: reportUser });
}

export function useBlockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: blockUser,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: safetyKeys.blocks }),
  });
}

export function useSafetyCheckin() {
  return useMutation({ mutationFn: submitSafetyCheckin });
}

export function useBlockedUsers() {
  return useQuery({ queryKey: safetyKeys.blocks, queryFn: listBlockedUsers });
}

export function useUnblockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unblockUser,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: safetyKeys.blocks }),
  });
}

export function useAdminReports(enabled: boolean) {
  return useQuery({
    queryKey: safetyKeys.reports,
    queryFn: listAdminReports,
    enabled,
  });
}

export function useUpdateReportStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateReportStatus,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: safetyKeys.reports }),
  });
}

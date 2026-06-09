import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCurrentProfile,
  getMySelfieVerification,
  listPendingSelfieVerifications,
  reviewSelfieVerification,
  submitSelfieVerification,
  updateCurrentProfile,
  uploadAvatar,
} from "./api";

export const profileKeys = {
  current: ["profile", "current"] as const,
  selfie: ["profile", "selfie-verification"] as const,
  pendingVerifications: ["admin", "selfie-verifications", "pending"] as const,
};

export function useCurrentProfile() {
  return useQuery({ queryKey: profileKeys.current, queryFn: getCurrentProfile });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCurrentProfile,
    onSuccess: (profile) => queryClient.setQueryData(profileKeys.current, profile),
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (profile) => queryClient.setQueryData(profileKeys.current, profile),
  });
}

export function useSubmitSelfieVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitSelfieVerification,
    onSuccess: (profile) => {
      queryClient.setQueryData(profileKeys.current, profile);
      void queryClient.invalidateQueries({ queryKey: profileKeys.selfie });
    },
  });
}

export function useMySelfieVerification() {
  return useQuery({ queryKey: profileKeys.selfie, queryFn: getMySelfieVerification });
}

export function usePendingSelfieVerifications(enabled: boolean) {
  return useQuery({
    queryKey: profileKeys.pendingVerifications,
    queryFn: listPendingSelfieVerifications,
    enabled,
  });
}

export function useReviewSelfieVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reviewSelfieVerification,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: profileKeys.pendingVerifications });
    },
  });
}

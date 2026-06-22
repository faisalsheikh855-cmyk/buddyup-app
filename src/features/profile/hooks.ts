import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteProfilePhoto,
  getCurrentProfile,
  getProfileById,
  getMySelfieVerification,
  listProfilePhotos,
  listPendingSelfieVerifications,
  reviewSelfieVerification,
  submitSelfieVerification,
  updateCurrentProfile,
  uploadAvatar,
  uploadProfilePhoto,
} from "./api";
import type { PreparedImage } from "@/lib/media";

export const profileKeys = {
  current: ["profile", "current"] as const,
  selfie: ["profile", "selfie-verification"] as const,
  pendingVerifications: ["admin", "selfie-verifications", "pending"] as const,
  public: (id: string) => ["profile", id] as const,
  photos: (id: string) => ["profile", id, "photos"] as const,
};

export function useCurrentProfile() {
  return useQuery({ queryKey: profileKeys.current, queryFn: getCurrentProfile });
}

export function useProfile(id: string | undefined) {
  return useQuery({
    queryKey: profileKeys.public(id ?? ""),
    queryFn: () => getProfileById(id!),
    enabled: Boolean(id),
  });
}

export function useProfilePhotos(userId: string | undefined) {
  return useQuery({
    queryKey: profileKeys.photos(userId ?? "current"),
    queryFn: () => listProfilePhotos(userId),
  });
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
    mutationFn: (image: PreparedImage) => uploadAvatar(image),
    onSuccess: (profile) => queryClient.setQueryData(profileKeys.current, profile),
  });
}

export function useUploadProfilePhoto(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (image: PreparedImage) => uploadProfilePhoto(image),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: profileKeys.photos(userId ?? "current") });
    },
  });
}

export function useDeleteProfilePhoto(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProfilePhoto,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: profileKeys.photos(userId ?? "current") });
    },
  });
}

export function useSubmitSelfieVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (image: PreparedImage) => submitSelfieVerification(image),
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

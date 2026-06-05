import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCurrentProfile,
  submitIdentityVerification,
  updateCurrentProfile,
  uploadProfilePhotos,
} from "./api";

export const profileKeys = {
  current: ["profile", "current"] as const,
};

export function useCurrentProfile() {
  return useQuery({
    queryKey: profileKeys.current,
    queryFn: getCurrentProfile,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCurrentProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(profileKeys.current, profile);
    },
  });
}

export function useUploadProfilePhotos() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadProfilePhotos,
    onSuccess: (profile) => {
      queryClient.setQueryData(profileKeys.current, profile);
    },
  });
}

export function useSubmitIdentityVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitIdentityVerification,
    onSuccess: (profile) => {
      queryClient.setQueryData(profileKeys.current, profile);
    },
  });
}

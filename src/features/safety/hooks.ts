import { useMutation } from "@tanstack/react-query";
import { blockUser, reportUser, submitSafetyCheckin } from "./api";

export function useReportUser() {
  return useMutation({ mutationFn: reportUser });
}

export function useBlockUser() {
  return useMutation({ mutationFn: blockUser });
}

export function useSafetyCheckin() {
  return useMutation({ mutationFn: submitSafetyCheckin });
}

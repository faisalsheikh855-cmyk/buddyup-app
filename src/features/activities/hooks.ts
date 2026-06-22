import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createActivity,
  cancelActivity,
  getActivity,
  listActivities,
  listHostRequests,
  listMyRequests,
  cancelJoinRequest,
  requestToJoin,
  respondToRequest,
  updateActivity,
  type ActivityDraft,
} from "./api";

export const activityKeys = {
  all: ["activities"] as const,
  detail: (id: string) => ["activities", id] as const,
  hostRequests: ["activity-requests", "host"] as const,
  myRequests: ["activity-requests", "mine"] as const,
};

export function useActivities() {
  return useQuery({ queryKey: activityKeys.all, queryFn: listActivities });
}

export function useActivity(id: string | undefined) {
  return useQuery({
    queryKey: activityKeys.detail(id ?? ""),
    queryFn: () => getActivity(id!),
    enabled: Boolean(id),
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (draft: ActivityDraft) => createActivity(draft),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

export function useCancelActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelActivity,
    onSuccess: (activity) => {
      queryClient.setQueryData(activityKeys.detail(activity.id), activity);
      void queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

export function useUpdateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateActivity,
    onSuccess: (activity) => {
      queryClient.setQueryData(activityKeys.detail(activity.id), activity);
      void queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

export function useRequestToJoin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ activityId, message }: { activityId: string; message?: string }) => requestToJoin(activityId, message),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: activityKeys.all });
      void queryClient.invalidateQueries({ queryKey: activityKeys.detail(variables.activityId) });
    },
  });
}

export function useHostRequests() {
  return useQuery({ queryKey: activityKeys.hostRequests, queryFn: listHostRequests });
}

export function useMyRequests() {
  return useQuery({ queryKey: activityKeys.myRequests, queryFn: listMyRequests });
}

export function useCancelJoinRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelJoinRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: activityKeys.myRequests });
      void queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

export function useRespondToRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: respondToRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: activityKeys.hostRequests });
      void queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

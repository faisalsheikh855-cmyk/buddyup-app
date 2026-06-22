import { useMutation } from "@tanstack/react-query";
import {
  deleteCurrentAccount,
  requestPasswordReset,
  resendSignupConfirmation,
  signIn,
  signOut,
  signUp,
  updatePassword,
} from "./api";

export function useSignIn() {
  return useMutation({ mutationFn: signIn });
}

export function useSignUp() {
  return useMutation({ mutationFn: signUp });
}

export function useSignOut() {
  return useMutation({ mutationFn: signOut });
}

export function useRequestPasswordReset() {
  return useMutation({ mutationFn: requestPasswordReset });
}

export function useUpdatePassword() {
  return useMutation({ mutationFn: updatePassword });
}

export function useResendSignupConfirmation() {
  return useMutation({ mutationFn: resendSignupConfirmation });
}

export function useDeleteCurrentAccount() {
  return useMutation({ mutationFn: deleteCurrentAccount });
}

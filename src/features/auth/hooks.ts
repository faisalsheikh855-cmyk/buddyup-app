import { useMutation } from "@tanstack/react-query";
import { signIn, signOut, signUp } from "./api";

export function useSignIn() {
  return useMutation({ mutationFn: signIn });
}

export function useSignUp() {
  return useMutation({ mutationFn: signUp });
}

export function useSignOut() {
  return useMutation({ mutationFn: signOut });
}

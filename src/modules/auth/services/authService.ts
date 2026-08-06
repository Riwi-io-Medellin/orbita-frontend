import { env } from "../../../config/env";
import { apiFetch } from "../../../services/apiConfig";
import type { User } from "../types";

export function login() {
  window.location.href = `${env.apiUrl}/auth/login`;
}

export async function getCurrentUser(): Promise<User | null> {
  const response = await apiFetch("/auth/me");

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export async function logout() {
  await apiFetch("/auth/logout", {
    method: "POST",
  });
}
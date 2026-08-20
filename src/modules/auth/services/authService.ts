import { env } from "../../../config/env";
import { apiFetch } from "../../../services/apiConfig";
import type { User } from "../../../types/user";

export function login(continueUrl?: string | null) {
  const query = continueUrl ? `?continue=${encodeURIComponent(continueUrl)}` : "";
  window.location.href = `${env.apiUrl}/auth/login${query}`;
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

export async function passwordLogin(email: string, password: string): Promise<void> {
  const response = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    throw new Error("Correo o contraseña inválidos.");
  }
}

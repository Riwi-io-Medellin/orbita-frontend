import { env } from "../../../config/env";
import { apiFetch, parseApiError } from "../../../services/apiConfig";
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
    throw new Error(await parseApiError(response, "Correo o contraseña inválidos."));
  }
}

export async function updateMyProfile(fullName: string): Promise<void> {
  const response = await apiFetch("/auth/me", { method: "PATCH", body: JSON.stringify({ full_name: fullName }) });
  if (!response.ok) throw new Error(await parseApiError(response, "No se pudo actualizar tu nombre."));
}

export async function changeMyPassword(currentPassword: string, newPassword: string): Promise<void> {
  const response = await apiFetch("/auth/me/password", {
    method: "POST",
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
  if (!response.ok) throw new Error(await parseApiError(response, "No se pudo cambiar la contraseña."));
}

export interface AuthenticationProviders {
  moodle: boolean;
  microsoft: boolean;
  local: boolean;
}

export async function getAuthenticationProviders(): Promise<AuthenticationProviders> {
  const response = await apiFetch("/auth/providers");
  if (!response.ok) {
    throw new Error("No fue posible consultar los métodos de autenticación.");
  }
  return response.json();
}

export async function moodleLogin(username: string, password: string): Promise<void> {
  const response = await apiFetch("/auth/moodle/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response, "No fue posible iniciar sesión con Moodle."));
  }
}

export async function requestMoodlePasswordReset(
  identifier: string,
  identifierType: "username" | "email",
): Promise<string> {
  const response = await apiFetch("/auth/moodle/password-reset", {
    method: "POST",
    body: JSON.stringify({ identifier, identifier_type: identifierType }),
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response, "No fue posible solicitar el restablecimiento."));
  }
  const body = await response.json();
  return typeof body?.message === "string"
    ? body.message
    : "Si los datos coinciden con una cuenta Moodle, recibirás instrucciones para restablecer tu contraseña.";
}

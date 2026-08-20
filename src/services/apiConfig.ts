import { env } from "../config/env";

let unauthorizedHandler: (() => void) | null = null;

// Registered once by AuthProvider so a 401 anywhere (session cookie expired
// or revoked server-side) clears the cached user; ProtectedRoute/AdminRoute
// then redirect on their own once isAuthenticated flips to false.
export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
) {
  const response = await fetch(`${env.apiUrl}${endpoint}`, {
    credentials: "include",

    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },

    ...options,
  });

  // /auth/* 401s are the normal "not logged in yet" flow (e.g. the initial
  // GET /auth/me check), not a dead session — leave those to the caller.
  if (response.status === 401 && !endpoint.startsWith("/auth/")) {
    unauthorizedHandler?.();
  }

  return response;
}

// Best-effort extraction of a backend-provided error message, falling back
// to the given default when the response has no JSON body or no message.
export async function parseApiError(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body?.detail === "string") return body.detail;
    if (typeof body?.message === "string") return body.message;
  } catch {
    // no JSON body — use fallback
  }
  return fallback;
}

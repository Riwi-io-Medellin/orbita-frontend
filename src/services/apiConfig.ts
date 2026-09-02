import { env } from "../config/env";

let unauthorizedHandler: (() => void) | null = null;
let csrfToken: string | null = null;

const CSRF_EXEMPT_PATHS = new Set([
  "/auth/login",
  "/auth/moodle/login",
  "/auth/moodle/password-reset",
]);

// Registered once by AuthProvider so a 401 anywhere (session cookie expired
// or revoked server-side) clears the cached user; ProtectedRoute/AdminRoute
// then redirect on their own once isAuthenticated flips to false.
export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export function clearCsrfToken() {
  csrfToken = null;
}

function needsCsrfToken(endpoint: string, method: string) {
  return !["GET", "HEAD", "OPTIONS"].includes(method) && !CSRF_EXEMPT_PATHS.has(endpoint);
}

async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  const response = await fetch(`${env.apiUrl}/auth/csrf`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error("No fue posible validar tu sesión. Inicia sesión nuevamente.");
  }
  const body = await response.json();
  if (typeof body?.csrf_token !== "string") {
    throw new Error("No fue posible validar tu sesión. Inicia sesión nuevamente.");
  }
  csrfToken = body.csrf_token;
  return body.csrf_token;
}

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
) {
  const method = (options.method ?? "GET").toUpperCase();
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (needsCsrfToken(endpoint, method)) {
    headers.set("X-CSRF-Token", await getCsrfToken());
  }

  let response = await fetch(`${env.apiUrl}${endpoint}`, {
    credentials: "include",
    ...options,
    method,
    headers,
  });

  if (response.status === 403 && needsCsrfToken(endpoint, method)) {
    const detail = await response.clone().json().then((body) => body?.detail).catch(() => null);
    if (detail === "CSRF validation failed") {
      clearCsrfToken();
      headers.set("X-CSRF-Token", await getCsrfToken());
      response = await fetch(`${env.apiUrl}${endpoint}`, {
        credentials: "include",
        ...options,
        method,
        headers,
      });
    }
  }

  // /auth/* 401s are the normal "not logged in yet" flow (e.g. the initial
  // GET /auth/me check), not a dead session — leave those to the caller.
  if (response.status === 401 && !endpoint.startsWith("/auth/")) {
    unauthorizedHandler?.();
    clearCsrfToken();
  }
  if (endpoint === "/auth/login" || endpoint === "/auth/moodle/login" || endpoint === "/auth/logout") {
    clearCsrfToken();
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

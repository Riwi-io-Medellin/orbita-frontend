import { env } from "../config/env";

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
) {
  return fetch(`${env.apiUrl}${endpoint}`, {
    credentials: "include",

    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },

    ...options,
  });
}
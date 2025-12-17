/**
 * Helper functions for API client
 */

const TOKEN_KEY = "badminton.accessToken";

export function getBadmintonApiBaseUrl() {
  return (import.meta.env.VITE_BADMINTON_API_BASE_URL || "").replace(/\/+$/, "");
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setAccessToken(token) {
  if (!token) {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
}

export function isAuthed() {
  return Boolean(getAccessToken());
}


/**
 * Helper functions for API client
 */

import { setLoggedInUserId } from "./cookies.js";

const ACCESS_TOKEN_KEY = "badminton.accessToken";
const REFRESH_TOKEN_KEY = "badminton.refreshToken";

/** Telegram OAuth: bot_id for https://oauth.telegram.org/auth */
export const TELEGRAM_OAUTH_BOT_ID = "7685244546";

/** Логи [TG Auth] и дебаг. Выключить: VITE_BADMINTON_DEBUG=false в .env */
export const BADMINTON_DEBUG = import.meta.env.VITE_BADMINTON_DEBUG !== "false";

/** Показывать блок Mock users на странице входа. Выключить: VITE_BADMINTON_SHOW_MOCK_USERS=false */
export const SHOW_MOCK_USERS = import.meta.env.VITE_BADMINTON_SHOW_MOCK_USERS !== "false";

export function getBadmintonApiBaseUrl() {
  if (typeof window !== "undefined" && window.location?.hostname?.includes("netlify.app")) {
    return "";
  }
  let url = (import.meta.env.VITE_BADMINTON_API_BASE_URL || "").replace(/\/+$/, "");
  if (typeof window !== "undefined" && window.location?.protocol === "https:" && url.startsWith("http://")) {
    url = "https" + url.slice(4);
  }
  return url;
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || "";
}

export function setAccessToken(token) {
  if (!token) {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    return;
  }
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || "";
}

export function setRefreshToken(token) {
  if (!token) {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    return;
  }
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function setTokens(accessToken, refreshToken) {
  setAccessToken(accessToken);
  setRefreshToken(refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function isAuthed() {
  return Boolean(getAccessToken());
}

/** True if user has access or refresh token (real API) or cookie (mock). Use for "already logged in" redirect. */
export function hasAuth() {
  return Boolean(getAccessToken() || getRefreshToken());
}

const LOGIN_PATH = "/?page=badminton&section=login";
const MOCK_SESSION_KEY = "badminton.useMockSession";

let reauthRedirectHandler = null;
let reauthInProgress = false;

export function setReauthRedirectHandler(handler) {
  reauthRedirectHandler = typeof handler === "function" ? handler : null;
}

/** Clears local auth state and redirects to the badminton login page. */
export function forceReauth() {
  if (reauthInProgress) return;
  reauthInProgress = true;

  clearTokens();
  setLoggedInUserId("");
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(MOCK_SESSION_KEY);
  }

  if (typeof window === "undefined") return;

  if (reauthRedirectHandler) {
    reauthRedirectHandler();
    return;
  }

  window.location.assign(LOGIN_PATH);
}


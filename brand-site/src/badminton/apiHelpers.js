/**
 * Helper functions for API client
 */

import { setLoggedInUserId, getLoggedInUserId } from "./cookies.js";

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

/** App session: JWT/refresh or mock cookie login. */
export function hasAppSession() {
  if (hasAuth()) return true;
  const id = getLoggedInUserId();
  return Boolean(id && String(id).trim());
}

/** Login with silent Telegram OAuth attempt (used after 401 / missing app session). */
export const LOGIN_PATH_AUTO_TG = "/?page=badminton&section=login&autoTg=1";
const MOCK_SESSION_KEY = "badminton.useMockSession";
const TG_AUTO_LOGIN_TRIED_KEY = "badminton.tgAutoLoginTried";

let reauthRedirectHandler = null;
let reauthInProgress = false;

export function setReauthRedirectHandler(handler) {
  reauthRedirectHandler = typeof handler === "function" ? handler : null;
}

export function markTgAutoLoginTried() {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(TG_AUTO_LOGIN_TRIED_KEY, "1");
}

export function wasTgAutoLoginTried() {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(TG_AUTO_LOGIN_TRIED_KEY) === "1";
}

export function clearTgAutoLoginTried() {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(TG_AUTO_LOGIN_TRIED_KEY);
}

export function resetReauthGuard() {
  reauthInProgress = false;
}

export function buildTelegramOAuthUrl({ returnTo } = {}) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  let url =
    `https://oauth.telegram.org/auth?bot_id=${TELEGRAM_OAUTH_BOT_ID}` +
    `&origin=${encodeURIComponent(origin)}` +
    `&request_access=write`;
  if (returnTo) {
    url += `&return_to=${encodeURIComponent(returnTo)}`;
  }
  return url;
}

/**
 * If there is no app session, navigate to login with silent Telegram OAuth.
 * Returns true when the caller should abort (redirect started).
 */
export function redirectToLoginAutoTg(router) {
  if (hasAppSession()) return false;
  clearTgAutoLoginTried();
  const target = LOGIN_PATH_AUTO_TG;
  if (router && typeof router.replace === "function") {
    router.replace(target).catch(() => {
      if (typeof window !== "undefined") window.location.assign(target);
    });
  } else if (typeof window !== "undefined") {
    window.location.assign(target);
  }
  return true;
}

/** Clears local auth state and redirects to the badminton login page. */
export function forceReauth() {
  if (reauthInProgress) return;
  reauthInProgress = true;

  clearTokens();
  setLoggedInUserId("");
  clearTgAutoLoginTried();
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(MOCK_SESSION_KEY);
  }

  if (typeof window === "undefined") return;

  if (reauthRedirectHandler) {
    reauthRedirectHandler({ autoTg: true });
    return;
  }

  window.location.assign(LOGIN_PATH_AUTO_TG);
}

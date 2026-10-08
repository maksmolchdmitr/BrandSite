/**
 * Helper functions for API client
 */

import { setLoggedInUserId, getLoggedInUserId } from "./cookies.js";

const ACCESS_TOKEN_KEY = "badminton.accessToken";
const REFRESH_TOKEN_KEY = "badminton.refreshToken";

/** Telegram OAuth: bot_id for https://oauth.telegram.org/auth */
export const TELEGRAM_OAUTH_BOT_ID = "7685244546";

/** Yandex ID OAuth client_id (public). Override: VITE_YANDEX_OAUTH_CLIENT_ID */
export const YANDEX_OAUTH_CLIENT_ID =
  import.meta.env.VITE_YANDEX_OAUTH_CLIENT_ID || "f438411329254ba6a65baf6ff00ba62d";

/** Логи [TG Auth] и дебаг. Выключить: VITE_BADMINTON_DEBUG=false в .env */
export const BADMINTON_DEBUG = import.meta.env.VITE_BADMINTON_DEBUG !== "false";

/** Показывать блок Mock users на странице входа. Выключить: VITE_BADMINTON_SHOW_MOCK_USERS=false */
export const SHOW_MOCK_USERS = import.meta.env.VITE_BADMINTON_SHOW_MOCK_USERS !== "false";

export function getBadmintonApiBaseUrl() {
  if (typeof window !== "undefined") {
    const host = window.location?.hostname || "";
    // Netlify keeps /api proxy → same-origin.
    if (host.includes("netlify.app")) {
      return "";
    }
    // Yandex CDN static host → call API directly (CORS enabled on backend).
    if (host === "app.badminton-service.website") {
      return "https://badminton-service.website";
    }
  }
  let url = (import.meta.env.VITE_BADMINTON_API_BASE_URL || "").replace(/\/+$/, "");
  if (typeof window !== "undefined" && window.location?.protocol === "https:" && url.startsWith("http://")) {
    url = "https" + url.slice(4);
  }
  return url;
}

/** Exact redirect_uri registered in Yandex OAuth app. */
export function getYandexOAuthRedirectUri() {
  if (typeof window === "undefined") return "http://localhost:5173/";
  return `${window.location.origin}/`;
}

export function buildYandexOAuthUrl() {
  const redirectUri = getYandexOAuthRedirectUri();
  return (
    `https://oauth.yandex.ru/authorize?response_type=code` +
    `&client_id=${encodeURIComponent(YANDEX_OAUTH_CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&force_confirm=yes`
  );
}

const PENDING_ACCOUNT_LINK_KEY = "badminton.pendingAccountLink";
const TELEGRAM_LINKED_KEY = "badminton.telegramLinked";

export function markPendingAccountLink(provider) {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(PENDING_ACCOUNT_LINK_KEY, provider);
}

export function peekPendingAccountLink() {
  if (typeof sessionStorage === "undefined") return "";
  return sessionStorage.getItem(PENDING_ACCOUNT_LINK_KEY) || "";
}

export function clearPendingAccountLink() {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(PENDING_ACCOUNT_LINK_KEY);
}

/** Remember if current session user has Telegram linked (for logout → close TG session). */
export function setTelegramLinked(linked) {
  if (typeof sessionStorage === "undefined") return;
  if (linked) {
    sessionStorage.setItem(TELEGRAM_LINKED_KEY, "1");
  } else {
    sessionStorage.removeItem(TELEGRAM_LINKED_KEY);
  }
}

export function isTelegramLinked() {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(TELEGRAM_LINKED_KEY) === "1";
}

export function rememberTelegramLinkedFromUser(user) {
  if (!user || typeof user !== "object") return;
  if ("telegramLinked" in user) {
    setTelegramLinked(Boolean(user.telegramLinked));
  } else if (user.telegramId != null || user.tgId != null) {
    setTelegramLinked(true);
  }
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

/** Login page (no silent Telegram redirect — oauth.telegram.org is often blocked in RU). */
export const LOGIN_PATH = "/?page=badminton&section=login";
/** @deprecated kept for old invite links; autoTg is ignored and stripped on login. */
export const LOGIN_PATH_AUTO_TG = LOGIN_PATH;
const MOCK_SESSION_KEY = "badminton.useMockSession";
const TG_AUTO_LOGIN_TRIED_KEY = "badminton.tgAutoLoginTried";
/** localStorage: survives new tabs until the user explicitly logs in again. */
const SKIP_TG_AUTO_LOGIN_KEY = "badminton.skipTgAutoLogin";
/** sessionStorage: only accept Telegram auth while an OAuth attempt we started is in flight. */
const EXPECT_TG_AUTH_KEY = "badminton.expectTgAuth";

let reauthRedirectHandler = null;
let reauthInProgress = false;

export function setReauthRedirectHandler(handler) {
  reauthRedirectHandler = typeof handler === "function" ? handler : null;
}

/** After intentional logout — do not silently bounce via Telegram OAuth. */
export function markSkipTgAutoLogin() {
  clearExpectTgAuth();
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(SKIP_TG_AUTO_LOGIN_KEY, "1");
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(SKIP_TG_AUTO_LOGIN_KEY);
  }
}

export function shouldSkipTgAutoLogin() {
  if (typeof localStorage !== "undefined" && localStorage.getItem(SKIP_TG_AUTO_LOGIN_KEY) === "1") {
    return true;
  }
  if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(SKIP_TG_AUTO_LOGIN_KEY) === "1") {
    return true;
  }
  return false;
}

export function clearSkipTgAutoLogin() {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(SKIP_TG_AUTO_LOGIN_KEY);
  }
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(SKIP_TG_AUTO_LOGIN_KEY);
  }
}

/** Mark that we opened / redirected to Telegram OAuth and may accept the result. */
export function markExpectTgAuth() {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(EXPECT_TG_AUTH_KEY, "1");
}

export function shouldExpectTgAuth() {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(EXPECT_TG_AUTH_KEY) === "1";
}

export function clearExpectTgAuth() {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(EXPECT_TG_AUTH_KEY);
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

export function buildTelegramOAuthLogoutUrl() {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return (
    `https://oauth.telegram.org/auth/logout?bot_id=${TELEGRAM_OAUTH_BOT_ID}` +
    `&origin=${encodeURIComponent(origin)}`
  );
}

/** Official Telegram "service notifications" chat (phone 42777) — Terminate session lives here. */
export const TELEGRAM_SERVICE_NOTIFICATIONS_URL = "https://t.me/+42777";

/**
 * Open the official Telegram service notifications chat in a new tab so the user
 * can press "Terminate session" for this site's OAuth login.
 */
export function openTelegramServiceNotificationsChat() {
  if (typeof window === "undefined") return;
  clearExpectTgAuth();
  window.open(TELEGRAM_SERVICE_NOTIFICATIONS_URL, "_blank", "noopener,noreferrer");
}

/** Clears local badminton auth (JWT, mock cookie, mock session flag). */
export function clearLocalAuthState() {
  clearTokens();
  setLoggedInUserId("");
  setTelegramLinked(false);
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(MOCK_SESSION_KEY);
  }
}

/**
 * If there is no app session, navigate to login.
 * Returns true when the caller should abort (redirect started).
 */
export function redirectToLoginAutoTg(router) {
  if (hasAppSession()) return false;
  clearTgAutoLoginTried();
  if (router && typeof router.replace === "function") {
    router.replace(LOGIN_PATH).catch(() => {
      if (typeof window !== "undefined") window.location.assign(LOGIN_PATH);
    });
  } else if (typeof window !== "undefined") {
    window.location.assign(LOGIN_PATH);
  }
  return true;
}

/** Clears local auth state and redirects to the badminton login page. */
export function forceReauth() {
  if (reauthInProgress) return;
  reauthInProgress = true;

  clearLocalAuthState();
  clearTgAutoLoginTried();

  if (typeof window === "undefined") return;

  if (reauthRedirectHandler) {
    reauthRedirectHandler({ autoTg: false });
    return;
  }

  window.location.assign(LOGIN_PATH);
}

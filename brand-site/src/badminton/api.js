/**
 * Real API client for Badminton Service.
 * Auth flow: Telegram OAuth (oauth.telegram.org) → telegramLogin → Bearer access token.
 * On 401 we try refreshToken once and retry.
 */

import {
  getBadmintonApiBaseUrl,
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  BADMINTON_DEBUG,
} from "./apiHelpers.js";
import { setLoggedInUserId } from "./cookies.js";

const BASE_URL = getBadmintonApiBaseUrl();

async function apiRequest(path, options = {}, skipRefresh = false) {
  const { method = "GET", body, headers = {} } = options;

  const url = `${BASE_URL}${path}`;
  const requestHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };

  const token = getAccessToken();
  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const config = {
    method,
    headers: requestHeaders,
  };

  if (body !== undefined && body !== null) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(url, config);

  // 401: try refresh once and retry (except for auth endpoints)
  if (response.status === 401 && !skipRefresh && getRefreshToken()) {
    try {
      const refreshed = await doRefreshToken();
      if (refreshed) {
        return apiRequest(path, options, true);
      }
    } catch (_) {
      clearTokens();
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    const error = new Error(errorData.message || `HTTP ${response.status}`);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function doRefreshToken() {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  const result = await fetch(`${BASE_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: refresh }),
  });
  if (!result.ok) return false;
  const data = await result.json();
  if (data.accessToken && data.refreshToken) {
    setTokens(data.accessToken, data.refreshToken);
    return true;
  }
  return false;
}

// Auth: один шаг — отправляем данные от Telegram в telegramLogin
export async function telegramLogin(telegramUser) {
  if (BADMINTON_DEBUG) console.log("[TG Auth] api.telegramLogin → POST", BASE_URL + "/api/auth/telegram/login", { id: telegramUser?.id, first_name: telegramUser?.first_name });
  const result = await apiRequest("/api/auth/telegram/login", {
    method: "POST",
    body: telegramUser,
    headers: { Authorization: undefined },
  }, true);
  if (result.accessToken && result.refreshToken) {
    setTokens(result.accessToken, result.refreshToken);
  }
  return result;
}

export async function refreshToken() {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error("No refresh token");
  const result = await apiRequest("/api/auth/refresh", {
    method: "POST",
    body: { refreshToken: refresh },
    headers: { Authorization: undefined },
  }, true);
  if (result.accessToken && result.refreshToken) {
    setTokens(result.accessToken, result.refreshToken);
  }
  return result;
}

export async function logout() {
  try {
    await apiRequest("/api/auth/logout", { method: "POST" });
  } catch (_) {
    // Игнорируем ошибку сети/ответа — всегда чистим локальное состояние
  } finally {
    clearTokens();
    setLoggedInUserId("");
  }
}

// User endpoints
export async function getMe() {
  return apiRequest("/api/me");
}

export async function getMyGroups({ limit, pageToken } = {}) {
  const params = new URLSearchParams();
  if (limit) params.append("limit", limit);
  if (pageToken) params.append("pageToken", pageToken);
  const query = params.toString();
  return apiRequest(`/api/groups${query ? `?${query}` : ""}`);
}

export async function getMyRatings({limit, pageToken} = {}) {
  const params = new URLSearchParams();
  if (limit) params.append("limit", limit);
  if (pageToken) params.append("pageToken", pageToken);
  const query = params.toString();
  return apiRequest(`/api/me/ratings${query ? `?${query}` : ""}`);
}

export async function getMyGamesStats() {
  return apiRequest("/api/me/games-stats");
}

export async function getMySinglesMatches({ groupId, limit, pageToken } = {}) {
  const params = new URLSearchParams();
  if (groupId) params.append("groupId", groupId);
  if (limit) params.append("limit", limit);
  if (pageToken) params.append("pageToken", pageToken);
  const query = params.toString();
  return apiRequest(`/api/me/matches/singles${query ? `?${query}` : ""}`);
}

export async function getMyDoublesMatches({ groupId, limit, pageToken } = {}) {
  const params = new URLSearchParams();
  if (groupId) params.append("groupId", groupId);
  if (limit) params.append("limit", limit);
  if (pageToken) params.append("pageToken", pageToken);
  const query = params.toString();
  return apiRequest(`/api/me/matches/doubles${query ? `?${query}` : ""}`);
}

// Group endpoints
export async function createGroup({name}) {
  return apiRequest("/api/groups", {
    method: "POST",
    body: {name},
  });
}

export async function getGroup(groupId) {
  return apiRequest(`/api/groups/${encodeURIComponent(groupId)}`);
}

// Participant endpoints
/** Max page size per OpenAPI spec for GET /api/groups/{groupId}/participants */
export const PARTICIPANTS_LIST_MAX_LIMIT = 200;

export async function listParticipants(groupId, { limit, pageToken } = {}) {
  const params = new URLSearchParams();
  if (limit) params.append("limit", limit);
  if (pageToken) params.append("pageToken", pageToken);
  const query = params.toString();
  return apiRequest(`/api/groups/${encodeURIComponent(groupId)}/participants${query ? `?${query}` : ""}`);
}

/** Fetches all participants, paginating with the API max page size. */
export async function listAllParticipants(groupId) {
  const items = [];
  let pageToken;
  do {
    const page = await listParticipants(groupId, {
      limit: PARTICIPANTS_LIST_MAX_LIMIT,
      pageToken,
    });
    items.push(...(page?.items || []));
    pageToken = page?.pageToken || null;
  } while (pageToken);
  return { items };
}

export async function searchParticipants(groupId, { query = "", limit = 10, pageToken } = {}) {
  const params = new URLSearchParams();
  if (query) params.append("query", query);
  params.append("limit", limit);
  if (pageToken) params.append("pageToken", pageToken);
  return apiRequest(`/api/groups/${encodeURIComponent(groupId)}/participants/search?${params.toString()}`);
}

export async function createParticipant(groupId, {name}) {
  return apiRequest(`/api/groups/${encodeURIComponent(groupId)}/participants`, {
    method: "POST",
    body: {name},
  });
}

export async function updateParticipant(groupId, participantId, {name}) {
  return apiRequest(`/api/groups/${encodeURIComponent(groupId)}/participants/${encodeURIComponent(participantId)}`, {
    method: "PATCH",
    body: {name},
  });
}

export async function deleteParticipant(groupId, participantId) {
  return apiRequest(`/api/groups/${encodeURIComponent(groupId)}/participants/${encodeURIComponent(participantId)}`, {
    method: "DELETE",
  });
}

export async function linkUserToParticipant(groupId, participantId, {userId}) {
  return apiRequest(`/api/groups/${encodeURIComponent(groupId)}/participants/${encodeURIComponent(participantId)}/link-user`, {
    method: "POST",
    body: {userId},
  });
}

// Match endpoints — список матчей в группе: GET /api/me/matches/singles|doubles?groupId=...
/** Body may include `kind` for routing; it is not sent (path implies singles vs doubles). */
export async function createMatch(groupId, match) {
  const { kind, ...rest } = match;
  const segment = kind === "doubles" ? "doubles" : "singles";
  return apiRequest(`/api/groups/${encodeURIComponent(groupId)}/matches/${segment}`, {
    method: "POST",
    body: rest,
  });
}

export async function updateMatch(groupId, matchId, patch) {
  return apiRequest(`/api/groups/${encodeURIComponent(groupId)}/matches/${encodeURIComponent(matchId)}`, {
    method: "PATCH",
    body: patch,
  });
}

export async function deleteMatch(groupId, matchId) {
  return apiRequest(`/api/groups/${encodeURIComponent(groupId)}/matches/${encodeURIComponent(matchId)}`, {
    method: "DELETE",
  });
}

// Rating endpoints
export async function getSinglesLeaderboard(groupId, { limit, pageToken } = {}) {
  const params = new URLSearchParams();
  if (limit) params.append("limit", limit);
  if (pageToken) params.append("pageToken", pageToken);
  const query = params.toString();
  return apiRequest(`/api/groups/${encodeURIComponent(groupId)}/ratings/singles${query ? `?${query}` : ""}`);
}

export async function getDoublesLeaderboard(groupId, { limit, pageToken } = {}) {
  const params = new URLSearchParams();
  if (limit) params.append("limit", limit);
  if (pageToken) params.append("pageToken", pageToken);
  const query = params.toString();
  return apiRequest(`/api/groups/${encodeURIComponent(groupId)}/ratings/doubles${query ? `?${query}` : ""}`);
}


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

export async function getMyStats({groupId} = {}) {
  const query = groupId ? `?groupId=${encodeURIComponent(groupId)}` : "";
  return apiRequest(`/api/me/stats${query}`);
}

export async function getMyRatings({groupId} = {}) {
  const query = groupId ? `?groupId=${encodeURIComponent(groupId)}` : "";
  return apiRequest(`/api/me/ratings${query}`);
}

export async function getMyGamesStats({groupId} = {}) {
  const query = groupId ? `?groupId=${encodeURIComponent(groupId)}` : "";
  return apiRequest(`/api/me/games-stats${query}`);
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
export async function listParticipants(groupId) {
  return apiRequest(`/api/groups/${encodeURIComponent(groupId)}/participants`);
}

export async function searchParticipants(groupId, {query = "", page = 0, pageSize = 10} = {}) {
  const params = new URLSearchParams();
  if (query) params.append("query", query);
  params.append("page", page);
  params.append("pageSize", pageSize);
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

// Match endpoints
export async function listMatches(groupId, { from, to, limit, pageToken } = {}) {
  const params = new URLSearchParams();
  if (from) params.append("from", from);
  if (to) params.append("to", to);
  if (limit) params.append("limit", limit);
  if (pageToken) params.append("pageToken", pageToken);
  const query = params.toString();
  return apiRequest(`/api/groups/${encodeURIComponent(groupId)}/matches${query ? `?${query}` : ""}`);
}

export async function createMatch(groupId, match) {
  return apiRequest(`/api/groups/${encodeURIComponent(groupId)}/matches`, {
    method: "POST",
    body: match,
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
export async function getSinglesLeaderboard(groupId) {
  return apiRequest(`/api/groups/${encodeURIComponent(groupId)}/ratings/singles`);
}

export async function getDoublesLeaderboard(groupId) {
  return apiRequest(`/api/groups/${encodeURIComponent(groupId)}/ratings/doubles`);
}

export async function getGroupStats(groupId) {
  return apiRequest(`/api/groups/${encodeURIComponent(groupId)}/stats`);
}

/**
 * Real API client for Badminton Service.
 * Auth flow: Telegram OAuth (oauth.telegram.org) → telegramLogin → Bearer access token.
 * On 401 we try refreshToken once and retry; if still unauthorized, force re-login.
 * Transient network / 502–504: up to 5 attempts (create/update included) so flaky links
 * do not wipe form data after a single failed fetch.
 */

import {
  getBadmintonApiBaseUrl,
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  forceReauth,
  clearLocalAuthState,
  markSkipTgAutoLogin,
  clearTgAutoLoginTried,
  BADMINTON_DEBUG,
} from "./apiHelpers.js";
import { orderMatchTeamsForApi } from "./uuidOrder.js";

const BASE_URL = getBadmintonApiBaseUrl();

/** Transient upstream errors (e.g. Netlify proxy while badminton-service has no ready pods during deploy). */
const RETRYABLE_STATUSES = new Set([502, 503, 504]);
/**
 * Backoff between attempts. Length 4 → 5 tries total (initial + 4 retries).
 * Covers short blips and brief deploy downtime on 1-replica.
 */
const TRANSIENT_RETRY_DELAYS_MS = [1000, 2000, 4000, 8000];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function canRetryTransient(attempt) {
  return attempt < TRANSIENT_RETRY_DELAYS_MS.length;
}

async function apiRequest(path, options = {}, skipRefresh = false, attempt = 0) {
  const { method = "GET", body, headers = {} } = options;

  const url = `${BASE_URL}${path}`;
  const requestHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };

  const skipBearer = path === "/api/auth/telegram/login" || path === "/api/auth/refresh";
  const token = getAccessToken();
  if (token && !skipBearer) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const config = {
    method,
    headers: requestHeaders,
  };

  if (body !== undefined && body !== null) {
    config.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, config);
  } catch (networkError) {
    if (canRetryTransient(attempt)) {
      await sleep(TRANSIENT_RETRY_DELAYS_MS[attempt]);
      return apiRequest(path, options, skipRefresh, attempt + 1);
    }
    throw networkError;
  }

  // 401: try refresh once and retry
  if (response.status === 401 && !skipRefresh && getRefreshToken()) {
    try {
      const refreshed = await doRefreshToken();
      if (refreshed) {
        return apiRequest(path, options, true, 0);
      }
    } catch (_) {
      clearTokens();
    }
  }

  if (response.status === 401 && !path.startsWith("/api/auth/")) {
    forceReauth();
  }

  if (RETRYABLE_STATUSES.has(response.status) && canRetryTransient(attempt)) {
    await sleep(TRANSIENT_RETRY_DELAYS_MS[attempt]);
    return apiRequest(path, options, skipRefresh, attempt + 1);
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

  const responseText = await response.text();
  if (!responseText) {
    return null;
  }
  return JSON.parse(responseText);
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
  }, true);
  if (result.accessToken && result.refreshToken) {
    setTokens(result.accessToken, result.refreshToken);
  }
  return result;
}

export async function logout() {
  markSkipTgAutoLogin();
  const accessToken = getAccessToken();
  clearLocalAuthState();
  clearTgAutoLoginTried();

  if (!accessToken) return;
  try {
    await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (_) {
  }
}

// User endpoints
export async function getMe() {
  return apiRequest("/api/me");
}

export async function updateMe({firstName, lastName, photoUrl, photoCrop} = {}) {
  const body = {};
  if (firstName != null) body.firstName = firstName;
  if (lastName != null) body.lastName = lastName;
  if (photoUrl !== undefined) body.photoUrl = photoUrl;
  if (photoCrop !== undefined) body.photoCrop = photoCrop;
  return apiRequest("/api/me", {
    method: "PATCH",
    body,
  });
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

export async function listMySinglesRatingHistory({ startTime, endTime } = {}) {
  const params = new URLSearchParams();
  if (startTime) params.append("startTime", startTime);
  if (endTime) params.append("endTime", endTime);
  const query = params.toString();
  return apiRequest(`/api/me/ratings/singles/history${query ? `?${query}` : ""}`);
}

export async function listMyDoublesRatingHistory({ startTime, endTime } = {}) {
  const params = new URLSearchParams();
  if (startTime) params.append("startTime", startTime);
  if (endTime) params.append("endTime", endTime);
  const query = params.toString();
  return apiRequest(`/api/me/ratings/doubles/history${query ? `?${query}` : ""}`);
}

export async function getMySinglesMatchBounds() {
  return apiRequest("/api/me/matches/singles/bounds");
}

export async function getMyDoublesMatchBounds() {
  return apiRequest("/api/me/matches/doubles/bounds");
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

export async function listGroupSinglesMatches(groupId, { limit, pageToken } = {}) {
  const params = new URLSearchParams();
  if (limit) params.append("limit", limit);
  if (pageToken) params.append("pageToken", pageToken);
  const query = params.toString();
  return apiRequest(
    `/api/groups/${encodeURIComponent(groupId)}/matches/singles${query ? `?${query}` : ""}`
  );
}

export async function listGroupDoublesMatches(groupId, { limit, pageToken } = {}) {
  const params = new URLSearchParams();
  if (limit) params.append("limit", limit);
  if (pageToken) params.append("pageToken", pageToken);
  const query = params.toString();
  return apiRequest(
    `/api/groups/${encodeURIComponent(groupId)}/matches/doubles${query ? `?${query}` : ""}`
  );
}

// Group endpoints
export async function createGroup({name}) {
  return apiRequest("/api/groups", {
    method: "POST",
    body: {name},
  });
}

export async function transferGroupOwnership(groupId, {userId}) {
  return apiRequest(`/api/groups/${encodeURIComponent(groupId)}/transfer-ownership`, {
    method: "POST",
    body: {userId},
  });
}

export async function getGroup(groupId) {
  return apiRequest(`/api/groups/${encodeURIComponent(groupId)}`);
}

export async function listMyNotifications({ unread = true, limit, pageToken } = {}) {
  const params = new URLSearchParams();
  params.append("unread", String(unread));
  if (limit) params.append("limit", String(limit));
  if (pageToken) params.append("pageToken", pageToken);
  const query = params.toString();
  return apiRequest(`/api/me/notifications?${query}`);
}

export async function markNotificationRead(notificationId) {
  return apiRequest(`/api/me/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: "POST",
  });
}

export async function listLinkUserInviteMatches(notificationId, { kind, limit, pageToken } = {}) {
  const params = new URLSearchParams();
  params.append("kind", kind);
  if (limit) params.append("limit", String(limit));
  if (pageToken) params.append("pageToken", pageToken);
  return apiRequest(
    `/api/me/notifications/${encodeURIComponent(notificationId)}/link-user-matches?${params.toString()}`
  );
}

export async function respondToInvitation(invitationId, decision) {
  return apiRequest(`/api/invitations/${encodeURIComponent(invitationId)}/respond`, {
    method: "POST",
    body: { decision },
  });
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

export async function searchUsers({ query = "", registeredOnly = false, limit = 10, pageToken } = {}) {
  const params = new URLSearchParams();
  if (query) params.append("query", query);
  if (registeredOnly) params.append("registeredOnly", "true");
  params.append("limit", limit);
  if (pageToken) params.append("pageToken", pageToken);
  return apiRequest(`/api/users/search?${params.toString()}`);
}

export async function createParticipant(groupId, {name}) {
  return apiRequest(`/api/groups/${encodeURIComponent(groupId)}/participants`, {
    method: "POST",
    body: {name},
  });
}

export async function createUnlinkedParticipant(groupId, {username, firstName, lastName, photoUrl, photoCrop}) {
  const body = {username, firstName, lastName};
  if (photoUrl) body.photoUrl = photoUrl;
  if (photoCrop) body.photoCrop = photoCrop;
  return apiRequest(`/api/groups/${encodeURIComponent(groupId)}/participants/unlinked`, {
    method: "POST",
    body,
  });
}

export async function updateParticipant(groupId, participantId, {firstName, lastName, photoUrl, photoCrop}) {
  const body = {};
  if (firstName != null) body.firstName = firstName;
  if (lastName != null) body.lastName = lastName;
  if (photoUrl !== undefined) body.photoUrl = photoUrl;
  if (photoCrop !== undefined) body.photoCrop = photoCrop;
  return apiRequest(`/api/groups/${encodeURIComponent(groupId)}/participants/${encodeURIComponent(participantId)}`, {
    method: "PATCH",
    body,
  });
}

export async function updateParticipantRole(groupId, participantId, {role}) {
  return apiRequest(
    `/api/groups/${encodeURIComponent(groupId)}/participants/${encodeURIComponent(participantId)}/role`,
    {
      method: "PATCH",
      body: {role},
    }
  );
}

export async function createPhotoUploadUrl(groupId, {contentType, contentLength}) {
  const body = {contentType};
  if (contentLength != null) body.contentLength = contentLength;
  return apiRequest(`/api/groups/${encodeURIComponent(groupId)}/photo-upload-url`, {
    method: "POST",
    body,
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

// Match endpoints — список матчей в группе: GET /api/groups/{groupId}/matches/singles|doubles
/** Body may include `kind` for routing; it is not sent (path implies singles vs doubles). */
export async function createMatch(groupId, match) {
  const { kind, ...rest } = orderMatchTeamsForApi(match);
  const segment = kind === "doubles" ? "doubles" : "singles";
  return apiRequest(`/api/groups/${encodeURIComponent(groupId)}/matches/${segment}`, {
    method: "POST",
    body: rest,
  });
}

export async function updateMatch(groupId, matchId, patch, kind) {
  const segment = kind === "doubles" ? "doubles" : "singles";
  return apiRequest(
    `/api/groups/${encodeURIComponent(groupId)}/matches/${segment}/${encodeURIComponent(matchId)}`,
    {
      method: "PATCH",
      body: orderMatchTeamsForApi(patch),
    }
  );
}

export async function deleteMatch(groupId, matchId, kind) {
  const segment = kind === "doubles" ? "doubles" : "singles";
  return apiRequest(
    `/api/groups/${encodeURIComponent(groupId)}/matches/${segment}/${encodeURIComponent(matchId)}`,
    {
      method: "DELETE",
    }
  );
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


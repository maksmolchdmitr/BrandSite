/**
 * Real API client for Badminton Service.
 * 
 * This file provides a wrapper around the generated OpenAPI client.
 * The generated client is created from badminton-service.openapi.yaml
 * using: npm run generate-api-client
 * 
 * For now, this is a manual implementation matching the OpenAPI spec.
 * When the backend is ready, uncomment the generated client import below.
 */

import {getBadmintonApiBaseUrl, getAccessToken, setAccessToken} from "./apiHelpers.js";

const BASE_URL = getBadmintonApiBaseUrl();

async function apiRequest(path, options = {}) {
  const {method = "GET", body, headers = {}} = options;
  
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
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({message: response.statusText}));
    const error = new Error(errorData.message || `HTTP ${response.status}`);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// Auth endpoints
export async function authTelegramStart({redirectUrl}) {
  return apiRequest("/api/auth/telegram/start", {
    method: "POST",
    body: {redirectUrl},
    headers: {Authorization: undefined}, // No auth for this endpoint
  });
}

export async function authTelegramComplete({state, telegram}) {
  const result = await apiRequest("/api/auth/telegram/complete", {
    method: "POST",
    body: {state, telegram},
    headers: {Authorization: undefined}, // No auth for this endpoint
  });
  
  if (result.accessToken) {
    setAccessToken(result.accessToken);
  }
  
  return result;
}

export async function logout() {
  await apiRequest("/api/auth/logout", {method: "POST"});
  setAccessToken(null);
}

// User endpoints
export async function getMe() {
  return apiRequest("/api/me");
}

export async function getMyGroups({limit, cursor} = {}) {
  const params = new URLSearchParams();
  if (limit) params.append("limit", limit);
  if (cursor) params.append("cursor", cursor);
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
export async function listMatches(groupId, {from, to, limit, cursor} = {}) {
  const params = new URLSearchParams();
  if (from) params.append("from", from);
  if (to) params.append("to", to);
  if (limit) params.append("limit", limit);
  if (cursor) params.append("cursor", cursor);
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

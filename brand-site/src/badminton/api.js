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

export async function apiFetch(path, { method = "GET", body, headers = {}, auth = true } = {}) {
  const baseUrl = getBadmintonApiBaseUrl();
  if (!baseUrl) {
    throw new Error("Missing VITE_BADMINTON_API_BASE_URL");
  }

  const finalHeaders = { ...headers };
  if (auth) {
    const token = getAccessToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  let finalBody = body;
  if (body !== undefined && body !== null && !(body instanceof FormData) && typeof body !== "string") {
    finalHeaders["Content-Type"] = finalHeaders["Content-Type"] || "application/json";
    finalBody = JSON.stringify(body);
  }

  const res = await fetch(`${baseUrl}${path}`, { method, headers: finalHeaders, body: finalBody });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : await res.text().catch(() => "");

  if (!res.ok) {
    const msg =
      (payload && payload.message) ||
      (typeof payload === "string" && payload) ||
      `Request failed: ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }

  return payload;
}

// Auth
export function authTelegramStart({ redirectUrl }) {
  return apiFetch("/auth/telegram/start", { method: "POST", auth: false, body: { redirectUrl } });
}

export function authTelegramComplete({ state, telegram }) {
  return apiFetch("/auth/telegram/complete", { method: "POST", auth: false, body: { state, telegram } });
}

export function logout() {
  return apiFetch("/auth/logout", { method: "POST" });
}

// Me
export function getMe() {
  return apiFetch("/me");
}

export function getMyGroups() {
  return apiFetch("/groups");
}

export function getMyStats({ groupId } = {}) {
  const qs = groupId ? `?groupId=${encodeURIComponent(groupId)}` : "";
  return apiFetch(`/me/stats${qs}`);
}

export function getMyRatings({ groupId } = {}) {
  const qs = groupId ? `?groupId=${encodeURIComponent(groupId)}` : "";
  return apiFetch(`/me/ratings${qs}`);
}

// Groups
export function createGroup({ name }) {
  return apiFetch("/groups", { method: "POST", body: { name } });
}

export function getGroup(groupId) {
  return apiFetch(`/groups/${encodeURIComponent(groupId)}`);
}

// Participants
export function listParticipants(groupId) {
  return apiFetch(`/groups/${encodeURIComponent(groupId)}/participants`);
}

export function createParticipant(groupId, { name }) {
  return apiFetch(`/groups/${encodeURIComponent(groupId)}/participants`, { method: "POST", body: { name } });
}

export function updateParticipant(groupId, participantId, { name }) {
  return apiFetch(`/groups/${encodeURIComponent(groupId)}/participants/${encodeURIComponent(participantId)}`, {
    method: "PATCH",
    body: { name },
  });
}

export function deleteParticipant(groupId, participantId) {
  return apiFetch(`/groups/${encodeURIComponent(groupId)}/participants/${encodeURIComponent(participantId)}`, {
    method: "DELETE",
  });
}

export function linkUserToParticipant(groupId, participantId, { userId }) {
  return apiFetch(
    `/groups/${encodeURIComponent(groupId)}/participants/${encodeURIComponent(participantId)}/link-user`,
    { method: "POST", body: { userId } },
  );
}

// Matches
export function listMatches(groupId) {
  return apiFetch(`/groups/${encodeURIComponent(groupId)}/matches`);
}

export function createMatch(groupId, match) {
  return apiFetch(`/groups/${encodeURIComponent(groupId)}/matches`, { method: "POST", body: match });
}

export function updateMatch(groupId, matchId, patch) {
  return apiFetch(`/groups/${encodeURIComponent(groupId)}/matches/${encodeURIComponent(matchId)}`, {
    method: "PATCH",
    body: patch,
  });
}

export function deleteMatch(groupId, matchId) {
  return apiFetch(`/groups/${encodeURIComponent(groupId)}/matches/${encodeURIComponent(matchId)}`, {
    method: "DELETE",
  });
}

// Ratings
export function getSinglesLeaderboard(groupId) {
  return apiFetch(`/groups/${encodeURIComponent(groupId)}/ratings/singles`);
}

export function getDoublesLeaderboard(groupId) {
  return apiFetch(`/groups/${encodeURIComponent(groupId)}/ratings/doubles`);
}

export function getGroupStats(groupId) {
  return apiFetch(`/groups/${encodeURIComponent(groupId)}/stats`);
}



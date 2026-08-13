import {getLoggedInUserId, setLoggedInUserId} from "@/badminton/cookies.js";
import {ensureMembership, getCurrentUser, getMyRole, loadDb, nowIso, saveDb, uuid} from "@/badminton/mockDb.js";
import {
  cachedSearchParticipants,
  invalidateParticipantSearchCache,
} from "@/badminton/participantSearchCache.js";
import {
  DOUBLES_RATING_HISTORY_SAFETY_CAP,
  SINGLES_RATING_HISTORY_SAFETY_CAP,
} from "@/badminton/ratingHistory.js";
import {clearTgAutoLoginTried, clearLocalAuthState, clearTelegramOAuthSession, markSkipTgAutoLogin} from "@/badminton/apiHelpers.js";

function delay(ms = 180) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function logRequest(method, endpoint, params = {}) {
  console.log(`[API Request] ${method} ${endpoint}`, params);
}

function logResponse(method, endpoint, data, status = 200) {
  // Красивый лог ответа мок-бека — как будто это реальный HTTP JSON-ответ.
  const pretty = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  console.log(`[API Response] ${status} ${method} ${endpoint}\n${pretty}`);
}

function requireAuth(db) {
  const u = getCurrentUser(db);
  if (!u) throw new Error("Unauthorized: please login");
  return u;
}

function requireMember(db, groupId) {
  const role = getMyRole(db, groupId);
  if (!role) throw new Error("Forbidden: not a group member");
  return role;
}

function requireAdmin(db, groupId) {
  const role = requireMember(db, groupId);
  if (role !== "admin") throw new Error("Forbidden: admin only");
  return role;
}

function participantNameMap(db, groupId) {
  const map = new Map();
  db.participants.filter(p => p.groupId === groupId).forEach(p => map.set(p.id, p.name));
  return map;
}

async function mockSearchParticipantsUncached(groupId, { query = "", limit = 10, pageToken = null } = {}) {
  logRequest("GET", `/api/groups/${groupId}/participants/search`, { query, limit, pageToken });
  await delay();
  const db = loadDb();
  const userId = getLoggedInUserId() || "u_alex";
  const u = db.users.find(x => x.id === userId) || db.users[0];
  if (u) {
    const exists = db.memberships.some(m => m.groupId === groupId && m.userId === u.id);
    if (!exists) {
      db.memberships.push({groupId, userId: u.id, role: "member"});
      saveDb(db);
    }
  }

  let all = db.participants
    .filter(p => p.groupId === groupId)
    .sort((a, b) => a.name.localeCompare(b.name));

  if (query && query.trim()) {
    const lower = query.trim().toLowerCase();
    all = all.filter((p) => {
      const linkedUser = p.userId ? db.users.find((x) => x.id === p.userId) : null;
      const username = String(linkedUser?.username || p.username || "").toLowerCase();
      const firstName = String(linkedUser?.firstName || "").toLowerCase();
      const lastName = String(linkedUser?.lastName || "").toLowerCase();
      const fullName = [firstName, lastName].filter(Boolean).join(" ")
        || String(p.name || "").toLowerCase();
      return (
        username.startsWith(lower) ||
        firstName.startsWith(lower) ||
        lastName.startsWith(lower) ||
        fullName.startsWith(lower)
      );
    });
  }

  const start = pageToken && pageToken.startsWith("offset_")
    ? parseInt(pageToken.slice("offset_".length), 10) || 0
    : 0;
  const pageItems = all.slice(start, start + limit).map(p => participantToClientDto(p, db));
  const nextToken = start + limit < all.length ? `offset_${start + limit}` : null;
  const result = { items: pageItems, pageToken: nextToken };
  logResponse("GET", `/api/groups/${groupId}/participants/search`, result);
  return result;
}

function participantToClientDto(p, db) {
  if (!p) return p;
  const linkedUser = p.userId && db ? db.users.find(u => u.id === p.userId) : null;
  const firstName = linkedUser?.firstName || p.firstName || undefined;
  const lastName = linkedUser?.lastName || p.lastName || undefined;
  const displayName = p.name
    || [firstName, lastName].filter(Boolean).join(" ")
    || linkedUser?.username
    || p.username
    || undefined;
  const user = linkedUser || (db ? db.users.find(u => u.id === p.id) : null);
  const groupId = user?.groupId || p.groupId || undefined;
  return {
    id: p.id,
    name: displayName,
    firstName,
    lastName,
    username: linkedUser?.username || p.username || undefined,
    userId: p.userId,
    groupId: groupId || null,
    photoUrl: linkedUser?.photoUrl || p.photoUrl || undefined,
    photoCrop: linkedUser?.photoCrop || p.photoCrop || undefined,
  };
}

function groupToClientDto(g, myRole) {
  return { id: g.id, name: g.name, myRole };
}

function matchToClientDto(m) {
  if (!m) return m;
  return {
    id: m.id,
    kind: m.kind,
    createdAt: m.createdAt,
    teamA: m.teamA,
    teamB: m.teamB,
    score: m.score,
  };
}

function didTeamWin(match, side /* 'A'|'B' */) {
  const games = match.score?.games || [];
  let wA = 0;
  let wB = 0;
  for (const g of games) {
    if (g.pointsA > g.pointsB) wA++;
    else if (g.pointsB > g.pointsA) wB++;
  }
  if (wA === wB) return null;
  return side === "A" ? wA > wB : wB > wA;
}

function calcSinglesElo(db, userId) {
  // Mock: simple Elo-like rating based on wins/losses across all groups where participant is linked to user.
  const pIds = db.participants.filter(p => p.userId === userId).map(p => p.id);
  const matches = db.matches.filter(m => m.kind === "singles" && (pIds.includes(m.teamA?.[0]) || pIds.includes(m.teamB?.[0])));
  let wins = 0;
  let losses = 0;
  for (const m of matches) {
    const isA = pIds.includes(m.teamA?.[0]);
    const win = didTeamWin(m, isA ? "A" : "B");
    if (win === true) wins++;
    else if (win === false) losses++;
  }
  // Base at 1200 and adjust with a small K-factor to roughly reflect performance.
  const K = 8;
  return Math.round(1200 + K * (wins - losses));
}

function calcSinglesRatingHistory(db, userId, { startTime, endTime } = {}) {
  const pIds = new Set(db.participants.filter(p => p.userId === userId).map(p => p.id));
  const startMs = startTime ? new Date(startTime).getTime() : Number.NEGATIVE_INFINITY;
  const endMs = endTime ? new Date(endTime).getTime() : Number.POSITIVE_INFINITY;
  const chronological = (db.matches || [])
    .filter(m => m.kind === "singles" && (pIds.has(m.teamA?.[0]) || pIds.has(m.teamB?.[0])))
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0));

  const K = 8;
  let wins = 0;
  let losses = 0;
  const items = [];
  for (const match of chronological) {
    const isA = pIds.has(match.teamA?.[0]);
    const win = didTeamWin(match, isA ? "A" : "B");
    if (win === true) wins++;
    else if (win === false) losses++;
    const elo = Math.round(1200 + K * (wins - losses));
    const createdMs = new Date(match.createdAt).getTime();
    if (Number.isNaN(createdMs) || createdMs < startMs || createdMs >= endMs) {
      continue;
    }
    items.push({
      matchId: match.id,
      elo,
      createdAt: match.createdAt,
    });
  }
  if (items.length > SINGLES_RATING_HISTORY_SAFETY_CAP) {
    return { items: items.slice(-SINGLES_RATING_HISTORY_SAFETY_CAP) };
  }
  return { items };
}

function calcDoublesRatingHistory(db, userId, { startTime, endTime } = {}) {
  const myParticipants = db.participants.filter(p => p.userId === userId);
  const myPIds = new Set(myParticipants.map(p => p.id));
  const startMs = startTime ? new Date(startTime).getTime() : Number.NEGATIVE_INFINITY;
  const endMs = endTime ? new Date(endTime).getTime() : Number.POSITIVE_INFINITY;
  const chronological = (db.matches || [])
    .filter(m => m.kind === "doubles")
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0));

  const K = 8;
  const eloByPartner = new Map();
  const items = [];
  for (const match of chronological) {
    const a = match.teamA || [];
    const b = match.teamB || [];
    const myInA = a.some(id => myPIds.has(id));
    const myInB = b.some(id => myPIds.has(id));
    if (!myInA && !myInB) continue;

    const myTeam = myInA ? a : b;
    const partnerPid = myTeam.find(id => !myPIds.has(id));
    if (!partnerPid) continue;
    const partner = db.participants.find(p => p.id === partnerPid);
    const partnerUser = partner?.userId ? db.users.find(u => u.id === partner.userId) : null;
    const partnerUserId = partner?.userId || `unlinked:${partnerPid}`;
    const partnerName = partner?.name || partnerPid;
    const partnerUsername = partnerUser?.username || partner?.username || "";
    const partnerPhotoUrl = partnerUser?.photoUrl || partner?.photoUrl || undefined;
    const partnerPhotoCrop = partnerUser?.photoCrop || partner?.photoCrop || undefined;
    const teamId = [userId, partnerUserId].sort().join(":");

    const win = didTeamWin(match, myInA ? "A" : "B");
    const cur = eloByPartner.get(partnerUserId) || { wins: 0, losses: 0 };
    if (win === true) cur.wins += 1;
    else if (win === false) cur.losses += 1;
    eloByPartner.set(partnerUserId, cur);
    const elo = Math.round(1100 + K * (cur.wins - cur.losses));

    const createdMs = new Date(match.createdAt).getTime();
    if (Number.isNaN(createdMs) || createdMs < startMs || createdMs >= endMs) {
      continue;
    }
    items.push({
      matchId: match.id,
      teamId,
      partnerUserId,
      partnerName,
      partnerUsername,
      partnerPhotoUrl,
      partnerPhotoCrop,
      elo,
      createdAt: match.createdAt,
    });
  }
  if (items.length > DOUBLES_RATING_HISTORY_SAFETY_CAP) {
    return { items: items.slice(-DOUBLES_RATING_HISTORY_SAFETY_CAP) };
  }
  return { items };
}

function calcDoublesPerPartner(db, userId) {
  // Build partner Elo map: simple Elo-like value per partner (across all groups), based on wins and losses together with that partner.
  const myParticipants = db.participants.filter(p => p.userId === userId);
  const myPIds = new Set(myParticipants.map(p => p.id));

  const map = new Map(); // partnerUserId -> {partnerName, elo, games, wins, losses}
  for (const m of db.matches.filter(x => x.kind === "doubles")) {
    const a = m.teamA || [];
    const b = m.teamB || [];
    const myInA = a.some(id => myPIds.has(id));
    const myInB = b.some(id => myPIds.has(id));
    if (!myInA && !myInB) continue;

    const mySide = myInA ? "A" : "B";
    const myTeam = myInA ? a : b;
    const partnerPid = myTeam.find(id => !myPIds.has(id));
    if (!partnerPid) continue;
    const partner = db.participants.find(p => p.id === partnerPid);
    const partnerUser = partner?.userId ? db.users.find(u => u.id === partner.userId) : null;
    const partnerUserId = partner?.userId || `unlinked:${partnerPid}`;
    const partnerName = partner?.name || partnerPid;
    const partnerUsername = partnerUser?.username || partner?.username || "";
    const partnerPhotoUrl = partnerUser?.photoUrl || partner?.photoUrl || "";

    const win = didTeamWin(m, mySide);
    const cur = map.get(partnerUserId) || {
      partnerUserId,
      partnerName,
      partnerUsername,
      partnerPhotoUrl,
      elo: 1100,
      games: 0,
      wins: 0,
      losses: 0,
    };
    cur.games += 1;
    if (win === true) cur.wins += 1;
    if (win === false) cur.losses += 1;
    map.set(partnerUserId, cur);
  }

  const K = 10;
  const rows = Array.from(map.values()).map(r => ({
    partnerUserId: r.partnerUserId,
    partnerName: r.partnerName,
    partnerUsername: r.partnerUsername || undefined,
    partnerPhotoUrl: r.partnerPhotoUrl || undefined,
    games: r.games,
    wins: r.wins,
    losses: r.losses,
    elo: Math.round(1100 + K * (r.wins - r.losses)),
  }));

  rows.sort((a, b) => b.elo - a.elo);
  return rows;
}

function calcTotals(matches, myParticipantIds) {
  let played = 0, won = 0, lost = 0;
  for (const m of matches) {
    const myInA = (m.teamA || []).some(id => myParticipantIds.has(id));
    const myInB = (m.teamB || []).some(id => myParticipantIds.has(id));
    if (!myInA && !myInB) continue;
    played++;
    const win = didTeamWin(m, myInA ? "A" : "B");
    if (win === true) won++;
    else if (win === false) lost++;
  }
  const winRate = played ? won / played : 0;
  return {matchesPlayed: played, matchesWon: won, matchesLost: lost, winRate};
}

export const mockClient = {
  async telegramLogin(telegram) {
    logRequest("POST", "/api/auth/telegram/login", { telegram: "..." });
    await delay(150);
    const db = loadDb();
    const telegramId = String(telegram.id);
    let user = db.users.find(u => String(u.telegramId) === telegramId);
    if (!user) {
      const username = telegram.username || `tg_${telegram.id}`;
      user = {
        id: uuid("u"),
        telegramId: parseInt(telegram.id, 10),
        username,
        firstName: telegram.first_name || "",
        lastName: telegram.last_name || "",
        photoUrl: telegram.photo_url || "",
        createdAt: nowIso(),
      };
      db.users.push(user);
      saveDb(db);
    }
    setLoggedInUserId(user.id);
    return {
      accessToken: `mock_token_${user.id}_${Date.now()}`,
      refreshToken: `mock_refresh_${user.id}_${Date.now()}`,
    };
  },

  async listMockUsers() {
    logRequest("GET", "/auth/mock-users");
    await delay();
    const db = loadDb();
    return db.users;
  },

  async loginAsUser(userId) {
    logRequest("POST", "/auth/login", {userId});
    await delay(120);
    const db = loadDb();
    const u = db.users.find(x => x.id === userId);
    if (!u) throw new Error("Unknown user");
    setLoggedInUserId(u.id);
    return u;
  },

  async logout() {
    logRequest("POST", "/api/auth/logout");
    await delay(80);
    clearLocalAuthState();
    markSkipTgAutoLogin();
    clearTgAutoLoginTried();
    clearTelegramOAuthSession();
  },

  async getMe() {
    logRequest("GET", "/api/me");
    await delay();
    const db = loadDb();
    // Use default user if not logged in
    const userId = getLoggedInUserId() || "u_alex";
    const user = db.users.find(u => u.id === userId);

    const toUserDto = (u) => {
      if (!u) return null;
      let firstName = u.firstName;
      let lastName = u.lastName;
      if ((!firstName || !lastName) && u.displayName) {
        const parts = String(u.displayName).split(" ");
        firstName = firstName || parts[0] || "";
        lastName = lastName || parts.slice(1).join(" ") || "";
      }
      return {
        id: u.id,
        username: u.username,
        firstName: firstName || "",
        lastName: lastName || "",
        photoUrl: u.photoUrl || undefined,
        photoCrop: u.photoCrop || undefined,
      };
    };

    let raw = user;
    if (!raw) {
      // Fallback to first user or synthetic default
      raw =
        db.users[0] || {
          id: "u_alex",
          username: "alex_shuttle",
          firstName: "Alex",
          lastName: "Chen",
        };
    }

    const result = toUserDto(raw);
    logResponse("GET", "/api/me", result);
    return result;
  },

  async updateMe({firstName, lastName, photoUrl, photoCrop} = {}) {
    logRequest("PATCH", "/api/me", {firstName, lastName, photoUrl, photoCrop});
    await delay();
    const db = loadDb();
    const userId = getLoggedInUserId() || "u_alex";
    const user = db.users.find(u => u.id === userId) || db.users[0];
    if (!user) throw new Error("Not found");
    if (firstName == null && lastName == null && photoUrl === undefined && photoCrop === undefined) {
      throw new Error("firstName, lastName, photoUrl or photoCrop is required");
    }
    if (firstName != null) user.firstName = firstName;
    if (lastName != null) user.lastName = lastName;
    if (photoUrl !== undefined) user.photoUrl = photoUrl || undefined;
    if (photoCrop !== undefined) user.photoCrop = photoCrop || undefined;
    saveDb(db);
    const result = await this.getMe();
    logResponse("PATCH", "/api/me", result);
    return result;
  },

  async getMyGroups({ limit = 50, pageToken = null } = {}) {
    logRequest("GET", "/api/groups", { limit, pageToken });
    await delay();
    const db = loadDb();
    // Use default user if not logged in
    const userId = getLoggedInUserId() || "u_alex";
    const u = db.users.find(x => x.id === userId) || db.users[0];
    if (!u) {
      const empty = { items: [], pageToken: null };
      logResponse("GET", "/api/groups", empty);
      return empty;
    }
    const groupIds = db.memberships.filter(m => m.userId === u.id).map(m => m.groupId);
    const all = db.groups
      .filter(g => groupIds.includes(g.id))
      .map(g => ({...g, myRole: db.memberships.find(m => m.userId === u.id && m.groupId === g.id)?.role || "member"}));

    const start = pageToken && pageToken.startsWith("offset_")
      ? parseInt(pageToken.slice("offset_".length), 10) || 0
      : 0;
    const pageItems = all.slice(start, start + limit).map((g) => groupToClientDto(g, g.myRole));
    const nextToken = start + limit < all.length ? `offset_${start + limit}` : null;
    const result = { items: pageItems, pageToken: nextToken };
    logResponse("GET", "/api/groups", result);
    return result;
  },

  async createGroup({name}) {
    logRequest("POST", "/api/groups", {name});
    await delay();
    const db = loadDb();
    const u = requireAuth(db);
    const g = {id: uuid("g"), name, createdAt: nowIso(), createdByUserId: u.id};
    db.groups.unshift(g);
    db.memberships.push({groupId: g.id, userId: u.id, role: "admin"});
    saveDb(db);
    const result = groupToClientDto(g, "admin");
    logResponse("POST", "/api/groups", result, 201);
    return result;
  },

  async getGroup(groupId) {
    logRequest("GET", `/api/groups/${groupId}`);
    await delay();
    const db = loadDb();
    // Use default user if not logged in
    const userId = getLoggedInUserId() || "u_alex";
    const u = db.users.find(x => x.id === userId) || db.users[0];
    if (!u) {
      throw new Error("User not found");
    }
    const g = db.groups.find(x => x.id === groupId);
    if (!g) throw new Error("Not found");
    const role = db.memberships.find(m => m.groupId === groupId && m.userId === u.id)?.role;
    // If user is not a member, still allow access but with no role (or make them a member)
    let result;
    if (!role) {
      // Auto-add as member for default user
      db.memberships.push({groupId, userId: u.id, role: "member"});
      saveDb(db);
      result = groupToClientDto(g, "member");
    } else {
      result = groupToClientDto(g, role);
    }
    logResponse("GET", `/api/groups/${groupId}`, result);
    return result;
  },

  async listParticipants(groupId, { limit = 50, pageToken = null } = {}) {
    logRequest("GET", `/api/groups/${groupId}/participants`, { limit, pageToken });
    await delay();
    const db = loadDb();
    // Use default user if not logged in
    const userId = getLoggedInUserId() || "u_alex";
    const u = db.users.find(x => x.id === userId) || db.users[0];
    if (!u) {
      const all = db.participants.filter(p => p.groupId === groupId);
      const start = pageToken && pageToken.startsWith("offset_")
        ? parseInt(pageToken.slice("offset_".length), 10) || 0
        : 0;
      const pageItems = all.slice(start, start + limit).map(p => participantToClientDto(p, db));
      const nextToken = start + limit < all.length ? `offset_${start + limit}` : null;
      const res = { items: pageItems, pageToken: nextToken };
      logResponse("GET", `/api/groups/${groupId}/participants`, res);
      return res;
    }
    // Ensure membership
    const exists = db.memberships.some(m => m.groupId === groupId && m.userId === u.id);
    if (!exists) {
      db.memberships.push({groupId, userId: u.id, role: "member"});
      saveDb(db);
    }
    const all = db.participants.filter(p => p.groupId === groupId);
    const start = pageToken && pageToken.startsWith("offset_")
      ? parseInt(pageToken.slice("offset_".length), 10) || 0
      : 0;
    const pageItems = all.slice(start, start + limit).map(p => participantToClientDto(p, db));
    const nextToken = start + limit < all.length ? `offset_${start + limit}` : null;
    const result = { items: pageItems, pageToken: nextToken };
    logResponse("GET", `/api/groups/${groupId}/participants`, result);
    return result;
  },

  async listAllParticipants(groupId) {
    const items = [];
    let pageToken;
    do {
      const page = await this.listParticipants(groupId, { limit: 200, pageToken });
      items.push(...(page?.items || []));
      pageToken = page?.pageToken || null;
    } while (pageToken);
    return { items };
  },

  async searchParticipants(groupId, { query = "", limit = 10, pageToken = null } = {}) {
    return cachedSearchParticipants(
      (gid, opts) => mockSearchParticipantsUncached(gid, opts),
      groupId,
      { query, limit, pageToken }
    );
  },

  async searchUsers({ query = "", limit = 10, pageToken = null } = {}) {
    logRequest("GET", "/api/users/search", { query, limit, pageToken });
    await delay();
    const db = loadDb();
    requireAuth(db);
    const lower = String(query || "").trim().toLowerCase();
    let all = db.users
      .slice()
      .sort((a, b) => String(a.username || "").localeCompare(String(b.username || "")));
    if (lower) {
      all = all.filter(u => {
        const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ").toLowerCase();
        return (
          String(u.username || "").toLowerCase().startsWith(lower) ||
          String(u.firstName || "").toLowerCase().startsWith(lower) ||
          String(u.lastName || "").toLowerCase().startsWith(lower) ||
          fullName.startsWith(lower)
        );
      });
    }
    const start = pageToken && pageToken.startsWith("offset_")
      ? parseInt(pageToken.slice("offset_".length), 10) || 0
      : 0;
    const pageItems = all.slice(start, start + limit).map(u => ({
      id: u.id,
      username: u.username,
      firstName: u.firstName || "",
      lastName: u.lastName || "",
      photoUrl: u.photoUrl || undefined,
    }));
    const nextToken = start + limit < all.length ? `offset_${start + limit}` : null;
    const result = { items: pageItems, pageToken: nextToken };
    logResponse("GET", "/api/users/search", result);
    return result;
  },

  async createParticipant(groupId, {name}) {
    logRequest("POST", `/api/groups/${groupId}/participants`, {name});
    await delay();
    const db = loadDb();
    requireAuth(db);
    requireAdmin(db, groupId);
    const p = {id: uuid("p"), groupId, name, userId: null, createdAt: nowIso()};
    db.participants.unshift(p);
    saveDb(db);
    invalidateParticipantSearchCache(groupId);
    logResponse("POST", `/api/groups/${groupId}/participants`, participantToClientDto(p, db), 201);
    return participantToClientDto(p, db);
  },

  async createUnlinkedParticipant(groupId, {username, firstName, lastName, photoUrl, photoCrop}) {
    logRequest("POST", `/api/groups/${groupId}/participants/unlinked`, {username, firstName, lastName, photoUrl, photoCrop});
    await delay();
    const db = loadDb();
    requireAuth(db);
    requireAdmin(db, groupId);
    const login = String(username || "").trim();
    if (!login) throw new Error("username is required");
    const userId = uuid("u");
    const displayName = [firstName, lastName].map(s => String(s || "").trim()).filter(Boolean).join(" ") || login;
    const avatar = photoUrl ? String(photoUrl) : undefined;
    db.users.push({
      id: userId,
      username: login,
      firstName: String(firstName || "").trim(),
      lastName: String(lastName || "").trim(),
      tgId: null,
      groupId,
      photoUrl: avatar,
      photoCrop: photoCrop || undefined,
    });
    const p = {
      id: userId,
      groupId,
      name: displayName,
      userId,
      photoUrl: avatar,
      photoCrop: photoCrop || undefined,
      createdAt: nowIso(),
    };
    db.participants.unshift(p);
    saveDb(db);
    invalidateParticipantSearchCache(groupId);
    const dto = participantToClientDto(p, db);
    logResponse("POST", `/api/groups/${groupId}/participants/unlinked`, dto, 201);
    return dto;
  },

  async updateParticipant(groupId, participantId, {firstName, lastName, photoUrl, photoCrop}) {
    logRequest("PATCH", `/api/groups/${groupId}/participants/${participantId}`, {firstName, lastName, photoUrl, photoCrop});
    await delay();
    const db = loadDb();
    requireAuth(db);
    requireAdmin(db, groupId);
    const idx = db.participants.findIndex(p => p.id === participantId && p.groupId === groupId);
    if (idx < 0) throw new Error("Not found");
    if (firstName == null && lastName == null && photoUrl === undefined && photoCrop === undefined) {
      throw new Error("firstName, lastName, photoUrl or photoCrop is required");
    }
    const next = {...db.participants[idx]};
    const user = db.users.find(u => u.id === next.userId || u.id === participantId);
    if (!user?.groupId && !next.groupId) {
      throw new Error("Forbidden: only unlinked participants can be updated");
    }
    if (firstName != null) {
      next.firstName = firstName;
      if (user) user.firstName = firstName;
    }
    if (lastName != null) {
      next.lastName = lastName;
      if (user) user.lastName = lastName;
    }
    const resolvedFirst = next.firstName || user?.firstName || "";
    const resolvedLast = next.lastName || user?.lastName || "";
    next.name = [resolvedFirst, resolvedLast].filter(Boolean).join(" ") || next.name;
    if (photoUrl !== undefined) {
      next.photoUrl = photoUrl || undefined;
      if (user) user.photoUrl = photoUrl || undefined;
    }
    if (photoCrop !== undefined) {
      next.photoCrop = photoCrop || undefined;
      if (user) user.photoCrop = photoCrop || undefined;
    }
    db.participants[idx] = next;
    saveDb(db);
    invalidateParticipantSearchCache(groupId);
    const dto = participantToClientDto(db.participants[idx], db);
    logResponse("PATCH", `/api/groups/${groupId}/participants/${participantId}`, dto);
    return dto;
  },

  async createPhotoUploadUrl(groupId, {contentType, contentLength}) {
    logRequest("POST", `/api/groups/${groupId}/photo-upload-url`, {contentType, contentLength});
    await delay();
    const db = loadDb();
    requireAuth(db);
    requireAdmin(db, groupId);
    const objectKey = `participants/${groupId}/mock-${Date.now()}.jpg`;
    const publicUrl = `https://picsum.photos/seed/${encodeURIComponent(objectKey)}/200`;
    const response = {
      uploadUrl: publicUrl,
      publicUrl,
      objectKey,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    };
    logResponse("POST", `/api/groups/${groupId}/photo-upload-url`, response, 200);
    return response;
  },

  async uploadParticipantPhoto(groupId, file) {
    const {assertParticipantPhotoFile} = await import("./photoUpload.js");
    assertParticipantPhotoFile(file);
    // Mock: skip Object Storage PUT; local object URL for preview.
    return URL.createObjectURL(file);
  },

  async deleteParticipant(groupId, participantId) {
    logRequest("DELETE", `/api/groups/${groupId}/participants/${participantId}`);
    await delay();
    const db = loadDb();
    requireAuth(db);
    requireAdmin(db, groupId);
    db.participants = db.participants.filter(p => !(p.groupId === groupId && p.id === participantId));
    // Also remove from matches
    db.matches = db.matches.filter(m => !((m.groupId === groupId) && ((m.teamA || []).includes(participantId) || (m.teamB || []).includes(participantId))));
    saveDb(db);
    invalidateParticipantSearchCache(groupId);
    logResponse("DELETE", `/api/groups/${groupId}/participants/${participantId}`, null, 204);
  },

  async linkUserToParticipant(groupId, participantId, {userId}) {
    logRequest("POST", `/api/groups/${groupId}/participants/${participantId}/link-user`, {userId});
    await delay();
    const db = loadDb();
    requireAuth(db);
    requireAdmin(db, groupId);
    const u = db.users.find(x => x.id === userId);
    if (!u) throw new Error("User not found");
    const idx = db.participants.findIndex(p => p.id === participantId && p.groupId === groupId);
    if (idx < 0) throw new Error("Participant not found");
    db.participants[idx] = {...db.participants[idx], userId: u.id};
    // ensure membership for linked user (so linked user can see group after "login")
    const exists = db.memberships.some(m => m.groupId === groupId && m.userId === u.id);
    if (!exists) db.memberships.push({groupId, userId: u.id, role: "member"});
    saveDb(db);
    invalidateParticipantSearchCache(groupId);
    const dto = participantToClientDto(db.participants[idx], db);
    logResponse("POST", `/api/groups/${groupId}/participants/${participantId}/link-user`, dto);
    return dto;
  },

  async createMatch(groupId, match) {
    const { kind, ...rest } = match;
    const segment = kind === "doubles" ? "doubles" : "singles";
    logRequest("POST", `/api/groups/${groupId}/matches/${segment}`, rest);
    await delay();
    const db = loadDb();
    const u = requireAuth(db);
    requireAdmin(db, groupId);
    const games = (rest.score && rest.score.games) || (match.score && match.score.games) || [];
    const matchKind = kind || (segment === "doubles" ? "doubles" : "singles");
    const teamA = rest.teamA || match.teamA || [];
    const teamB = rest.teamB || match.teamB || [];
    const createdAt = nowIso();
    for (const game of games) {
      const m = {
        id: uuid("m"),
        groupId,
        kind: matchKind,
        createdAt,
        teamA,
        teamB,
        score: { games: [game] },
        notes: rest.notes || match.notes || "",
        createdByUserId: u.id,
      };
      db.matches.unshift(m);
    }
    saveDb(db);
    logResponse("POST", `/api/groups/${groupId}/matches/${segment}`, null, 201);
    return null;
  },

  async updateMatch(groupId, matchId, patch, kind) {
    const segment = kind === "doubles" ? "doubles" : "singles";
    logRequest("PATCH", `/api/groups/${groupId}/matches/${segment}/${matchId}`, patch);
    await delay();
    const db = loadDb();
    requireAuth(db);
    requireAdmin(db, groupId);
    const idx = db.matches.findIndex(
      m => m.id === matchId && m.groupId === groupId && m.kind === (kind === "doubles" ? "doubles" : "singles")
    );
    if (idx < 0) throw new Error("Not found");
    db.matches[idx] = {...db.matches[idx], ...patch};
    saveDb(db);
    const dto = matchToClientDto(db.matches[idx]);
    logResponse("PATCH", `/api/groups/${groupId}/matches/${segment}/${matchId}`, dto);
    return dto;
  },

  async deleteMatch(groupId, matchId, kind) {
    const segment = kind === "doubles" ? "doubles" : "singles";
    logRequest("DELETE", `/api/groups/${groupId}/matches/${segment}/${matchId}`);
    await delay();
    const db = loadDb();
    requireAuth(db);
    requireAdmin(db, groupId);
    const expectedKind = kind === "doubles" ? "doubles" : "singles";
    const before = db.matches.length;
    db.matches = db.matches.filter(
      m => !(m.groupId === groupId && m.id === matchId && m.kind === expectedKind)
    );
    if (db.matches.length === before) throw new Error("Not found");
    saveDb(db);
    logResponse("DELETE", `/api/groups/${groupId}/matches/${segment}/${matchId}`, null, 204);
  },

  async getMyRatings({ limit = 50, pageToken = null } = {}) {
    logRequest("GET", "/api/me/ratings", { limit, pageToken });
    await delay();
    const db = loadDb();
    // Use default user if not logged in
    const userId = getLoggedInUserId() || "u_alex";
    const u = db.users.find(x => x.id === userId) || db.users[0];
    let result;
    if (!u) {
      result = { singlesElo: 1200, doublesByPartner: [], doublesByPartnerPageToken: null };
    } else {
      const singlesElo = calcSinglesElo(db, u.id);
      const allDoublesByPartner = calcDoublesPerPartner(db, u.id);
      const start = pageToken && pageToken.startsWith("offset_")
        ? parseInt(pageToken.slice("offset_".length), 10) || 0
        : 0;
      const pageItems = allDoublesByPartner.slice(start, start + limit);
      const nextToken = start + limit < allDoublesByPartner.length ? `offset_${start + limit}` : null;
      result = {
        singlesElo,
        doublesByPartner: pageItems,
        doublesByPartnerPageToken: nextToken,
      };
    }
    logResponse("GET", "/api/me/ratings", result);
    return result;
  },

  async listMySinglesRatingHistory({ startTime, endTime } = {}) {
    logRequest("GET", "/api/me/ratings/singles/history", { startTime, endTime });
    await delay();
    const db = loadDb();
    const userId = getLoggedInUserId() || "u_alex";
    const u = db.users.find(x => x.id === userId) || db.users[0];
    const result = u
      ? calcSinglesRatingHistory(db, u.id, { startTime, endTime })
      : { items: [] };
    logResponse("GET", "/api/me/ratings/singles/history", result);
    return result;
  },

  async listMyDoublesRatingHistory({ startTime, endTime } = {}) {
    logRequest("GET", "/api/me/ratings/doubles/history", { startTime, endTime });
    await delay();
    const db = loadDb();
    const userId = getLoggedInUserId() || "u_alex";
    const u = db.users.find(x => x.id === userId) || db.users[0];
    const result = u
      ? calcDoublesRatingHistory(db, u.id, { startTime, endTime })
      : { items: [] };
    logResponse("GET", "/api/me/ratings/doubles/history", result);
    return result;
  },

  async getMyGamesStats() {
    logRequest("GET", "/api/me/games-stats");
    await delay();
    const db = loadDb();
    // Use default user if not logged in
    const userId = getLoggedInUserId() || "u_alex";
    const u = db.users.find(x => x.id === userId) || db.users[0];
    let result;
    if (!u) {
      result = {
        singles: { matchesPlayed: 0, matchesWon: 0, matchesLost: 0, winRate: 0 },
        doubles: { matchesPlayed: 0, matchesWon: 0, matchesLost: 0, winRate: 0 },
      };
    } else {
      const myPIds = new Set(db.participants.filter(p => p.userId === u.id).map(p => p.id));
      const singlesMatches = db.matches.filter(m => m.kind === "singles");
      const doublesMatches = db.matches.filter(m => m.kind === "doubles");
      const singles = calcTotals(singlesMatches, myPIds);
      const doubles = calcTotals(doublesMatches, myPIds);
      result = { singles, doubles };
    }
    logResponse("GET", "/api/me/games-stats", result);
    return result;
  },

  async getMySinglesMatches({ groupId = null, limit = 20, pageToken = null } = {}) {
    logRequest("GET", "/api/me/matches/singles", { groupId, limit, pageToken });
    await delay();
    const db = loadDb();
    const userId = getLoggedInUserId() || "u_alex";
    const u = db.users.find(x => x.id === userId) || db.users[0];
    const myPIds = new Set((db.participants || []).filter(p => p.userId === u?.id).map(p => p.id));
    const all = (db.matches || [])
      .filter(m => {
        if (m.kind !== "singles") return false;
        if (groupId != null && m.groupId !== groupId) return false;
        return (m.teamA || []).some(id => myPIds.has(id)) || (m.teamB || []).some(id => myPIds.has(id));
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const start = pageToken && pageToken.startsWith("offset_") ? parseInt(pageToken.slice("offset_".length), 10) || 0 : 0;
    const pageItems = all.slice(start, start + limit).map(matchToClientDto);
    const nextToken = start + limit < all.length ? `offset_${start + limit}` : null;
    const result = { items: pageItems, pageToken: nextToken };
    logResponse("GET", "/api/me/matches/singles", result);
    return result;
  },

  async getMyDoublesMatches({ groupId = null, limit = 20, pageToken = null } = {}) {
    logRequest("GET", "/api/me/matches/doubles", { groupId, limit, pageToken });
    await delay();
    const db = loadDb();
    const userId = getLoggedInUserId() || "u_alex";
    const u = db.users.find(x => x.id === userId) || db.users[0];
    const myPIds = new Set((db.participants || []).filter(p => p.userId === u?.id).map(p => p.id));
    const all = (db.matches || [])
      .filter(m => {
        if (m.kind !== "doubles") return false;
        if (groupId != null && m.groupId !== groupId) return false;
        return (m.teamA || []).some(id => myPIds.has(id)) || (m.teamB || []).some(id => myPIds.has(id));
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const start = pageToken && pageToken.startsWith("offset_") ? parseInt(pageToken.slice("offset_".length), 10) || 0 : 0;
    const pageItems = all.slice(start, start + limit).map(matchToClientDto);
    const nextToken = start + limit < all.length ? `offset_${start + limit}` : null;
    const result = { items: pageItems, pageToken: nextToken };
    logResponse("GET", "/api/me/matches/doubles", result);
    return result;
  },

  async listGroupSinglesMatches(groupId, { limit = 20, pageToken = null } = {}) {
    logRequest("GET", `/api/groups/${groupId}/matches/singles`, { limit, pageToken });
    await delay();
    requireMember(loadDb(), groupId);
    const db = loadDb();
    const all = (db.matches || [])
      .filter(m => m.kind === "singles" && m.groupId === groupId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const start = pageToken && pageToken.startsWith("offset_") ? parseInt(pageToken.slice("offset_".length), 10) || 0 : 0;
    const pageItems = all.slice(start, start + limit).map(matchToClientDto);
    const nextToken = start + limit < all.length ? `offset_${start + limit}` : null;
    const result = { items: pageItems, pageToken: nextToken };
    logResponse("GET", `/api/groups/${groupId}/matches/singles`, result);
    return result;
  },

  async listGroupDoublesMatches(groupId, { limit = 20, pageToken = null } = {}) {
    logRequest("GET", `/api/groups/${groupId}/matches/doubles`, { limit, pageToken });
    await delay();
    requireMember(loadDb(), groupId);
    const db = loadDb();
    const all = (db.matches || [])
      .filter(m => m.kind === "doubles" && m.groupId === groupId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const start = pageToken && pageToken.startsWith("offset_") ? parseInt(pageToken.slice("offset_".length), 10) || 0 : 0;
    const pageItems = all.slice(start, start + limit).map(matchToClientDto);
    const nextToken = start + limit < all.length ? `offset_${start + limit}` : null;
    const result = { items: pageItems, pageToken: nextToken };
    logResponse("GET", `/api/groups/${groupId}/matches/doubles`, result);
    return result;
  },

  async getSinglesLeaderboard(groupId, { limit = 50, pageToken = null } = {}) {
    logRequest("GET", `/api/groups/${groupId}/ratings/singles`, { limit, pageToken });
    await delay();
    const db = loadDb();
    // Use default user if not logged in
    const userId = getLoggedInUserId() || "u_alex";
    const u = db.users.find(x => x.id === userId) || db.users[0];
    if (u) {
      const exists = db.memberships.some(m => m.groupId === groupId && m.userId === u.id);
      if (!exists) {
        db.memberships.push({groupId, userId: u.id, role: "member"});
        saveDb(db);
      }
    }
    const ids = db.participants.filter(p => p.groupId === groupId).map(p => p.id);
    const rows = ids.map(pid => {
      const singles = db.matches.filter(m => m.groupId === groupId && m.kind === "singles" && (m.teamA?.[0] === pid || m.teamB?.[0] === pid));
      let w = 0, l = 0;
      for (const m of singles) {
        const isA = m.teamA?.[0] === pid;
        const win = didTeamWin(m, isA ? "A" : "B");
        if (win === true) w++;
        if (win === false) l++;
      }
      const p = db.participants.find(p => p.id === pid);
      return { participantId: pid, participantName: p?.name || pid, elo: Math.round(1200 + w * 7 - l * 5) };
    });
    rows.sort((a, b) => b.elo - a.elo);
    const start = pageToken && pageToken.startsWith("offset_")
      ? parseInt(pageToken.slice("offset_".length), 10) || 0
      : 0;
    const pageItems = rows.slice(start, start + limit).map((r, i) => ({ ...r, rank: start + i + 1 }));
    const nextToken = start + limit < rows.length ? `offset_${start + limit}` : null;
    const result = { items: pageItems, pageToken: nextToken };
    logResponse("GET", `/api/groups/${groupId}/ratings/singles`, result);
    return result;
  },

  async getDoublesLeaderboard(groupId, { limit = 50, pageToken = null } = {}) {
    logRequest("GET", `/api/groups/${groupId}/ratings/doubles`, { limit, pageToken });
    await delay();
    const db = loadDb();
    const userId = getLoggedInUserId() || "u_alex";
    const u = db.users.find(x => x.id === userId) || db.users[0];
    if (u) {
      const exists = db.memberships.some(m => m.groupId === groupId && m.userId === u.id);
      if (!exists) {
        db.memberships.push({groupId, userId: u.id, role: "member"});
        saveDb(db);
      }
    }
    const nameMap = participantNameMap(db, groupId);
    const pairMap = new Map();
    const doubles = db.matches.filter(m => m.groupId === groupId && m.kind === "doubles");
    for (const m of doubles) {
      const a = (m.teamA || []).slice().sort();
      const b = (m.teamB || []).slice().sort();
      const aKey = a.join(":");
      const bKey = b.join(":");
      const winA = didTeamWin(m, "A");
      const winB = didTeamWin(m, "B");
      const aRow = pairMap.get(aKey) || {pairKey: aKey, participantIds: a, wins: 0, losses: 0, games: 0};
      const bRow = pairMap.get(bKey) || {pairKey: bKey, participantIds: b, wins: 0, losses: 0, games: 0};
      aRow.games++; bRow.games++;
      if (winA === true) {aRow.wins++; bRow.losses++;}
      if (winB === true) {bRow.wins++; aRow.losses++;}
      pairMap.set(aKey, aRow);
      pairMap.set(bKey, bRow);
    }
    const rows = Array.from(pairMap.values()).map(r => ({
      pairKey: r.pairKey,
      participantNames: r.participantIds.map(id => nameMap.get(id) || id),
      elo: Math.round(1100 + r.wins * 10 - r.losses * 7),
    }));
    rows.sort((a, b) => b.elo - a.elo);
    const start = pageToken && pageToken.startsWith("offset_")
      ? parseInt(pageToken.slice("offset_".length), 10) || 0
      : 0;
    const pageItems = rows.slice(start, start + limit).map((r, i) => ({ ...r, rank: start + i + 1 }));
    const nextToken = start + limit < rows.length ? `offset_${start + limit}` : null;
    const result = { items: pageItems, pageToken: nextToken };
    logResponse("GET", `/api/groups/${groupId}/ratings/doubles`, result);
    return result;
  },

};



import {getLoggedInUserId, setLoggedInUserId} from "@/badminton/cookies.js";
import {ensureMembership, getCurrentUser, getMyRole, loadDb, nowIso, saveDb, uuid} from "@/badminton/mockDb.js";

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

function participantToClientDto(p) {
  if (!p) return p;
  return { id: p.id, name: p.name, userId: p.userId };
}

function groupToClientDto(g, myRole) {
  return { id: g.id, name: g.name, myRole };
}

function matchToClientDto(m) {
  if (!m) return m;
  return {
    id: m.id,
    kind: m.kind,
    startedAt: m.startedAt,
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
    const partnerUserId = partner?.userId || `unlinked:${partnerPid}`;
    const partnerName = partner?.name || partnerPid;

    const win = didTeamWin(m, mySide);
    const cur = map.get(partnerUserId) || {partnerUserId, partnerName, elo: 1100, games: 0, wins: 0, losses: 0};
    cur.games += 1;
    if (win === true) cur.wins += 1;
    if (win === false) cur.losses += 1;
    map.set(partnerUserId, cur);
  }

  const K = 10;
  const rows = Array.from(map.values()).map(r => ({
    partnerUserId: r.partnerUserId,
    partnerName: r.partnerName,
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
    setLoggedInUserId("");
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem("badminton.useMockSession");
    }
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
      const pageItems = all.slice(start, start + limit).map(participantToClientDto);
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
    const pageItems = all.slice(start, start + limit).map(participantToClientDto);
    const nextToken = start + limit < all.length ? `offset_${start + limit}` : null;
    const result = { items: pageItems, pageToken: nextToken };
    logResponse("GET", `/api/groups/${groupId}/participants`, result);
    return result;
  },

  async searchParticipants(groupId, {query = "", page = 0, pageSize = 10}) {
    logRequest("GET", `/api/groups/${groupId}/participants/search`, {query, page, pageSize});
    await delay();
    const db = loadDb();
    // Use default user if not logged in
    const userId = getLoggedInUserId() || "u_alex";
    const u = db.users.find(x => x.id === userId) || db.users[0];
    if (u) {
      // Ensure membership
      const exists = db.memberships.some(m => m.groupId === groupId && m.userId === u.id);
      if (!exists) {
        db.memberships.push({groupId, userId: u.id, role: "member"});
        saveDb(db);
      }
    }
    
    // Get all participants for this group, sorted alphabetically
    let all = db.participants
      .filter(p => p.groupId === groupId)
      .sort((a, b) => a.name.localeCompare(b.name));
    
    // Filter by query if provided
    if (query && query.trim()) {
      const lower = query.toLowerCase();
      all = all.filter(p => p.name.toLowerCase().includes(lower));
    }
    
    // Paginate
    const start = page * pageSize;
    const end = start + pageSize;
    const items = all.slice(start, end).map(participantToClientDto);
    const hasMore = end < all.length;
    const result = {
      items,
      hasMore,
    };
    logResponse("GET", `/api/groups/${groupId}/participants/search`, result);
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
    logResponse("POST", `/api/groups/${groupId}/participants`, participantToClientDto(p), 201);
    return participantToClientDto(p);
  },

  async updateParticipant(groupId, participantId, {name}) {
    logRequest("PUT", `/api/groups/${groupId}/participants/${participantId}`, {name});
    await delay();
    const db = loadDb();
    requireAuth(db);
    requireAdmin(db, groupId);
    const idx = db.participants.findIndex(p => p.id === participantId && p.groupId === groupId);
    if (idx < 0) throw new Error("Not found");
    db.participants[idx] = {...db.participants[idx], name};
    saveDb(db);
    const dto = participantToClientDto(db.participants[idx]);
    logResponse("PUT", `/api/groups/${groupId}/participants/${participantId}`, dto);
    return dto;
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
    const dto = participantToClientDto(db.participants[idx]);
    logResponse("POST", `/api/groups/${groupId}/participants/${participantId}/link-user`, dto);
    return dto;
  },

  async listMatches(groupId, { kind, limit = 50, pageToken = null } = {}) {
    logRequest("GET", `/api/groups/${groupId}/matches`, { kind, limit, pageToken });
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
    let all = db.matches.filter(m => m.groupId === groupId).sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
    if (kind === "singles" || kind === "doubles") {
      all = all.filter(m => m.kind === kind);
    }
    const start = pageToken && pageToken.startsWith("offset_")
      ? parseInt(pageToken.slice("offset_".length), 10) || 0
      : 0;
    const pageItems = all.slice(start, start + limit).map(matchToClientDto);
    const nextToken = start + limit < all.length ? `offset_${start + limit}` : null;
    const result = { items: pageItems, pageToken: nextToken };
    logResponse("GET", `/api/groups/${groupId}/matches`, result);
    return result;
  },

  async createMatch(groupId, match) {
    logRequest("POST", `/api/groups/${groupId}/matches`, match);
    await delay();
    const db = loadDb();
    const u = requireAuth(db);
    requireAdmin(db, groupId);
    // Backend sets startedAt automatically (current time)
    const m = {
      id: uuid("m"),
      groupId,
      kind: match.kind,
      startedAt: nowIso(), // Backend sets this automatically
      teamA: match.teamA || [],
      teamB: match.teamB || [],
      score: match.score,
      notes: match.notes || "",
      createdAt: nowIso(),
      createdByUserId: u.id,
    };
    db.matches.unshift(m);
    saveDb(db);
    const dto = matchToClientDto(m);
    logResponse("POST", `/api/groups/${groupId}/matches`, dto, 201);
    return dto;
  },

  async updateMatch(groupId, matchId, patch) {
    logRequest("PUT", `/api/groups/${groupId}/matches/${matchId}`, patch);
    await delay();
    const db = loadDb();
    requireAuth(db);
    requireAdmin(db, groupId);
    const idx = db.matches.findIndex(m => m.id === matchId && m.groupId === groupId);
    if (idx < 0) throw new Error("Not found");
    db.matches[idx] = {...db.matches[idx], ...patch};
    saveDb(db);
    const dto = matchToClientDto(db.matches[idx]);
    logResponse("PUT", `/api/groups/${groupId}/matches/${matchId}`, dto);
    return dto;
  },

  async deleteMatch(groupId, matchId) {
    logRequest("DELETE", `/api/groups/${groupId}/matches/${matchId}`);
    await delay();
    const db = loadDb();
    requireAuth(db);
    requireAdmin(db, groupId);
    db.matches = db.matches.filter(m => !(m.groupId === groupId && m.id === matchId));
    saveDb(db);
    logResponse("DELETE", `/api/groups/${groupId}/matches/${matchId}`, null, 204);
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

  async getMySinglesMatches({ limit = 20, pageToken = null } = {}) {
    logRequest("GET", "/api/me/matches/singles", { limit, pageToken });
    await delay();
    const db = loadDb();
    const userId = getLoggedInUserId() || "u_alex";
    const u = db.users.find(x => x.id === userId) || db.users[0];
    const myPIds = new Set((db.participants || []).filter(p => p.userId === u?.id).map(p => p.id));
    const all = (db.matches || [])
      .filter(m => m.kind === "singles" && ((m.teamA || []).some(id => myPIds.has(id)) || (m.teamB || []).some(id => myPIds.has(id))))
      .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
    const start = pageToken && pageToken.startsWith("offset_") ? parseInt(pageToken.slice("offset_".length), 10) || 0 : 0;
    const pageItems = all.slice(start, start + limit).map(matchToClientDto);
    const nextToken = start + limit < all.length ? `offset_${start + limit}` : null;
    const result = { items: pageItems, pageToken: nextToken };
    logResponse("GET", "/api/me/matches/singles", result);
    return result;
  },

  async getMyDoublesMatches({ limit = 20, pageToken = null } = {}) {
    logRequest("GET", "/api/me/matches/doubles", { limit, pageToken });
    await delay();
    const db = loadDb();
    const userId = getLoggedInUserId() || "u_alex";
    const u = db.users.find(x => x.id === userId) || db.users[0];
    const myPIds = new Set((db.participants || []).filter(p => p.userId === u?.id).map(p => p.id));
    const all = (db.matches || [])
      .filter(m => m.kind === "doubles" && ((m.teamA || []).some(id => myPIds.has(id)) || (m.teamB || []).some(id => myPIds.has(id))))
      .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
    const start = pageToken && pageToken.startsWith("offset_") ? parseInt(pageToken.slice("offset_".length), 10) || 0 : 0;
    const pageItems = all.slice(start, start + limit).map(matchToClientDto);
    const nextToken = start + limit < all.length ? `offset_${start + limit}` : null;
    const result = { items: pageItems, pageToken: nextToken };
    logResponse("GET", "/api/me/matches/doubles", result);
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



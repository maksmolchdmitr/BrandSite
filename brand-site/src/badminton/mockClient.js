import {getLoggedInUserId, setLoggedInUserId} from "@/badminton/cookies.js";
import {ensureMembership, getCurrentUser, getMyRole, loadDb, nowIso, saveDb, uuid} from "@/badminton/mockDb.js";

function delay(ms = 180) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function logRequest(method, endpoint, params = {}) {
  console.log(`[API Request] ${method} ${endpoint}`, params);
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
  // Mock: base 1200 + wins*8 - losses*6 (across all groups where participant linked to user)
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
  return Math.round(1200 + wins * 8 - losses * 6);
}

function calcDoublesPerPartner(db, userId) {
  // Build partner Elo map: base 1100 + pairWins*10 - pairLosses*7 per partner (across all groups)
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

  const rows = Array.from(map.values()).map(r => ({
    partnerUserId: r.partnerUserId,
    partnerName: r.partnerName,
    games: r.games,
    wins: r.wins,
    losses: r.losses,
    elo: Math.round(1100 + r.wins * 10 - r.losses * 7),
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
  async authTelegramStart({redirectUrl}) {
    logRequest("POST", "/auth/telegram/start", {redirectUrl});
    await delay();
    // Generate a mock state token
    const state = `mock_state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    // Store in sessionStorage for later verification
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('telegram_auth_state', state);
    }
    return {
      state,
      botUsername: 'maksmolch_badminton_service_bot',
      widgetOrigin: 'https://oauth.telegram.org'
    };
  },

  async authTelegramComplete({state, telegram}) {
    logRequest("POST", "/auth/telegram/complete", {state, telegram});
    await delay(150);
    
    const db = loadDb();
    
    // Verify state (in real implementation, this would be verified against stored state)
    const storedState = typeof window !== 'undefined' ? sessionStorage.getItem('telegram_auth_state') : null;
    if (storedState && storedState !== state) {
      throw new Error("Invalid state");
    }
    
    // Find or create user by telegramId
    const telegramId = String(telegram.id);
    let user = db.users.find(u => String(u.telegramId) === telegramId);
    
    if (!user) {
      // Create new user from Telegram data
      const username = telegram.username || `tg_${telegram.id}`;
      const displayName = [telegram.first_name, telegram.last_name].filter(Boolean).join(' ') || username;
      user = {
        id: uuid("u"),
        telegramId: parseInt(telegram.id, 10),
        username: username,
        displayName: displayName,
        createdAt: nowIso()
      };
      db.users.push(user);
      saveDb(db);
    }
    
    // Set as logged in user
    setLoggedInUserId(user.id);
    
    // Return mock token (in real implementation, this would be a JWT)
    return {
      accessToken: `mock_token_${user.id}_${Date.now()}`,
      tokenType: 'Bearer',
      expiresInSec: 3600
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
    logRequest("POST", "/auth/logout");
    await delay(80);
    setLoggedInUserId("");
  },

  async getMe() {
    logRequest("GET", "/me");
    await delay();
    const db = loadDb();
    // Use default user if not logged in
    const userId = getLoggedInUserId() || "u_alex";
    const user = db.users.find(u => u.id === userId);
    if (!user) {
      // Fallback to first user
      return db.users[0] || {id: "u_alex", telegramId: 20001, displayName: "Alex Chen", username: "alex_shuttle", createdAt: new Date().toISOString()};
    }
    return user;
  },

  async getMyGroups() {
    logRequest("GET", "/groups");
    await delay();
    const db = loadDb();
    // Use default user if not logged in
    const userId = getLoggedInUserId() || "u_alex";
    const u = db.users.find(x => x.id === userId) || db.users[0];
    if (!u) {
      return [];
    }
    const groupIds = db.memberships.filter(m => m.userId === u.id).map(m => m.groupId);
    return db.groups
      .filter(g => groupIds.includes(g.id))
      .map(g => ({...g, myRole: db.memberships.find(m => m.userId === u.id && m.groupId === g.id)?.role || "member"}));
  },

  async createGroup({name}) {
    logRequest("POST", "/groups", {name});
    await delay();
    const db = loadDb();
    const u = requireAuth(db);
    const g = {id: uuid("g"), name, createdAt: nowIso(), createdByUserId: u.id};
    db.groups.unshift(g);
    db.memberships.push({groupId: g.id, userId: u.id, role: "admin"});
    saveDb(db);
    return {...g, myRole: "admin"};
  },

  async getGroup(groupId) {
    logRequest("GET", `/groups/${groupId}`);
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
    if (!role) {
      // Auto-add as member for default user
      db.memberships.push({groupId, userId: u.id, role: "member"});
      saveDb(db);
      return {...g, myRole: "member"};
    }
    return {...g, myRole: role};
  },

  async listParticipants(groupId) {
    logRequest("GET", `/groups/${groupId}/participants`);
    await delay();
    const db = loadDb();
    // Use default user if not logged in
    const userId = getLoggedInUserId() || "u_alex";
    const u = db.users.find(x => x.id === userId) || db.users[0];
    if (!u) {
      return db.participants.filter(p => p.groupId === groupId);
    }
    // Ensure membership
    const exists = db.memberships.some(m => m.groupId === groupId && m.userId === u.id);
    if (!exists) {
      db.memberships.push({groupId, userId: u.id, role: "member"});
      saveDb(db);
    }
    return db.participants.filter(p => p.groupId === groupId);
  },

  async searchParticipants(groupId, {query = "", page = 0, pageSize = 10}) {
    logRequest("GET", `/groups/${groupId}/participants/search`, {query, page, pageSize});
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
    const items = all.slice(start, end);
    const hasMore = end < all.length;
    
    return {
      items,
      page,
      pageSize,
      total: all.length,
      hasMore,
    };
  },

  async createParticipant(groupId, {name}) {
    logRequest("POST", `/groups/${groupId}/participants`, {name});
    await delay();
    const db = loadDb();
    requireAuth(db);
    requireAdmin(db, groupId);
    const p = {id: uuid("p"), groupId, name, userId: null, createdAt: nowIso()};
    db.participants.unshift(p);
    saveDb(db);
    return p;
  },

  async updateParticipant(groupId, participantId, {name}) {
    logRequest("PUT", `/groups/${groupId}/participants/${participantId}`, {name});
    await delay();
    const db = loadDb();
    requireAuth(db);
    requireAdmin(db, groupId);
    const idx = db.participants.findIndex(p => p.id === participantId && p.groupId === groupId);
    if (idx < 0) throw new Error("Not found");
    db.participants[idx] = {...db.participants[idx], name};
    saveDb(db);
    return db.participants[idx];
  },

  async deleteParticipant(groupId, participantId) {
    logRequest("DELETE", `/groups/${groupId}/participants/${participantId}`);
    await delay();
    const db = loadDb();
    requireAuth(db);
    requireAdmin(db, groupId);
    db.participants = db.participants.filter(p => !(p.groupId === groupId && p.id === participantId));
    // Also remove from matches
    db.matches = db.matches.filter(m => !((m.groupId === groupId) && ((m.teamA || []).includes(participantId) || (m.teamB || []).includes(participantId))));
    saveDb(db);
  },

  async linkUserToParticipant(groupId, participantId, {userId}) {
    logRequest("POST", `/groups/${groupId}/participants/${participantId}/link-user`, {userId});
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
    return db.participants[idx];
  },

  async listMatches(groupId) {
    logRequest("GET", `/groups/${groupId}/matches`);
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
    const items = db.matches.filter(m => m.groupId === groupId).sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
    return items;
  },

  async createMatch(groupId, match) {
    logRequest("POST", `/groups/${groupId}/matches`, match);
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
    return m;
  },

  async updateMatch(groupId, matchId, patch) {
    logRequest("PUT", `/groups/${groupId}/matches/${matchId}`, patch);
    await delay();
    const db = loadDb();
    requireAuth(db);
    requireAdmin(db, groupId);
    const idx = db.matches.findIndex(m => m.id === matchId && m.groupId === groupId);
    if (idx < 0) throw new Error("Not found");
    db.matches[idx] = {...db.matches[idx], ...patch};
    saveDb(db);
    return db.matches[idx];
  },

  async deleteMatch(groupId, matchId) {
    logRequest("DELETE", `/groups/${groupId}/matches/${matchId}`);
    await delay();
    const db = loadDb();
    requireAuth(db);
    requireAdmin(db, groupId);
    db.matches = db.matches.filter(m => !(m.groupId === groupId && m.id === matchId));
    saveDb(db);
  },

  async getMyRatings() {
    logRequest("GET", "/me/ratings");
    await delay();
    const db = loadDb();
    // Use default user if not logged in
    const userId = getLoggedInUserId() || "u_alex";
    const u = db.users.find(x => x.id === userId) || db.users[0];
    if (!u) {
      return {userId: "u_alex", singlesElo: 1200, doublesElo: 1100, doublesByPartner: []};
    }
    const singlesElo = calcSinglesElo(db, u.id);
    const doublesByPartner = calcDoublesPerPartner(db, u.id);
    const doublesElo = doublesByPartner.length
      ? Math.round(doublesByPartner.reduce((s, r) => s + r.elo, 0) / doublesByPartner.length)
      : 1100;
    return {userId: u.id, singlesElo, doublesElo, doublesByPartner};
  },

  async getMyGamesStats() {
    logRequest("GET", "/me/games-stats");
    await delay();
    const db = loadDb();
    // Use default user if not logged in
    const userId = getLoggedInUserId() || "u_alex";
    const u = db.users.find(x => x.id === userId) || db.users[0];
    if (!u) {
      return {
        userId: "u_alex",
        singles: {matchesPlayed: 0, matchesWon: 0, matchesLost: 0, winRate: 0},
        doubles: {matchesPlayed: 0, matchesWon: 0, matchesLost: 0, winRate: 0},
        recentMatches: [],
      };
    }
    const myPIds = new Set(db.participants.filter(p => p.userId === u.id).map(p => p.id));
    const singlesMatches = db.matches.filter(m => m.kind === "singles");
    const doublesMatches = db.matches.filter(m => m.kind === "doubles");
    const singles = calcTotals(singlesMatches, myPIds);
    const doubles = calcTotals(doublesMatches, myPIds);
    // return also detailed lists for UI
    return {
      userId: u.id,
      singles,
      doubles,
      recentMatches: db.matches
        .filter(m => (m.teamA || []).some(id => myPIds.has(id)) || (m.teamB || []).some(id => myPIds.has(id)))
        .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))
        .slice(0, 50),
    };
  },

  async getSinglesLeaderboard(groupId) {
    logRequest("GET", `/groups/${groupId}/ratings/singles`);
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
    const ids = db.participants.filter(p => p.groupId === groupId).map(p => p.id);
    // mock Elo: 1200 + singles wins*7 - losses*5 inside group
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
      return {participantId: pid, participantName: p?.name || pid, elo: Math.round(1200 + w * 7 - l * 5), games: singles.length};
    });
    rows.sort((a, b) => b.elo - a.elo);
    return rows;
  },

  async getDoublesLeaderboard(groupId) {
    logRequest("GET", `/groups/${groupId}/ratings/doubles`);
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
    const nameMap = participantNameMap(db, groupId);
    const pairMap = new Map(); // pairKey -> {wins, losses, games, ids}
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
      participantIds: r.participantIds,
      participantNames: r.participantIds.map(id => nameMap.get(id) || id),
      games: r.games,
      elo: Math.round(1100 + r.wins * 10 - r.losses * 7),
    }));
    rows.sort((a, b) => b.elo - a.elo);
    return rows;
  },

  async getGroupStats(groupId) {
    await delay();
    const db = loadDb();
    requireAuth(db);
    requireMember(db, groupId);
    const ms = db.matches.filter(m => m.groupId === groupId);
    const last = ms.slice().sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))[0];
    return {groupId, totalMatches: ms.length, lastMatchAt: last?.startedAt || null};
  },
};



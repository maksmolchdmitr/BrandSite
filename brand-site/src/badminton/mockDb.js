import {getLoggedInUserId} from "@/badminton/cookies.js";

const DB_KEY = "badminton.mockdb.v3"; // Updated to v3 with new test data

function uuid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function seedDb() {
  // Test users with diverse names
  const users = [
    {id: "u_alex", telegramId: 20001, username: "alex_shuttle", displayName: "Alex Chen", createdAt: nowIso()},
    {id: "u_sophia", telegramId: 20002, username: "sophia_smash", displayName: "Sophia Martinez", createdAt: nowIso()},
    {id: "u_liam", telegramId: 20003, username: "liam_ace", displayName: "Liam O'Connor", createdAt: nowIso()},
    {id: "u_emma", telegramId: 20004, username: "emma_drop", displayName: "Emma Thompson", createdAt: nowIso()},
    {id: "u_noah", telegramId: 20005, username: "noah_clear", displayName: "Noah Williams", createdAt: nowIso()},
    {id: "u_olivia", telegramId: 20006, username: "olivia_lift", displayName: "Olivia Brown", createdAt: nowIso()},
    {id: "u_james", telegramId: 20007, username: "james_drive", displayName: "James Wilson", createdAt: nowIso()},
    {id: "u_ava", telegramId: 20008, username: "ava_net", displayName: "Ava Davis", createdAt: nowIso()},
  ];

  // Multiple test groups
  const groups = [
    {id: "g_weekend_warriors", name: "Weekend Warriors", createdAt: nowIso(), createdByUserId: "u_alex"},
    {id: "g_city_champions", name: "City Champions League", createdAt: nowIso(), createdByUserId: "u_sophia"},
    {id: "g_casual_players", name: "Casual Players Club", createdAt: nowIso(), createdByUserId: "u_liam"},
  ];

  const memberships = [
    // Weekend Warriors
    {groupId: "g_weekend_warriors", userId: "u_alex", role: "admin"},
    {groupId: "g_weekend_warriors", userId: "u_sophia", role: "admin"},
    {groupId: "g_weekend_warriors", userId: "u_liam", role: "member"},
    {groupId: "g_weekend_warriors", userId: "u_emma", role: "member"},
    {groupId: "g_weekend_warriors", userId: "u_noah", role: "member"},
    // City Champions
    {groupId: "g_city_champions", userId: "u_sophia", role: "admin"},
    {groupId: "g_city_champions", userId: "u_olivia", role: "member"},
    {groupId: "g_city_champions", userId: "u_james", role: "member"},
    {groupId: "g_city_champions", userId: "u_ava", role: "member"},
    // Casual Players
    {groupId: "g_casual_players", userId: "u_liam", role: "admin"},
    {groupId: "g_casual_players", userId: "u_emma", role: "member"},
    {groupId: "g_casual_players", userId: "u_noah", role: "member"},
  ];

  // Generate diverse participants for Weekend Warriors (main group for testing)
  const participantNames = [
    // Core players
    "Alex Chen", "Sophia Martinez", "Liam O'Connor", "Emma Thompson", "Noah Williams",
    "Olivia Brown", "James Wilson", "Ava Davis",
    // Additional players
    "Michael Johnson", "Sarah Anderson", "David Lee", "Jessica Taylor", "Christopher Moore",
    "Amanda White", "Daniel Garcia", "Michelle Rodriguez", "Kevin Martinez", "Rachel Kim",
    "Ryan Park", "Lauren Smith", "Tyler Brown", "Nicole Davis", "Jordan Miller",
    "Megan Wilson", "Brandon Jones", "Stephanie Lee", "Justin Chen", "Katherine Wang",
    "Andrew Kim", "Jennifer Lopez", "Matthew Taylor", "Emily Johnson", "Nathan Anderson",
    "Ashley Martinez", "Jonathan White", "Samantha Garcia", "Robert Rodriguez", "Brittany Kim",
    "William Park", "Amanda Smith", "Joseph Brown", "Melissa Davis", "Thomas Miller",
    "Lisa Wilson", "Richard Jones", "Patricia Lee", "Charles Chen", "Nancy Wang",
    "Daniel Kim", "Betty Lopez", "Mark Taylor", "Helen Johnson", "Paul Anderson",
    "Sandra Martinez", "Steven White", "Donna Garcia", "Kenneth Rodriguez", "Carol Kim",
    "George Park", "Ruth Smith", "Edward Brown", "Sharon Davis", "Brian Miller",
    "Michelle Wilson", "Ronald Jones", "Laura Lee", "Jason Chen", "Kimberly Wang",
    "Jeffrey Kim", "Deborah Lopez", "Ryan Taylor", "Angela Johnson", "Gary Anderson",
    "Amy Martinez", "Eric White", "Brenda Garcia", "Scott Rodriguez", "Emma Kim",
    "Stephen Park", "Cynthia Smith", "Andrew Brown", "Kathleen Davis", "Joshua Miller",
    "Rebecca Wilson", "Raymond Jones", "Shirley Lee", "Patrick Chen", "Virginia Wang",
    "Peter Kim", "Anna Lopez", "Harold Taylor", "Marie Johnson", "Carl Anderson",
    "Frances Martinez", "Arthur White", "Evelyn Garcia", "Jack Rodriguez", "Joyce Kim",
    "Lawrence Park", "Mildred Smith", "Roger Brown", "Joan Davis", "Eugene Miller",
    "Doris Wilson", "Ralph Jones", "Ruby Lee", "Louis Chen", "Rose Wang",
    "Wayne Kim", "Lois Lopez", "Albert Taylor", "Irene Johnson", "Harry Anderson",
    "Jean Martinez", "Fred White", "Florence Garcia", "Howard Rodriguez", "Lillian Kim",
    "Roy Park", "Gladys Smith", "Victor Brown", "Ethel Davis", "Ralph Miller",
    "Thelma Wilson", "Clarence Jones", "Lucille Lee", "Frank Chen", "Edna Wang",
    "Norman Kim", "Martha Lopez", "Willie Taylor", "Alice Johnson", "Louis Anderson",
    "Marie Martinez", "Henry White", "Grace Garcia", "Walter Rodriguez", "Frances Kim",
    "Eugene Park", "Ruth Smith", "Carl Brown", "Helen Davis", "Arthur Miller",
    "Mildred Wilson", "Raymond Jones", "Anna Lee", "Harold Chen", "Marie Wang",
    "Lawrence Kim", "Frances Lopez", "Jack Taylor", "Joyce Johnson", "Eugene Anderson",
    "Doris Martinez", "Ralph White", "Ruby Garcia", "Louis Rodriguez", "Rose Kim",
    "Wayne Park", "Lois Smith", "Albert Brown", "Irene Davis", "Harry Miller",
    "Jean Wilson", "Fred Jones", "Florence Lee", "Howard Chen", "Lillian Wang",
  ];

  const participants = [];
  
  // Add participants to Weekend Warriors (main group)
  participantNames.forEach((name, idx) => {
    const userId = idx < users.length ? users[idx].id : null;
    participants.push({
      id: `p_ww_${idx}`,
      groupId: "g_weekend_warriors",
      name,
      userId,
      createdAt: nowIso(),
    });
  });

  // Add some participants to City Champions
  const cityChampionsNames = ["Sophia Martinez", "Olivia Brown", "James Wilson", "Ava Davis", "Michael Johnson", "Sarah Anderson"];
  cityChampionsNames.forEach((name, idx) => {
    const user = users.find(u => u.displayName === name);
    participants.push({
      id: `p_cc_${idx}`,
      groupId: "g_city_champions",
      name,
      userId: user?.id || null,
      createdAt: nowIso(),
    });
  });

  // Add some participants to Casual Players
  const casualNames = ["Liam O'Connor", "Emma Thompson", "Noah Williams", "David Lee", "Jessica Taylor"];
  casualNames.forEach((name, idx) => {
    const user = users.find(u => u.displayName === name);
    participants.push({
      id: `p_cp_${idx}`,
      groupId: "g_casual_players",
      name,
      userId: user?.id || null,
      createdAt: nowIso(),
    });
  });

  // Helper to find participant ID by name in a group
  function findPid(groupId, name) {
    const p = participants.find(p => p.groupId === groupId && p.name === name);
    return p ? p.id : null;
  }

  // Generate matches for Weekend Warriors
  const matches = [];
  const now = Date.now();
  
  // Singles matches
  const singlesMatches = [
    {p1: "Alex Chen", p2: "Sophia Martinez", score: [{pointsA: 21, pointsB: 15}, {pointsA: 21, pointsB: 18}]},
    {p1: "Liam O'Connor", p2: "Emma Thompson", score: [{pointsA: 18, pointsB: 21}, {pointsA: 21, pointsB: 19}, {pointsA: 21, pointsB: 17}]},
    {p1: "Noah Williams", p2: "Olivia Brown", score: [{pointsA: 21, pointsB: 12}, {pointsA: 21, pointsB: 14}]},
    {p1: "James Wilson", p2: "Ava Davis", score: [{pointsA: 21, pointsB: 16}, {pointsA: 19, pointsB: 21}, {pointsA: 21, pointsB: 19}]},
    {p1: "Michael Johnson", p2: "Sarah Anderson", score: [{pointsA: 21, pointsB: 10}, {pointsA: 21, pointsB: 13}]},
    {p1: "David Lee", p2: "Jessica Taylor", score: [{pointsA: 15, pointsB: 21}, {pointsA: 21, pointsB: 17}, {pointsA: 21, pointsB: 16}]},
    {p1: "Christopher Moore", p2: "Amanda White", score: [{pointsA: 21, pointsB: 14}, {pointsA: 21, pointsB: 16}]},
    {p1: "Daniel Garcia", p2: "Michelle Rodriguez", score: [{pointsA: 21, pointsB: 19}, {pointsA: 18, pointsB: 21}, {pointsA: 21, pointsB: 15}]},
  ];

  singlesMatches.forEach((m, idx) => {
    const p1Id = findPid("g_weekend_warriors", m.p1);
    const p2Id = findPid("g_weekend_warriors", m.p2);
    if (p1Id && p2Id) {
      matches.push({
        id: uuid("m"),
        groupId: "g_weekend_warriors",
        kind: "singles",
        startedAt: new Date(now - (singlesMatches.length - idx) * 864e5).toISOString(),
        teamA: [p1Id],
        teamB: [p2Id],
        score: {games: m.score},
        notes: "",
        createdAt: nowIso(),
        createdByUserId: "u_alex",
      });
    }
  });

  // Doubles matches
  const doublesMatches = [
    {team1: ["Alex Chen", "Sophia Martinez"], team2: ["Liam O'Connor", "Emma Thompson"], score: [{pointsA: 21, pointsB: 17}, {pointsA: 21, pointsB: 19}]},
    {team1: ["Noah Williams", "Olivia Brown"], team2: ["James Wilson", "Ava Davis"], score: [{pointsA: 19, pointsB: 21}, {pointsA: 21, pointsB: 18}, {pointsA: 21, pointsB: 16}]},
    {team1: ["Michael Johnson", "Sarah Anderson"], team2: ["David Lee", "Jessica Taylor"], score: [{pointsA: 21, pointsB: 14}, {pointsA: 21, pointsB: 15}]},
    {team1: ["Christopher Moore", "Amanda White"], team2: ["Daniel Garcia", "Michelle Rodriguez"], score: [{pointsA: 21, pointsB: 16}, {pointsA: 18, pointsB: 21}, {pointsA: 21, pointsB: 17}]},
    {team1: ["Kevin Martinez", "Rachel Kim"], team2: ["Ryan Park", "Lauren Smith"], score: [{pointsA: 21, pointsB: 12}, {pointsA: 21, pointsB: 13}]},
    {team1: ["Tyler Brown", "Nicole Davis"], team2: ["Jordan Miller", "Megan Wilson"], score: [{pointsA: 17, pointsB: 21}, {pointsA: 21, pointsB: 19}, {pointsA: 21, pointsB: 18}]},
    {team1: ["Brandon Jones", "Stephanie Lee"], team2: ["Justin Chen", "Katherine Wang"], score: [{pointsA: 21, pointsB: 15}, {pointsA: 21, pointsB: 17}]},
    {team1: ["Andrew Kim", "Jennifer Lopez"], team2: ["Matthew Taylor", "Emily Johnson"], score: [{pointsA: 21, pointsB: 18}, {pointsA: 19, pointsB: 21}, {pointsA: 21, pointsB: 19}]},
    {team1: ["Nathan Anderson", "Ashley Martinez"], team2: ["Jonathan White", "Samantha Garcia"], score: [{pointsA: 21, pointsB: 13}, {pointsA: 21, pointsB: 14}]},
    {team1: ["Robert Rodriguez", "Brittany Kim"], team2: ["William Park", "Amanda Smith"], score: [{pointsA: 16, pointsB: 21}, {pointsA: 21, pointsB: 17}, {pointsA: 21, pointsB: 16}]},
  ];

  doublesMatches.forEach((m, idx) => {
    const p1a = findPid("g_weekend_warriors", m.team1[0]);
    const p1b = findPid("g_weekend_warriors", m.team1[1]);
    const p2a = findPid("g_weekend_warriors", m.team2[0]);
    const p2b = findPid("g_weekend_warriors", m.team2[1]);
    if (p1a && p1b && p2a && p2b) {
      matches.push({
        id: uuid("m"),
        groupId: "g_weekend_warriors",
        kind: "doubles",
        startedAt: new Date(now - (doublesMatches.length - idx) * 864e5).toISOString(),
        teamA: [p1a, p1b],
        teamB: [p2a, p2b],
        score: {games: m.score},
        notes: "",
        createdAt: nowIso(),
        createdByUserId: "u_alex",
      });
    }
  });

  return {
    users,
    groups,
    memberships,
    participants,
    matches,
    createdAt: nowIso(),
  };
}

export function loadDb() {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) {
    // No data in localStorage - seed fresh data
    const db = seedDb();
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    console.log("[mockDb] Seeded fresh database with", db.users.length, "users,", db.groups.length, "groups,", db.participants.length, "participants,", db.matches.length, "matches");
    return db;
  }
  const db = safeParse(raw, seedDb());
  // Ensure we have all required data
  if (!db.users || db.users.length === 0 || !db.groups || db.groups.length === 0) {
    console.log("[mockDb] Database corrupted or empty, reseeding...");
    const freshDb = seedDb();
    localStorage.setItem(DB_KEY, JSON.stringify(freshDb));
    return freshDb;
  }
  console.log("[mockDb] Loaded database:", db.users.length, "users,", db.groups.length, "groups,", db.participants.length, "participants,", db.matches.length, "matches");
  return db;
}

export function saveDb(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

export function getCurrentUser(db) {
  const id = getLoggedInUserId();
  if (!id) return null;
  return db.users.find(u => u.id === id) || null;
}

export function getUserById(db, id) {
  return db.users.find(u => u.id === id) || null;
}

export function getMyRole(db, groupId) {
  const u = getCurrentUser(db);
  if (!u) return null;
  const m = db.memberships.find(x => x.groupId === groupId && x.userId === u.id);
  return m ? m.role : null;
}

export function ensureMembership(db, groupId, role = "member") {
  const u = getCurrentUser(db);
  if (!u) throw new Error("Unauthorized");
  const exists = db.memberships.some(x => x.groupId === groupId && x.userId === u.id);
  if (!exists) db.memberships.push({groupId, userId: u.id, role});
}

export {uuid, nowIso};

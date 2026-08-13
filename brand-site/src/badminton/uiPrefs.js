import { parseRatingHistoryPeriod } from "@/badminton/ratingHistory.js";

const STORAGE_KEY = "badminton.uiPrefs";

const DEFAULTS = Object.freeze({
  gamesTab: "singles",
  groupMatchTab: "doubles",
  groupSection: "matches",
  ratingHistoryPeriod: "1d",
});

const GAMES_TABS = new Set(["singles", "doubles"]);
const GROUP_MATCH_TABS = new Set(["singles", "doubles"]);
const GROUP_SECTIONS = new Set(["matches", "participants", "leaderboards"]);

function readAll() {
  if (typeof localStorage === "undefined") return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { ...DEFAULTS };
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

function writeAll(next) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota / private mode
  }
}

function patch(partial) {
  const next = { ...readAll(), ...partial };
  writeAll(next);
  return next;
}

export function getGamesTab() {
  const tab = readAll().gamesTab;
  return GAMES_TABS.has(tab) ? tab : DEFAULTS.gamesTab;
}

export function setGamesTab(tab) {
  if (!GAMES_TABS.has(tab)) return getGamesTab();
  patch({ gamesTab: tab });
  return tab;
}

export function getGroupMatchTab() {
  const tab = readAll().groupMatchTab;
  return GROUP_MATCH_TABS.has(tab) ? tab : DEFAULTS.groupMatchTab;
}

export function setGroupMatchTab(tab) {
  if (!GROUP_MATCH_TABS.has(tab)) return getGroupMatchTab();
  patch({ groupMatchTab: tab });
  return tab;
}

export function getGroupSection() {
  const section = readAll().groupSection;
  return GROUP_SECTIONS.has(section) ? section : DEFAULTS.groupSection;
}

export function setGroupSection(section) {
  if (!GROUP_SECTIONS.has(section)) return getGroupSection();
  patch({ groupSection: section });
  return section;
}

export function getRatingHistoryPeriod() {
  const period = readAll().ratingHistoryPeriod;
  const parsed = parseRatingHistoryPeriod(period);
  return parsed ? parsed.id : DEFAULTS.ratingHistoryPeriod;
}

export function setRatingHistoryPeriod(period) {
  const parsed = parseRatingHistoryPeriod(period);
  if (!parsed) return getRatingHistoryPeriod();
  patch({ ratingHistoryPeriod: parsed.id });
  return parsed.id;
}

export function gamesSectionTo(tab = getGamesTab()) {
  const t = GAMES_TABS.has(tab) ? tab : getGamesTab();
  return `/?page=badminton&section=games&tab=${t}`;
}

export function groupHref(groupId, {
  groupSection = getGroupSection(),
  matchTab = getGroupMatchTab(),
} = {}) {
  const gid = encodeURIComponent(groupId);
  const section = GROUP_SECTIONS.has(groupSection) ? groupSection : getGroupSection();
  let href = `/?page=badminton&section=groups&groupId=${gid}&groupSection=${section}`;
  if (section === "matches" || section === "leaderboards") {
    const tab = GROUP_MATCH_TABS.has(matchTab) ? matchTab : getGroupMatchTab();
    href += `&matchTab=${tab}`;
  }
  return href;
}

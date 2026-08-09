/**
 * In-memory cache for group participant search pages.
 * Shared across match pickers / participants search so already-fetched
 * pages (empty query first page, scrolled pages, filtered queries) are reused.
 */

const TTL_MS = 10 * 60 * 1000;

/** @type {Map<string, { expiresAt: number, items: unknown[], pageToken: string|null }>} */
const pageCache = new Map();

/** @type {Map<string, Promise<{ items: unknown[], pageToken: string|null }>>} */
const inflight = new Map();

function normalizeQuery(query) {
  return String(query || "").trim().toLowerCase();
}

function cacheKey(groupId, query, limit, pageToken) {
  return [
    String(groupId || ""),
    normalizeQuery(query),
    String(limit ?? 10),
    String(pageToken || ""),
  ].join("\0");
}

function clonePage(page) {
  return {
    items: Array.isArray(page?.items) ? page.items.map((item) => ({ ...item })) : [],
    pageToken: page?.pageToken || null,
  };
}

export function getCachedParticipantSearchPage(groupId, { query = "", limit = 10, pageToken } = {}) {
  const key = cacheKey(groupId, query, limit, pageToken);
  const hit = pageCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    pageCache.delete(key);
    return null;
  }
  return clonePage(hit);
}

export function setCachedParticipantSearchPage(groupId, { query = "", limit = 10, pageToken } = {}, page) {
  const key = cacheKey(groupId, query, limit, pageToken);
  const cloned = clonePage(page);
  pageCache.set(key, {
    expiresAt: Date.now() + TTL_MS,
    items: cloned.items,
    pageToken: cloned.pageToken,
  });
  return cloned;
}

/**
 * @param {(groupId: string, opts: object) => Promise<{items: unknown[], pageToken?: string|null}>} fetcher
 */
export async function cachedSearchParticipants(fetcher, groupId, { query = "", limit = 10, pageToken } = {}) {
  const opts = { query, limit, pageToken };
  const cached = getCachedParticipantSearchPage(groupId, opts);
  if (cached) return cached;

  const key = cacheKey(groupId, query, limit, pageToken);
  const pending = inflight.get(key);
  if (pending) return clonePage(await pending);

  const request = Promise.resolve()
    .then(() => fetcher(groupId, opts))
    .then((page) => {
      inflight.delete(key);
      return setCachedParticipantSearchPage(groupId, opts, page);
    })
    .catch((error) => {
      inflight.delete(key);
      throw error;
    });

  inflight.set(key, request);
  return clonePage(await request);
}

export function invalidateParticipantSearchCache(groupId) {
  if (!groupId) {
    pageCache.clear();
    inflight.clear();
    return;
  }
  const prefix = `${String(groupId)}\0`;
  for (const key of [...pageCache.keys()]) {
    if (key.startsWith(prefix)) pageCache.delete(key);
  }
  for (const key of [...inflight.keys()]) {
    if (key.startsWith(prefix)) inflight.delete(key);
  }
}

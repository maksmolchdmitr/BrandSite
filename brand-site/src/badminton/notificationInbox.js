let unreadCount = 0;
const subscribers = new Set();

export function publishUnreadCount(count) {
  unreadCount = Math.max(0, count);
  subscribers.forEach((fn) => fn(unreadCount));
}

export function subscribeUnreadCount(fn) {
  subscribers.add(fn);
  fn(unreadCount);
  return () => subscribers.delete(fn);
}

export function unreadCountFromPage(page, limit) {
  const items = page?.items || [];
  return page?.pageToken ? Math.max(items.length, limit) : items.length;
}

export function notificationSenderName(item) {
  const name = [item?.senderFirstName, item?.senderLastName]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ");
  return name || "User";
}

export function notificationUnlinkedName(item) {
  const name = [item?.unlinkedFirstName, item?.unlinkedLastName]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ");
  return name || "User";
}

export function linkUserMatchesTo(notificationId, groupId) {
  const query = new URLSearchParams({
    page: "badminton",
    section: "link-user-matches",
    notificationId,
  });
  if (groupId) query.set("groupId", groupId);
  return `/?${query.toString()}`;
}

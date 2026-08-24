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

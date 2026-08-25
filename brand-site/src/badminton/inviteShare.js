const INVITE_GROUP_KEY = "badminton.inviteGroup";

export function buildGroupInviteUrl(groupId) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const params = new URLSearchParams({
    page: "badminton",
    section: "login",
    autoTg: "1",
    inviteGroup: String(groupId || ""),
  });
  return `${origin}/?${params.toString()}`;
}

export function buildGroupInviteShareText(groupName, inviteUrl) {
  const name = String(groupName || "").trim() || "группу";
  return `Вас пригласили в «${name}» в badminton-service.\nВойдите через Telegram:\n${inviteUrl}`;
}

export function telegramShareUrl(url, text) {
  const share = new URL("https://t.me/share/url");
  share.searchParams.set("url", url);
  share.searchParams.set("text", text);
  return share.toString();
}

export function openTelegramShare(url, text) {
  if (typeof window === "undefined") return;
  window.open(telegramShareUrl(url, text), "_blank", "noopener,noreferrer");
}

export async function copyText(text) {
  const value = String(text || "");
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const el = document.createElement("textarea");
  el.value = value;
  el.setAttribute("readonly", "");
  el.style.position = "fixed";
  el.style.left = "-9999px";
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
}

export function rememberInviteGroup(groupId) {
  if (typeof sessionStorage === "undefined") return;
  const id = String(groupId || "").trim();
  if (!id) return;
  sessionStorage.setItem(INVITE_GROUP_KEY, id);
}

export function peekRememberedInviteGroup() {
  if (typeof sessionStorage === "undefined") return "";
  return sessionStorage.getItem(INVITE_GROUP_KEY) || "";
}

export function takeInviteGroup() {
  if (typeof sessionStorage === "undefined") return "";
  const id = sessionStorage.getItem(INVITE_GROUP_KEY) || "";
  sessionStorage.removeItem(INVITE_GROUP_KEY);
  return id;
}

export function peekInviteGroupFromQuery(query) {
  const raw = query?.inviteGroup;
  return String(Array.isArray(raw) ? raw[0] : raw || "").trim();
}

export function pathAfterLoginWithInvite(inviteGroupId) {
  const id = String(inviteGroupId || "").trim();
  if (!id) return "/?page=badminton&section=ratings";
  const params = new URLSearchParams({
    page: "badminton",
    section: "groups",
  });
  return `/?${params.toString()}`;
}

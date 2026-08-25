export function buildRegistrationUrl() {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const params = new URLSearchParams({
    page: "badminton",
    section: "login",
    autoTg: "1",
  });
  return `${origin}/?${params.toString()}`;
}

export function buildRegistrationShareText() {
  return "Зарегистрируйся в badminton-service через Telegram:";
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

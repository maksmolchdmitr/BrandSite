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
  return "Привет! Залетай в badminton-service 🏸 Матчи, Elo и группы — регистрация через Telegram в один клик.";
}

export function telegramShareUrl(registrationUrl, text) {
  const share = new URL("https://t.me/share/url");
  share.searchParams.set("url", registrationUrl);
  share.searchParams.set("text", text);
  return share.toString();
}

export function openTelegramShare(registrationUrl, text) {
  if (typeof window === "undefined") return;
  window.open(telegramShareUrl(registrationUrl, text), "_blank", "noopener,noreferrer");
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

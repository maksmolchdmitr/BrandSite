const COOKIE_USER_ID = "badminton_user_id";

export function getCookie(name) {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/([$?*|{}\]\\[()^.+])/g, "\\$1")}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : "";
}

export function setCookie(name, value, {days = 365, path = "/"} = {}) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=${path}`;
}

export function deleteCookie(name, {path = "/"} = {}) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
}

export function getLoggedInUserId() {
  return getCookie(COOKIE_USER_ID);
}

export function setLoggedInUserId(userId) {
  if (!userId) {
    deleteCookie(COOKIE_USER_ID);
    return;
  }
  setCookie(COOKIE_USER_ID, userId);
}



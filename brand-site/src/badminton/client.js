import {mockClient} from "@/badminton/mockClient.js";
import {realClient} from "@/badminton/realClient.js";

/**
 * Switch between mock and real API client.
 * Set VITE_BADMINTON_USE_MOCKS=false in .env to use real backend API.
 * If user chose "mock user" on login page while on real API, we use mock for the session (sessionStorage).
 */
const USE_MOCKS = import.meta.env.VITE_BADMINTON_USE_MOCKS !== "false";

const MOCK_SESSION_KEY = "badminton.useMockSession";

function getClient() {
  if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(MOCK_SESSION_KEY)) {
    return mockClient;
  }
  return USE_MOCKS ? mockClient : realClient;
}

export function clearMockSession() {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(MOCK_SESSION_KEY);
  }
}

export const badmintonClient = new Proxy(
  {},
  {
    get(_, prop) {
      const c = getClient();
      const v = c[prop];
      return typeof v === "function" ? v.bind(c) : v;
    },
  }
);

// Log which client is being used
if (import.meta.env.DEV) {
  console.log(`🔧 Badminton client: ${USE_MOCKS ? "MOCK" : "REAL"} API`);
  if (!USE_MOCKS) {
    const apiUrl = import.meta.env.VITE_BADMINTON_API_BASE_URL || "not set";
    console.log(`🔗 API Base URL: ${apiUrl}`);
  }
}



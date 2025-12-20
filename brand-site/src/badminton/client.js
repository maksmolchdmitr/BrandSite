import {mockClient} from "@/badminton/mockClient.js";
import {realClient} from "@/badminton/realClient.js";

/**
 * Switch between mock and real API client.
 * 
 * Set VITE_BADMINTON_USE_MOCKS=false in .env file to use real backend API.
 * Default is true (use mocks).
 */
const USE_MOCKS = import.meta.env.VITE_BADMINTON_USE_MOCKS !== 'false';

export const badmintonClient = USE_MOCKS ? mockClient : realClient;

// Log which client is being used
if (import.meta.env.DEV) {
  console.log(`🔧 Badminton client: ${USE_MOCKS ? 'MOCK' : 'REAL'} API`);
  if (!USE_MOCKS) {
    const apiUrl = import.meta.env.VITE_BADMINTON_API_BASE_URL || 'not set';
    console.log(`🔗 API Base URL: ${apiUrl}`);
  }
}



import {mockClient} from "@/badminton/mockClient.js";

// For now we always use mocks until backend is ready.
// Later we can switch by env flag, e.g. VITE_BADMINTON_USE_MOCKS=false
export const badmintonClient = mockClient;



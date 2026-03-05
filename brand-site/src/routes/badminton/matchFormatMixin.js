import { badmintonClient } from "@/badminton/client.js";

/**
 * Shared logic for formatting match data and loading participant names.
 * Used by BadmintonGamesSingles, BadmintonGamesDoubles, and group match views.
 */
export const matchFormatMixin = {
  data() {
    return {
      participantNames: new Map(),
    };
  },
  methods: {
    getParticipantName(participantId) {
      if (!participantId) return "—";
      return this.participantNames.get(participantId) || participantId;
    },
    getFinalScore(match, side) {
      const games = match?.score?.games || [];
      if (games.length === 0) return "—";
      const lastGame = games[games.length - 1];
      return side === "A" ? lastGame.pointsA : lastGame.pointsB;
    },
    formatDate(dateStr) {
      if (!dateStr) return "—";
      try {
        const d = new Date(dateStr);
        return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
      } catch {
        return dateStr;
      }
    },
    async loadParticipantNames() {
      try {
        const groupsRes = await badmintonClient.getMyGroups();
        const items = groupsRes?.items || [];
        const allParticipants = [];
        for (const g of items) {
          const res = await badmintonClient.listParticipants(g.id, { limit: 500 });
          allParticipants.push(...(res?.items || []));
        }
        this.participantNames = new Map(allParticipants.map((p) => [p.id, p.name]));
      } catch (e) {
        console.warn("Failed to load participant names", e);
      }
    },
  },
};

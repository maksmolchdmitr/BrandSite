import { badmintonClient } from "@/badminton/client.js";

/**
 * Shared logic for formatting match data and loading participant names/photos.
 * Used by BadmintonGames and group match views.
 */
export const matchFormatMixin = {
  data() {
    return {
      participantNames: new Map(),
      participantPhotos: new Map(),
    };
  },
  methods: {
    getParticipantName(participantId) {
      if (!participantId) return "—";
      return this.participantNames.get(participantId) || participantId;
    },
    getParticipantPhoto(participantId) {
      if (!participantId) return "";
      return this.participantPhotos.get(participantId) || "";
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
        if (Number.isNaN(d.getTime()) || d.getTime() === 0) return "—";
        return d.toLocaleString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
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
          const res = await badmintonClient.listAllParticipants(g.id);
          allParticipants.push(...(res?.items || []));
        }
        this.participantNames = new Map(allParticipants.map((p) => [p.id, p.name]));
        this.participantPhotos = new Map(
          allParticipants.filter((p) => p.photoUrl).map((p) => [p.id, p.photoUrl])
        );
      } catch (e) {
        console.warn("Failed to load participant names", e);
      }
    },
  },
};

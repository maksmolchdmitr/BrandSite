import { badmintonClient } from "@/badminton/client.js";

/**
 * Shared logic for formatting match data and loading participant names/photos/usernames.
 * Used by BadmintonGames and group match views.
 */
export const matchFormatMixin = {
  data() {
    return {
      participantNames: new Map(),
      participantPhotos: new Map(),
      participantCrops: new Map(),
      participantUsernames: new Map(),
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
    getParticipantCrop(participantId) {
      if (!participantId) return null;
      return this.participantCrops.get(participantId) || null;
    },
    getParticipantUsername(participantId) {
      if (!participantId) return "";
      return this.participantUsernames.get(participantId) || "";
    },
    mergeMatchPlayers(players) {
      for (const p of players || []) {
        if (!p?.id) continue;
        if (p.name) this.participantNames.set(p.id, p.name);
        if (p.photoUrl) this.participantPhotos.set(p.id, p.photoUrl);
        if (p.photoCrop) this.participantCrops.set(p.id, p.photoCrop);
        if (p.username) this.participantUsernames.set(p.id, p.username);
      }
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
  },
};

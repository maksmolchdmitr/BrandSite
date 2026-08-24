/**
 * Real API client for Badminton Service.
 * Wrapper around api.js to match mockClient interface.
 * Auth: Telegram OAuth → telegramLogin(telegramUser) → Bearer + refresh.
 */

import * as api from "./api.js";
import {
  cachedSearchParticipants,
  invalidateParticipantSearchCache,
} from "./participantSearchCache.js";

export const realClient = {
  // Auth: один вызов — данные от Telegram в telegramLogin
  async telegramLogin(telegramUser) {
    return api.telegramLogin(telegramUser);
  },

  async logout() {
    return api.logout();
  },

  // User endpoints
  async getMe() {
    return api.getMe();
  },

  async updateMe(patch) {
    return api.updateMe(patch);
  },

  async getMyGroups({ limit, pageToken } = {}) {
    return api.getMyGroups({ limit, pageToken });
  },

  async getMyRatings({limit, pageToken} = {}) {
    return api.getMyRatings({limit, pageToken});
  },

  async listMySinglesRatingHistory({ startTime, endTime } = {}) {
    return api.listMySinglesRatingHistory({ startTime, endTime });
  },

  async listMyDoublesRatingHistory({ startTime, endTime } = {}) {
    return api.listMyDoublesRatingHistory({ startTime, endTime });
  },

  async getMySinglesMatchBounds() {
    return api.getMySinglesMatchBounds();
  },

  async getMyDoublesMatchBounds() {
    return api.getMyDoublesMatchBounds();
  },

  async getMyGamesStats() {
    return api.getMyGamesStats();
  },

  async getMySinglesMatches({ groupId, limit, pageToken } = {}) {
    return api.getMySinglesMatches({ groupId, limit, pageToken });
  },

  async getMyDoublesMatches({ groupId, limit, pageToken } = {}) {
    return api.getMyDoublesMatches({ groupId, limit, pageToken });
  },

  async listGroupSinglesMatches(groupId, { limit, pageToken } = {}) {
    return api.listGroupSinglesMatches(groupId, { limit, pageToken });
  },

  async listGroupDoublesMatches(groupId, { limit, pageToken } = {}) {
    return api.listGroupDoublesMatches(groupId, { limit, pageToken });
  },

  // Group endpoints
  async createGroup({name}) {
    return api.createGroup({name});
  },

  async transferGroupOwnership(groupId, {userId}) {
    return api.transferGroupOwnership(groupId, {userId});
  },

  async getGroup(groupId) {
    return api.getGroup(groupId);
  },

  async listMyNotifications({ unread = true, limit, pageToken } = {}) {
    return api.listMyNotifications({ unread, limit, pageToken });
  },

  async markNotificationRead(notificationId) {
    return api.markNotificationRead(notificationId);
  },

  async listLinkUserInviteMatches(notificationId, { kind, limit, pageToken } = {}) {
    return api.listLinkUserInviteMatches(notificationId, { kind, limit, pageToken });
  },

  async respondToInvitation(invitationId, decision) {
    const result = await api.respondToInvitation(invitationId, decision);
    if (decision === "accept") {
      invalidateParticipantSearchCache();
    }
    return result;
  },

  // Participant endpoints
  async listParticipants(groupId, { limit, pageToken } = {}) {
    return api.listParticipants(groupId, { limit, pageToken });
  },

  async listAllParticipants(groupId) {
    return api.listAllParticipants(groupId);
  },

  async searchParticipants(groupId, { query = "", limit = 10, pageToken } = {}) {
    return cachedSearchParticipants(
      (gid, opts) => api.searchParticipants(gid, opts),
      groupId,
      { query, limit, pageToken }
    );
  },

  async searchUsers({ query = "", registeredOnly = false, limit = 10, pageToken } = {}) {
    return api.searchUsers({ query, registeredOnly, limit, pageToken });
  },

  async createParticipant(groupId, {name}) {
    const result = await api.createParticipant(groupId, {name});
    invalidateParticipantSearchCache(groupId);
    return result;
  },

  async createUnlinkedParticipant(groupId, {username, firstName, lastName, photoUrl, photoCrop}) {
    const result = await api.createUnlinkedParticipant(groupId, {
      username,
      firstName,
      lastName,
      photoUrl,
      photoCrop,
    });
    invalidateParticipantSearchCache(groupId);
    return result;
  },

  async updateParticipant(groupId, participantId, {firstName, lastName, photoUrl, photoCrop}) {
    const result = await api.updateParticipant(groupId, participantId, {
      firstName,
      lastName,
      photoUrl,
      photoCrop,
    });
    invalidateParticipantSearchCache(groupId);
    return result;
  },

  async updateParticipantRole(groupId, participantId, {role}) {
    const result = await api.updateParticipantRole(groupId, participantId, {role});
    invalidateParticipantSearchCache(groupId);
    return result;
  },

  async createPhotoUploadUrl(groupId, {contentType, contentLength}) {
    return api.createPhotoUploadUrl(groupId, {contentType, contentLength});
  },

  async uploadParticipantPhoto(groupId, file) {
    const {uploadParticipantPhotoViaPresign} = await import("./photoUpload.js");
    return uploadParticipantPhotoViaPresign(file, (body) =>
      api.createPhotoUploadUrl(groupId, body)
    );
  },

  async deleteParticipant(groupId, participantId) {
    const result = await api.deleteParticipant(groupId, participantId);
    invalidateParticipantSearchCache(groupId);
    return result;
  },

  async linkUserToParticipant(groupId, participantId, {userId}) {
    const result = await api.linkUserToParticipant(groupId, participantId, {userId});
    invalidateParticipantSearchCache(groupId);
    return result;
  },

  // Match endpoints
  async createMatch(groupId, match) {
    return api.createMatch(groupId, match);
  },

  async updateMatch(groupId, matchId, patch, kind) {
    return api.updateMatch(groupId, matchId, patch, kind);
  },

  async deleteMatch(groupId, matchId, kind) {
    return api.deleteMatch(groupId, matchId, kind);
  },

  // Rating endpoints
  async getSinglesLeaderboard(groupId, { limit, pageToken } = {}) {
    return api.getSinglesLeaderboard(groupId, { limit, pageToken });
  },

  async getDoublesLeaderboard(groupId, { limit, pageToken } = {}) {
    return api.getDoublesLeaderboard(groupId, { limit, pageToken });
  },

};


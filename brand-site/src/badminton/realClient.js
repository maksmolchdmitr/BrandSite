/**
 * Real API client for Badminton Service.
 * Wrapper around api.js to match mockClient interface.
 * Auth: Telegram OAuth → telegramLogin(telegramUser) → Bearer + refresh.
 */

import * as api from "./api.js";

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

  async getMyGroups({ limit, pageToken } = {}) {
    return api.getMyGroups({ limit, pageToken });
  },

  async getMyStats({groupId} = {}) {
    return api.getMyStats({groupId});
  },

  async getMyRatings({groupId, limit, pageToken} = {}) {
    return api.getMyRatings({groupId, limit, pageToken});
  },

  async getMyGamesStats({groupId} = {}) {
    return api.getMyGamesStats({groupId});
  },

  // Group endpoints
  async createGroup({name}) {
    return api.createGroup({name});
  },

  async getGroup(groupId) {
    return api.getGroup(groupId);
  },

  // Participant endpoints
  async listParticipants(groupId, { limit, pageToken } = {}) {
    return api.listParticipants(groupId, { limit, pageToken });
  },

  async searchParticipants(groupId, {query = "", page = 0, pageSize = 10} = {}) {
    return api.searchParticipants(groupId, {query, page, pageSize});
  },

  async createParticipant(groupId, {name}) {
    return api.createParticipant(groupId, {name});
  },

  async updateParticipant(groupId, participantId, {name}) {
    return api.updateParticipant(groupId, participantId, {name});
  },

  async deleteParticipant(groupId, participantId) {
    return api.deleteParticipant(groupId, participantId);
  },

  async linkUserToParticipant(groupId, participantId, {userId}) {
    return api.linkUserToParticipant(groupId, participantId, {userId});
  },

  // Match endpoints
  async listMatches(groupId, { from, to, limit, pageToken } = {}) {
    return api.listMatches(groupId, { from, to, limit, pageToken });
  },

  async createMatch(groupId, match) {
    return api.createMatch(groupId, match);
  },

  async updateMatch(groupId, matchId, patch) {
    return api.updateMatch(groupId, matchId, patch);
  },

  async deleteMatch(groupId, matchId) {
    return api.deleteMatch(groupId, matchId);
  },

  // Rating endpoints
  async getSinglesLeaderboard(groupId, { limit, pageToken } = {}) {
    return api.getSinglesLeaderboard(groupId, { limit, pageToken });
  },

  async getDoublesLeaderboard(groupId, { limit, pageToken } = {}) {
    return api.getDoublesLeaderboard(groupId, { limit, pageToken });
  },

  // Stats endpoints
  async getGroupStats(groupId) {
    return api.getGroupStats(groupId);
  },
};


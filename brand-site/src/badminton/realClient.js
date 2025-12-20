/**
 * Real API client for Badminton Service.
 * This is a wrapper around the API functions to match mockClient interface.
 */

import * as api from "./api.js";

export const realClient = {
  // Auth endpoints
  async authTelegramStart({redirectUrl}) {
    return api.authTelegramStart({redirectUrl});
  },

  async authTelegramComplete({state, telegram}) {
    return api.authTelegramComplete({state, telegram});
  },

  async logout() {
    return api.logout();
  },

  // User endpoints
  async getMe() {
    return api.getMe();
  },

  async getMyGroups({limit, cursor} = {}) {
    return api.getMyGroups({limit, cursor});
  },

  async getMyStats({groupId} = {}) {
    return api.getMyStats({groupId});
  },

  async getMyRatings({groupId} = {}) {
    return api.getMyRatings({groupId});
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
  async listParticipants(groupId) {
    return api.listParticipants(groupId);
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
  async listMatches(groupId, {from, to, limit, cursor} = {}) {
    return api.listMatches(groupId, {from, to, limit, cursor});
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
  async getSinglesLeaderboard(groupId) {
    return api.getSinglesLeaderboard(groupId);
  },

  async getDoublesLeaderboard(groupId) {
    return api.getDoublesLeaderboard(groupId);
  },

  // Stats endpoints
  async getGroupStats(groupId) {
    return api.getGroupStats(groupId);
  },
};


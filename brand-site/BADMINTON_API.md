# Badminton Service API

## OpenAPI Specification

The API specification is defined in `public/badminton-service.openapi.yaml` (OpenAPI 3.0.3).

## Generating API Client

To generate a TypeScript client from the OpenAPI specification:

```bash
npm run generate-api-client
```

This will generate the client in `src/badminton/generated/` using the `typescript-axios` generator.

## Current Implementation

Currently, the API client is manually implemented in `src/badminton/api.js` to match the OpenAPI specification. This allows the frontend to work with mock data while the backend is being developed.

When the backend is ready:

1. Run `npm run generate-api-client` to generate the client
2. Update `src/badminton/client.js` to use the generated client instead of `mockClient`
3. Update imports in components to use the real API client

## Mock Data

Mock data is stored in `localStorage` with key `badminton.mockdb.v3`. To reset mock data, clear localStorage or update the `DB_KEY` version in `src/badminton/mockDb.js`.

## API Endpoints

### Authentication
- `POST /auth/telegram/start` - Start Telegram authentication
- `POST /auth/telegram/complete` - Complete Telegram authentication
- `POST /auth/logout` - Logout

### User
- `GET /me` - Get current user profile
- `GET /me/groups` - List user's groups
- `GET /me/stats` - Get user statistics
- `GET /me/ratings` - Get user Elo ratings
- `GET /me/games-stats` - Get user game statistics with recent matches

### Groups
- `GET /groups` - List groups
- `POST /groups` - Create group
- `GET /groups/{groupId}` - Get group details

### Participants
- `GET /groups/{groupId}/participants` - List participants
- `GET /groups/{groupId}/participants/search` - Search participants with pagination
- `POST /groups/{groupId}/participants` - Create participant (admin)
- `PATCH /groups/{groupId}/participants/{participantId}` - Update participant (admin)
- `DELETE /groups/{groupId}/participants/{participantId}` - Delete participant (admin)
- `POST /groups/{groupId}/participants/{participantId}/link-user` - Link user to participant (admin)

### Matches
- `GET /groups/{groupId}/matches` - List matches
- `POST /groups/{groupId}/matches` - Create match (admin)
- `PATCH /groups/{groupId}/matches/{matchId}` - Update match (admin)
- `DELETE /groups/{groupId}/matches/{matchId}` - Delete match (admin)

### Ratings
- `GET /groups/{groupId}/ratings/singles` - Singles leaderboard
- `GET /groups/{groupId}/ratings/doubles` - Doubles leaderboard

### Stats
- `GET /groups/{groupId}/stats` - Group statistics


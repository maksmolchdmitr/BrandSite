# UserGamesStats

Extended user stats with recent matches

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**userId** | **string** |  | [default to undefined]
**singles** | [**StatsBlock**](StatsBlock.md) |  | [default to undefined]
**doubles** | [**StatsBlock**](StatsBlock.md) |  | [default to undefined]
**recentMatches** | [**Array&lt;Match&gt;**](Match.md) | Recent matches involving the user | [default to undefined]

## Example

```typescript
import { UserGamesStats } from './api';

const instance: UserGamesStats = {
    userId,
    singles,
    doubles,
    recentMatches,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)

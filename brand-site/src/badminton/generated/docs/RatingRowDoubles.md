# RatingRowDoubles

Elo for a pair. pairKey can be stable concatenation of sorted participant ids. 

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**rank** | **number** | Place in the leaderboard (1-based) | [default to undefined]
**pairKey** | **string** |  | [default to undefined]
**participantNames** | **Array&lt;string&gt;** |  | [default to undefined]
**elo** | **number** |  | [default to undefined]

## Example

```typescript
import { RatingRowDoubles } from './api';

const instance: RatingRowDoubles = {
    rank,
    pairKey,
    participantNames,
    elo,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)

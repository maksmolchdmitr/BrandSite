# MatchCreateRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**kind** | [**MatchKind**](MatchKind.md) |  | [default to undefined]
**startedAt** | **string** | Match start time. If not provided, backend sets current time. | [optional] [default to undefined]
**notes** | **string** |  | [optional] [default to undefined]
**teamA** | **Array&lt;string&gt;** |  | [default to undefined]
**teamB** | **Array&lt;string&gt;** |  | [default to undefined]
**score** | [**MatchScore**](MatchScore.md) |  | [default to undefined]

## Example

```typescript
import { MatchCreateRequest } from './api';

const instance: MatchCreateRequest = {
    kind,
    startedAt,
    notes,
    teamA,
    teamB,
    score,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)

# ParticipantSearchResult

Paginated search result for participants

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**items** | [**Array&lt;Participant&gt;**](Participant.md) |  | [default to undefined]
**page** | **number** | Current page number (0-based) | [default to undefined]
**pageSize** | **number** | Number of items per page | [default to undefined]
**total** | **number** | Total number of matching participants | [default to undefined]
**hasMore** | **boolean** | Whether there are more pages available | [default to undefined]

## Example

```typescript
import { ParticipantSearchResult } from './api';

const instance: ParticipantSearchResult = {
    items,
    page,
    pageSize,
    total,
    hasMore,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)

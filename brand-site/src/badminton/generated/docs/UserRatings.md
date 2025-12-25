# UserRatings


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**userId** | **string** |  | [default to undefined]
**singlesElo** | **number** | Current singles Elo (in selected group or global aggregation) | [default to undefined]
**doublesByPartner** | [**Array&lt;UserRatingsDoublesByPartnerInner&gt;**](UserRatingsDoublesByPartnerInner.md) | Doubles Elo ratings grouped by partner | [default to undefined]

## Example

```typescript
import { UserRatings } from './api';

const instance: UserRatings = {
    userId,
    singlesElo,
    doublesByPartner,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)

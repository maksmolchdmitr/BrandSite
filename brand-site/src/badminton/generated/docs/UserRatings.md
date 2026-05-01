# UserRatings


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**singlesElo** | **number** | Current singles Elo (aggregated across groups where the user is linked) | [default to undefined]
**doublesByPartner** | [**Array&lt;UserRatingsDoublesByPartnerInner&gt;**](UserRatingsDoublesByPartnerInner.md) | Doubles Elo ratings grouped by partner | [default to undefined]
**doublesByPartnerPageToken** | **string** | Opaque page token for fetching next page of doubles-by-partner ratings | [optional] [default to undefined]

## Example

```typescript
import { UserRatings } from './api';

const instance: UserRatings = {
    singlesElo,
    doublesByPartner,
    doublesByPartnerPageToken,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)

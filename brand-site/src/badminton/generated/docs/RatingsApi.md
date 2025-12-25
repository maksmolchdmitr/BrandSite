# RatingsApi

All URIs are relative to *https://api.example.com*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiGroupsGroupIdRatingsDoublesGet**](#apigroupsgroupidratingsdoublesget) | **GET** /api/groups/{groupId}/ratings/doubles | Doubles Elo leaderboard in group (member-only)|
|[**apiGroupsGroupIdRatingsSinglesGet**](#apigroupsgroupidratingssinglesget) | **GET** /api/groups/{groupId}/ratings/singles | Singles Elo leaderboard in group (member-only)|
|[**apiMeRatingsGet**](#apimeratingsget) | **GET** /api/me/ratings | Current user ratings (singles + doubles)|

# **apiGroupsGroupIdRatingsDoublesGet**
> Array<RatingRowDoubles> apiGroupsGroupIdRatingsDoublesGet()


### Example

```typescript
import {
    RatingsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RatingsApi(configuration);

let groupId: string; // (default to undefined)

const { status, data } = await apiInstance.apiGroupsGroupIdRatingsDoublesGet(
    groupId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **groupId** | [**string**] |  | defaults to undefined|


### Return type

**Array<RatingRowDoubles>**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Leaderboard |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiGroupsGroupIdRatingsSinglesGet**
> Array<RatingRowSingles> apiGroupsGroupIdRatingsSinglesGet()


### Example

```typescript
import {
    RatingsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RatingsApi(configuration);

let groupId: string; // (default to undefined)

const { status, data } = await apiInstance.apiGroupsGroupIdRatingsSinglesGet(
    groupId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **groupId** | [**string**] |  | defaults to undefined|


### Return type

**Array<RatingRowSingles>**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Leaderboard |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiMeRatingsGet**
> UserRatings apiMeRatingsGet()


### Example

```typescript
import {
    RatingsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RatingsApi(configuration);

let groupId: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiMeRatingsGet(
    groupId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **groupId** | [**string**] |  | (optional) defaults to undefined|


### Return type

**UserRatings**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Ratings |  -  |
|**401** | Unauthorized |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


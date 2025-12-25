# MatchesApi

All URIs are relative to *https://api.example.com*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiGroupsGroupIdMatchesGet**](#apigroupsgroupidmatchesget) | **GET** /api/groups/{groupId}/matches | List matches in group (member-only)|
|[**apiGroupsGroupIdMatchesMatchIdDelete**](#apigroupsgroupidmatchesmatchiddelete) | **DELETE** /api/groups/{groupId}/matches/{matchId} | Delete match result (admin-only)|
|[**apiGroupsGroupIdMatchesMatchIdPatch**](#apigroupsgroupidmatchesmatchidpatch) | **PATCH** /api/groups/{groupId}/matches/{matchId} | Update match result (admin-only)|
|[**apiGroupsGroupIdMatchesPost**](#apigroupsgroupidmatchespost) | **POST** /api/groups/{groupId}/matches | Create match result (admin-only)|

# **apiGroupsGroupIdMatchesGet**
> MatchPage apiGroupsGroupIdMatchesGet()


### Example

```typescript
import {
    MatchesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new MatchesApi(configuration);

let groupId: string; // (default to undefined)
let from: string; //Filter by start time (inclusive) (optional) (default to undefined)
let to: string; //Filter by start time (exclusive) (optional) (default to undefined)
let limit: number; // (optional) (default to 50)
let cursor: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiGroupsGroupIdMatchesGet(
    groupId,
    from,
    to,
    limit,
    cursor
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **groupId** | [**string**] |  | defaults to undefined|
| **from** | [**string**] | Filter by start time (inclusive) | (optional) defaults to undefined|
| **to** | [**string**] | Filter by start time (exclusive) | (optional) defaults to undefined|
| **limit** | [**number**] |  | (optional) defaults to 50|
| **cursor** | [**string**] |  | (optional) defaults to undefined|


### Return type

**MatchPage**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Matches page |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiGroupsGroupIdMatchesMatchIdDelete**
> apiGroupsGroupIdMatchesMatchIdDelete()


### Example

```typescript
import {
    MatchesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new MatchesApi(configuration);

let groupId: string; // (default to undefined)
let matchId: string; // (default to undefined)

const { status, data } = await apiInstance.apiGroupsGroupIdMatchesMatchIdDelete(
    groupId,
    matchId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **groupId** | [**string**] |  | defaults to undefined|
| **matchId** | [**string**] |  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** | Deleted |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiGroupsGroupIdMatchesMatchIdPatch**
> Match apiGroupsGroupIdMatchesMatchIdPatch(matchUpdateRequest)


### Example

```typescript
import {
    MatchesApi,
    Configuration,
    MatchUpdateRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new MatchesApi(configuration);

let groupId: string; // (default to undefined)
let matchId: string; // (default to undefined)
let matchUpdateRequest: MatchUpdateRequest; //

const { status, data } = await apiInstance.apiGroupsGroupIdMatchesMatchIdPatch(
    groupId,
    matchId,
    matchUpdateRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **matchUpdateRequest** | **MatchUpdateRequest**|  | |
| **groupId** | [**string**] |  | defaults to undefined|
| **matchId** | [**string**] |  | defaults to undefined|


### Return type

**Match**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Updated match |  -  |
|**400** | Bad request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiGroupsGroupIdMatchesPost**
> Match apiGroupsGroupIdMatchesPost(matchCreateRequest)

Supports singles and doubles.

### Example

```typescript
import {
    MatchesApi,
    Configuration,
    MatchCreateRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new MatchesApi(configuration);

let groupId: string; // (default to undefined)
let matchCreateRequest: MatchCreateRequest; //

const { status, data } = await apiInstance.apiGroupsGroupIdMatchesPost(
    groupId,
    matchCreateRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **matchCreateRequest** | **MatchCreateRequest**|  | |
| **groupId** | [**string**] |  | defaults to undefined|


### Return type

**Match**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Match created |  -  |
|**400** | Bad request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


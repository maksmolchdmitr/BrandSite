# StatsApi

All URIs are relative to *https://api.example.com*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiGroupsGroupIdStatsGet**](#apigroupsgroupidstatsget) | **GET** /api/groups/{groupId}/stats | Group stats (member-only)|
|[**apiMeGamesStatsGet**](#apimegamesstatsget) | **GET** /api/me/games-stats | Current user game statistics with recent matches|
|[**apiMeStatsGet**](#apimestatsget) | **GET** /api/me/stats | Current user stats across all groups (or filter by group)|

# **apiGroupsGroupIdStatsGet**
> GroupStats apiGroupsGroupIdStatsGet()


### Example

```typescript
import {
    StatsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new StatsApi(configuration);

let groupId: string; // (default to undefined)

const { status, data } = await apiInstance.apiGroupsGroupIdStatsGet(
    groupId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **groupId** | [**string**] |  | defaults to undefined|


### Return type

**GroupStats**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Group stats |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiMeGamesStatsGet**
> UserGamesStats apiMeGamesStatsGet()

Returns detailed stats including recent matches list

### Example

```typescript
import {
    StatsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new StatsApi(configuration);

let groupId: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiMeGamesStatsGet(
    groupId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **groupId** | [**string**] |  | (optional) defaults to undefined|


### Return type

**UserGamesStats**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Game stats with recent matches |  -  |
|**401** | Unauthorized |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiMeStatsGet**
> UserStats apiMeStatsGet()


### Example

```typescript
import {
    StatsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new StatsApi(configuration);

let groupId: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiMeStatsGet(
    groupId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **groupId** | [**string**] |  | (optional) defaults to undefined|


### Return type

**UserStats**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Stats |  -  |
|**401** | Unauthorized |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


# StatsApi

All URIs are relative to *https://api.example.com*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiMeGamesStatsGet**](#apimegamesstatsget) | **GET** /api/me/games-stats | Current user aggregate game statistics|
|[**apiMeMatchesDoublesGet**](#apimematchesdoublesget) | **GET** /api/me/matches/doubles | List current user\&#39;s doubles matches (paginated)|
|[**apiMeMatchesSinglesGet**](#apimematchessinglesget) | **GET** /api/me/matches/singles | List current user\&#39;s singles matches (paginated)|

# **apiMeGamesStatsGet**
> UserGamesStats apiMeGamesStatsGet()

Returns win/loss totals for singles and doubles (across all groups the user participates in).

### Example

```typescript
import {
    StatsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new StatsApi(configuration);

const { status, data } = await apiInstance.apiMeGamesStatsGet();
```

### Parameters
This endpoint does not have any parameters.


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
|**200** | Aggregate game stats |  -  |
|**401** | Unauthorized |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiMeMatchesDoublesGet**
> MatchPage apiMeMatchesDoublesGet()

Returns doubles matches where the current user participated (via linked participant), sorted by startedAt descending. Use for \"My games – Doubles\" page. 

### Example

```typescript
import {
    StatsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new StatsApi(configuration);

let limit: number; // (optional) (default to 20)
let pageToken: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiMeMatchesDoublesGet(
    limit,
    pageToken
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **limit** | [**number**] |  | (optional) defaults to 20|
| **pageToken** | [**string**] |  | (optional) defaults to undefined|


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
|**200** | Paginated doubles matches |  -  |
|**401** | Unauthorized |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiMeMatchesSinglesGet**
> MatchPage apiMeMatchesSinglesGet()

Returns singles matches where the current user participated (via linked participant), sorted by startedAt descending. Use for \"My games – Singles\" page. 

### Example

```typescript
import {
    StatsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new StatsApi(configuration);

let limit: number; // (optional) (default to 20)
let pageToken: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiMeMatchesSinglesGet(
    limit,
    pageToken
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **limit** | [**number**] |  | (optional) defaults to 20|
| **pageToken** | [**string**] |  | (optional) defaults to undefined|


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
|**200** | Paginated singles matches |  -  |
|**401** | Unauthorized |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


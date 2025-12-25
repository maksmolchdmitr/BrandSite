# TelegramAuthApi

All URIs are relative to *https://api.example.com*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**logout**](#logout) | **POST** /api/auth/logout | Logout current session (token revocation if supported)|
|[**refreshToken**](#refreshtoken) | **POST** /api/auth/refresh | Generate new access and refresh tokens using refresh token|
|[**telegramLogin**](#telegramlogin) | **POST** /api/auth/telegram/login | Login via Telegram authorization data|

# **logout**
> logout()


### Example

```typescript
import {
    TelegramAuthApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new TelegramAuthApi(configuration);

const { status, data } = await apiInstance.logout();
```

### Parameters
This endpoint does not have any parameters.


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
|**204** | Logged out |  -  |
|**401** | Unauthorized |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **refreshToken**
> TokenResponse refreshToken(refreshRequest)


### Example

```typescript
import {
    TelegramAuthApi,
    Configuration,
    RefreshRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new TelegramAuthApi(configuration);

let refreshRequest: RefreshRequest; //

const { status, data } = await apiInstance.refreshToken(
    refreshRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **refreshRequest** | **RefreshRequest**|  | |


### Return type

**TokenResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successfully refreshed tokens |  -  |
|**400** | Bad request (invalid refresh token) |  -  |
|**401** | Unauthorized (expired or invalid refresh token) |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **telegramLogin**
> TokenResponse telegramLogin(telegramUser)

Returns parameters for Telegram Login Widget and a nonce/state identifier. Client then completes Telegram login and submits payload to `/auth/telegram/complete`. 

### Example

```typescript
import {
    TelegramAuthApi,
    Configuration,
    TelegramUser
} from './api';

const configuration = new Configuration();
const apiInstance = new TelegramAuthApi(configuration);

let telegramUser: TelegramUser; //

const { status, data } = await apiInstance.telegramLogin(
    telegramUser
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **telegramUser** | **TelegramUser**|  | |


### Return type

**TokenResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successfully authenticated |  -  |
|**400** | Bad request |  -  |
|**401** | Authentication failed |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


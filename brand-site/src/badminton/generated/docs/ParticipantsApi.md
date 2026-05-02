# ParticipantsApi

All URIs are relative to *https://api.example.com*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiGroupsGroupIdParticipantsGet**](#apigroupsgroupidparticipantsget) | **GET** /api/groups/{groupId}/participants | List participants in group (member-only)|
|[**apiGroupsGroupIdParticipantsParticipantIdDelete**](#apigroupsgroupidparticipantsparticipantiddelete) | **DELETE** /api/groups/{groupId}/participants/{participantId} | Delete participant (admin-only)|
|[**apiGroupsGroupIdParticipantsParticipantIdLinkUserPost**](#apigroupsgroupidparticipantsparticipantidlinkuserpost) | **POST** /api/groups/{groupId}/participants/{participantId}/link-user | Link registered user to participant (admin-only)|
|[**apiGroupsGroupIdParticipantsParticipantIdPatch**](#apigroupsgroupidparticipantsparticipantidpatch) | **PATCH** /api/groups/{groupId}/participants/{participantId} | Update participant (admin-only)|
|[**apiGroupsGroupIdParticipantsPost**](#apigroupsgroupidparticipantspost) | **POST** /api/groups/{groupId}/participants | Create participant (admin-only)|
|[**apiGroupsGroupIdParticipantsSearchGet**](#apigroupsgroupidparticipantssearchget) | **GET** /api/groups/{groupId}/participants/search | Search participants in group with pagination (member-only)|

# **apiGroupsGroupIdParticipantsGet**
> ParticipantPage apiGroupsGroupIdParticipantsGet()


### Example

```typescript
import {
    ParticipantsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ParticipantsApi(configuration);

let groupId: string; // (default to undefined)
let limit: number; // (optional) (default to 50)
let pageToken: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiGroupsGroupIdParticipantsGet(
    groupId,
    limit,
    pageToken
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **groupId** | [**string**] |  | defaults to undefined|
| **limit** | [**number**] |  | (optional) defaults to 50|
| **pageToken** | [**string**] |  | (optional) defaults to undefined|


### Return type

**ParticipantPage**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Participants |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiGroupsGroupIdParticipantsParticipantIdDelete**
> apiGroupsGroupIdParticipantsParticipantIdDelete()


### Example

```typescript
import {
    ParticipantsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ParticipantsApi(configuration);

let groupId: string; // (default to undefined)
let participantId: string; // (default to undefined)

const { status, data } = await apiInstance.apiGroupsGroupIdParticipantsParticipantIdDelete(
    groupId,
    participantId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **groupId** | [**string**] |  | defaults to undefined|
| **participantId** | [**string**] |  | defaults to undefined|


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

# **apiGroupsGroupIdParticipantsParticipantIdLinkUserPost**
> Participant apiGroupsGroupIdParticipantsParticipantIdLinkUserPost(linkUserRequest)

Binds a registered user (by id) to a participant entry in a group. Useful when participant was created before user registration. 

### Example

```typescript
import {
    ParticipantsApi,
    Configuration,
    LinkUserRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new ParticipantsApi(configuration);

let groupId: string; // (default to undefined)
let participantId: string; // (default to undefined)
let linkUserRequest: LinkUserRequest; //

const { status, data } = await apiInstance.apiGroupsGroupIdParticipantsParticipantIdLinkUserPost(
    groupId,
    participantId,
    linkUserRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **linkUserRequest** | **LinkUserRequest**|  | |
| **groupId** | [**string**] |  | defaults to undefined|
| **participantId** | [**string**] |  | defaults to undefined|


### Return type

**Participant**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Linked participant |  -  |
|**400** | Bad request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not found |  -  |
|**409** | Conflict (e.g. user already linked to another participant in the same group) |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiGroupsGroupIdParticipantsParticipantIdPatch**
> Participant apiGroupsGroupIdParticipantsParticipantIdPatch(participantUpdateRequest)


### Example

```typescript
import {
    ParticipantsApi,
    Configuration,
    ParticipantUpdateRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new ParticipantsApi(configuration);

let groupId: string; // (default to undefined)
let participantId: string; // (default to undefined)
let participantUpdateRequest: ParticipantUpdateRequest; //

const { status, data } = await apiInstance.apiGroupsGroupIdParticipantsParticipantIdPatch(
    groupId,
    participantId,
    participantUpdateRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **participantUpdateRequest** | **ParticipantUpdateRequest**|  | |
| **groupId** | [**string**] |  | defaults to undefined|
| **participantId** | [**string**] |  | defaults to undefined|


### Return type

**Participant**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Updated participant |  -  |
|**400** | Bad request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiGroupsGroupIdParticipantsPost**
> Participant apiGroupsGroupIdParticipantsPost(participantCreateRequest)


### Example

```typescript
import {
    ParticipantsApi,
    Configuration,
    ParticipantCreateRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new ParticipantsApi(configuration);

let groupId: string; // (default to undefined)
let participantCreateRequest: ParticipantCreateRequest; //

const { status, data } = await apiInstance.apiGroupsGroupIdParticipantsPost(
    groupId,
    participantCreateRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **participantCreateRequest** | **ParticipantCreateRequest**|  | |
| **groupId** | [**string**] |  | defaults to undefined|


### Return type

**Participant**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Participant created |  -  |
|**400** | Bad request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not found |  -  |
|**409** | Conflict (e.g. participant with such name already exists in group) |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiGroupsGroupIdParticipantsSearchGet**
> ParticipantPage apiGroupsGroupIdParticipantsSearchGet()

Search participants by name with cursor pagination. Results are sorted alphabetically. Same response shape as listing participants: `items` plus optional opaque `pageToken` for the next page. 

### Example

```typescript
import {
    ParticipantsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ParticipantsApi(configuration);

let groupId: string; // (default to undefined)
let query: string; //Search query (filters by name, case-insensitive) (optional) (default to '')
let limit: number; //Page size (optional) (default to 10)
let pageToken: string; //Opaque cursor for the next page (omit on first request) (optional) (default to undefined)

const { status, data } = await apiInstance.apiGroupsGroupIdParticipantsSearchGet(
    groupId,
    query,
    limit,
    pageToken
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **groupId** | [**string**] |  | defaults to undefined|
| **query** | [**string**] | Search query (filters by name, case-insensitive) | (optional) defaults to ''|
| **limit** | [**number**] | Page size | (optional) defaults to 10|
| **pageToken** | [**string**] | Opaque cursor for the next page (omit on first request) | (optional) defaults to undefined|


### Return type

**ParticipantPage**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Participants search page |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


# ParticipantsApi

All URIs are relative to *https://api.example.com*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiGroupsGroupIdParticipantsGet**](#apigroupsgroupidparticipantsget) | **GET** /api/groups/{groupId}/participants | List participants in group (member-only)|
|[**apiGroupsGroupIdParticipantsParticipantIdDelete**](#apigroupsgroupidparticipantsparticipantiddelete) | **DELETE** /api/groups/{groupId}/participants/{participantId} | Delete participant (admin-only)|
|[**apiGroupsGroupIdParticipantsParticipantIdLinkUserPost**](#apigroupsgroupidparticipantsparticipantidlinkuserpost) | **POST** /api/groups/{groupId}/participants/{participantId}/link-user | Link registered user to participant (admin-only)|
|[**apiGroupsGroupIdParticipantsParticipantIdPatch**](#apigroupsgroupidparticipantsparticipantidpatch) | **PATCH** /api/groups/{groupId}/participants/{participantId} | Update participant (admin-only)|
|[**apiGroupsGroupIdParticipantsSearchGet**](#apigroupsgroupidparticipantssearchget) | **GET** /api/groups/{groupId}/participants/search | Search participants in group with pagination (member-only)|
|[**apiGroupsGroupIdParticipantsSearchPost**](#apigroupsgroupidparticipantssearchpost) | **POST** /api/groups/{groupId}/participants/search | Create participant (admin-only)|

# **apiGroupsGroupIdParticipantsGet**
> Array<Participant> apiGroupsGroupIdParticipantsGet()


### Example

```typescript
import {
    ParticipantsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ParticipantsApi(configuration);

let groupId: string; // (default to undefined)

const { status, data } = await apiInstance.apiGroupsGroupIdParticipantsGet(
    groupId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **groupId** | [**string**] |  | defaults to undefined|


### Return type

**Array<Participant>**

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

# **apiGroupsGroupIdParticipantsSearchGet**
> ParticipantSearchResult apiGroupsGroupIdParticipantsSearchGet()

Search participants by name with pagination. Results are sorted alphabetically. Returns paginated list of participants matching the query. 

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
let page: number; //Page number (0-based) (optional) (default to 0)
let pageSize: number; //Number of items per page (optional) (default to 10)

const { status, data } = await apiInstance.apiGroupsGroupIdParticipantsSearchGet(
    groupId,
    query,
    page,
    pageSize
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **groupId** | [**string**] |  | defaults to undefined|
| **query** | [**string**] | Search query (filters by name, case-insensitive) | (optional) defaults to ''|
| **page** | [**number**] | Page number (0-based) | (optional) defaults to 0|
| **pageSize** | [**number**] | Number of items per page | (optional) defaults to 10|


### Return type

**ParticipantSearchResult**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Paginated participants |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiGroupsGroupIdParticipantsSearchPost**
> Participant apiGroupsGroupIdParticipantsSearchPost(participantCreateRequest)


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

const { status, data } = await apiInstance.apiGroupsGroupIdParticipantsSearchPost(
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


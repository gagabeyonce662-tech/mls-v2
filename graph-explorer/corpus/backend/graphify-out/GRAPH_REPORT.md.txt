# Graph Report - backend  (2026-04-12)

## Corpus Check
- 47 files · ~10,569 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 201 nodes · 374 edges · 39 communities detected
- Extraction: 55% EXTRACTED · 45% INFERRED · 0% AMBIGUOUS · INFERRED: 170 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]

## God Nodes (most connected - your core abstractions)
1. `Property` - 39 edges
2. `AccessToken` - 26 edges
3. `PropertySerializer` - 26 edges
4. `PropertyDetailSerializer` - 25 edges
5. `Room` - 18 edges
6. `Media` - 18 edges
7. `VlogPost` - 13 edges
8. `Command` - 10 edges
9. `VlogCategory` - 10 edges
10. `ExclusivePropertiesAPIView` - 9 edges

## Surprising Connections (you probably didn't know these)
- `Meta` --uses--> `Property`  [INFERRED]
  backend\vlog\serializers.py → backend\mls\models.py
- `Meta` --uses--> `VlogPost`  [INFERRED]
  backend\vlog\serializers.py → backend\vlog\models.py
- `Meta` --uses--> `VlogCategory`  [INFERRED]
  backend\vlog\serializers.py → backend\vlog\models.py
- `RoomInline` --uses--> `Property`  [INFERRED]
  backend\mls\admin.py → backend\mls\models.py
- `MediaInline` --uses--> `Property`  [INFERRED]
  backend\mls\admin.py → backend\mls\models.py

## Communities

### Community 0 - "Community 0"
Cohesion: 0.16
Nodes (26): APIView, AccessToken, Property, PropertyDetailSerializer, PropertySerializer, DDFAPIClient, ExclusivePropertiesAPIView, FetchProperties (+18 more)

### Community 1 - "Community 1"
Cohesion: 0.16
Nodes (19): MediaAdmin, MediaInline, PropertyAdmin, RoomAdmin, RoomInline, fetch_properties(), get_access_token(), This function makes a request to CREA's authentication server and returns     t (+11 more)

### Community 2 - "Community 2"
Cohesion: 0.14
Nodes (11): Meta, VlogCategoryAdmin, VlogPostAdmin, VlogPostAdminForm, Meta, VlogCategory, VlogPost, VlogCategorySerializer (+3 more)

### Community 3 - "Community 3"
Cohesion: 0.22
Nodes (9): GoogleAuthSerializer, LoginSerializer, RegisterSerializer, UserProfileSerializer, get_tokens_for_user(), GoogleAuthView, LoginView, ProfileView (+1 more)

### Community 4 - "Community 4"
Cohesion: 0.2
Nodes (9): BaseCommand, bulk_upsert(), Command, safe_bool(), safe_datetime(), safe_decimal(), safe_int(), safe_list() (+1 more)

### Community 5 - "Community 5"
Cohesion: 0.2
Nodes (5): AbstractBaseUser, BaseUserManager, UserManager, User, PermissionsMixin

### Community 6 - "Community 6"
Cohesion: 0.29
Nodes (4): AppConfig, AccountsConfig, MlsConfig, VlogConfig

### Community 7 - "Community 7"
Cohesion: 0.47
Nodes (5): create_ghl_contact(), _headers(), Creates a new contact in GoHighLevel.     Returns the contact ID on success, No, Updates an existing contact in GoHighLevel.     Accepts keyword args matching G, update_ghl_contact()

### Community 8 - "Community 8"
Cohesion: 0.5
Nodes (1): Migration

### Community 9 - "Community 9"
Cohesion: 0.67
Nodes (2): refresh_access_token(), regenerate_token()

### Community 10 - "Community 10"
Cohesion: 0.67
Nodes (2): main(), Run administrative tasks.

### Community 11 - "Community 11"
Cohesion: 1.0
Nodes (1): ASGI config for backend project.  It exposes the ASGI callable as a module-lev

### Community 12 - "Community 12"
Cohesion: 1.0
Nodes (0): 

### Community 13 - "Community 13"
Cohesion: 1.0
Nodes (1): Django settings for backend project.  Generated by 'django-admin startproject'

### Community 14 - "Community 14"
Cohesion: 1.0
Nodes (1): WSGI config for backend project.  It exposes the WSGI callable as a module-lev

### Community 15 - "Community 15"
Cohesion: 1.0
Nodes (1): Migration

### Community 16 - "Community 16"
Cohesion: 1.0
Nodes (1): Migration

### Community 17 - "Community 17"
Cohesion: 1.0
Nodes (1): Migration

### Community 18 - "Community 18"
Cohesion: 1.0
Nodes (1): Migration

### Community 19 - "Community 19"
Cohesion: 1.0
Nodes (1): Migration

### Community 20 - "Community 20"
Cohesion: 1.0
Nodes (1): Migration

### Community 21 - "Community 21"
Cohesion: 1.0
Nodes (1): Migration

### Community 22 - "Community 22"
Cohesion: 1.0
Nodes (1): Migration

### Community 23 - "Community 23"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "Community 24"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (1): Returns the valid access token if still valid. Otherwise, returns None.

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (1): Regenerates both access token and refresh token and saves them to the database.

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (1): Uses the refresh token to obtain a new access token and refresh token pair.

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Community 32"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **17 isolated node(s):** `Run administrative tasks.`, `Creates a new contact in GoHighLevel.     Returns the contact ID on success, No`, `Updates an existing contact in GoHighLevel.     Accepts keyword args matching G`, `ASGI config for backend project.  It exposes the ASGI callable as a module-lev`, `Django settings for backend project.  Generated by 'django-admin startproject'` (+12 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 11`** (2 nodes): `ASGI config for backend project.  It exposes the ASGI callable as a module-lev`, `asgi.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (2 nodes): `celery.py`, `debug_task()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (2 nodes): `settings.py`, `Django settings for backend project.  Generated by 'django-admin startproject'`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (2 nodes): `wsgi.py`, `WSGI config for backend project.  It exposes the WSGI callable as a module-lev`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (2 nodes): `Migration`, `0004_property_room_media.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (2 nodes): `Migration`, `0005_rename_address_property_above_grade_finished_area_source_and_more.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (2 nodes): `Migration`, `0006_alter_property_property_attached_yn.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (2 nodes): `Migration`, `0007_alter_property_fireplace_yn_and_more.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (2 nodes): `Migration`, `0008_property_category_type.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (2 nodes): `Migration`, `0009_alter_property_category_type.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (2 nodes): `Migration`, `0010_alter_media_media_category_and_more.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (2 nodes): `Migration`, `0011_alter_media_media_category_alter_media_media_url.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (1 nodes): `urls.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (1 nodes): `urls.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (1 nodes): `Returns the valid access token if still valid. Otherwise, returns None.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (1 nodes): `Regenerates both access token and refresh token and saves them to the database.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (1 nodes): `Uses the refresh token to obtain a new access token and refresh token pair.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (1 nodes): `tests.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (1 nodes): `urls.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (1 nodes): `tests.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (1 nodes): `urls.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Property` connect `Community 0` to `Community 9`, `Community 4`, `Community 1`?**
  _High betweenness centrality (0.170) - this node is a cross-community bridge._
- **Why does `Meta` connect `Community 1` to `Community 0`, `Community 2`, `Community 3`?**
  _High betweenness centrality (0.134) - this node is a cross-community bridge._
- **Why does `Command` connect `Community 4` to `Community 0`, `Community 1`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Are the 37 inferred relationships involving `Property` (e.g. with `RoomInline` and `MediaInline`) actually correct?**
  _`Property` has 37 INFERRED edges - model-reasoned connections that need verification._
- **Are the 24 inferred relationships involving `AccessToken` (e.g. with `This function makes a request to CREA's authentication server and returns     t` and `Uses the refresh token to request a new access token and refresh token.`) actually correct?**
  _`AccessToken` has 24 INFERRED edges - model-reasoned connections that need verification._
- **Are the 24 inferred relationships involving `PropertySerializer` (e.g. with `Property` and `Room`) actually correct?**
  _`PropertySerializer` has 24 INFERRED edges - model-reasoned connections that need verification._
- **Are the 24 inferred relationships involving `PropertyDetailSerializer` (e.g. with `Property` and `Room`) actually correct?**
  _`PropertyDetailSerializer` has 24 INFERRED edges - model-reasoned connections that need verification._
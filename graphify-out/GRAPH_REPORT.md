# Graph Report - .  (2026-04-12)

## Corpus Check
- 291 files · ~682,448 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 700 nodes · 1151 edges · 56 communities detected
- Extraction: 85% EXTRACTED · 15% INFERRED · 0% AMBIGUOUS · INFERRED: 170 edges (avg confidence: 0.5)
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
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]

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
- `RoomInline` --uses--> `Property`  [INFERRED]
  backend\mls\admin.py → backend\mls\models.py
- `MediaInline` --uses--> `Property`  [INFERRED]
  backend\mls\admin.py → backend\mls\models.py
- `PropertyAdmin` --uses--> `Property`  [INFERRED]
  backend\mls\admin.py → backend\mls\models.py
- `RoomAdmin` --uses--> `Property`  [INFERRED]
  backend\mls\admin.py → backend\mls\models.py

## Communities

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (2): createErrorProperty(), transformPropertyData()

### Community 1 - "Community 1"
Cohesion: 0.03
Nodes (7): calculateInitialItems(), generateMetadata(), getCity(), getPropertyType(), handleKeyPress(), handleResize(), handleSearch()

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (4): handleKeyPress(), handleSearch(), fetchWordPressPostBySlug(), mapWordPressToVlogPost()

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (37): MediaAdmin, MediaInline, Meta, PropertyAdmin, RoomAdmin, RoomInline, VlogCategoryAdmin, VlogPostAdmin (+29 more)

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (0): 

### Community 5 - "Community 5"
Cohesion: 0.16
Nodes (26): APIView, AccessToken, Property, PropertyDetailSerializer, PropertySerializer, DDFAPIClient, ExclusivePropertiesAPIView, FetchProperties (+18 more)

### Community 6 - "Community 6"
Cohesion: 0.06
Nodes (0): 

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (10): getAddress(), getCity(), getDetailUrl(), getFullAddress(), getPhotos(), getPhotosCount(), getPostalCode(), getPropertyKey() (+2 more)

### Community 8 - "Community 8"
Cohesion: 0.1
Nodes (14): fetchAllExclusiveProperties(), fetchAllLeaseProperties(), fetchAllPreConnProperties(), fetchCompareProperties(), fetchExclusiveProperties(), fetchFilteredProperties(), fetchLeaseProperties(), fetchOntarioProperties() (+6 more)

### Community 9 - "Community 9"
Cohesion: 0.08
Nodes (0): 

### Community 10 - "Community 10"
Cohesion: 0.1
Nodes (4): fetch_properties(), get_access_token(), regenerate_access_token(), regenerate_access_token_with_refresh_token()

### Community 11 - "Community 11"
Cohesion: 0.13
Nodes (3): handleKeyPress(), nextImage(), prevImage()

### Community 12 - "Community 12"
Cohesion: 0.2
Nodes (9): BaseCommand, bulk_upsert(), Command, safe_bool(), safe_datetime(), safe_decimal(), safe_int(), safe_list() (+1 more)

### Community 13 - "Community 13"
Cohesion: 0.25
Nodes (5): AbstractBaseUser, BaseUserManager, UserManager, User, PermissionsMixin

### Community 14 - "Community 14"
Cohesion: 0.36
Nodes (5): addToRemoveQueue(), dispatch(), genId(), reducer(), toast()

### Community 15 - "Community 15"
Cohesion: 0.47
Nodes (5): create_ghl_contact(), _headers(), Creates a new contact in GoHighLevel.     Returns the contact ID on success, No, Updates an existing contact in GoHighLevel.     Accepts keyword args matching G, update_ghl_contact()

### Community 16 - "Community 16"
Cohesion: 0.33
Nodes (0): 

### Community 17 - "Community 17"
Cohesion: 0.6
Nodes (4): AppConfig, AccountsConfig, MlsConfig, VlogConfig

### Community 18 - "Community 18"
Cohesion: 0.67
Nodes (2): formatArea(), formatNumber()

### Community 19 - "Community 19"
Cohesion: 0.5
Nodes (0): 

### Community 20 - "Community 20"
Cohesion: 0.67
Nodes (2): main(), Run administrative tasks.

### Community 21 - "Community 21"
Cohesion: 0.67
Nodes (0): 

### Community 22 - "Community 22"
Cohesion: 1.0
Nodes (1): Migration

### Community 23 - "Community 23"
Cohesion: 1.0
Nodes (1): ASGI config for backend project.  It exposes the ASGI callable as a module-lev

### Community 24 - "Community 24"
Cohesion: 1.0
Nodes (1): Django settings for backend project.  Generated by 'django-admin startproject'

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (1): WSGI config for backend project.  It exposes the WSGI callable as a module-lev

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (1): Migration

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (1): Migration

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (1): Migration

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (1): Migration

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (1): Migration

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (1): Migration

### Community 32 - "Community 32"
Cohesion: 1.0
Nodes (1): Migration

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (1): Migration

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

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (1): Returns the valid access token if still valid. Otherwise, returns None.

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (1): Regenerates both access token and refresh token and saves them to the database.

### Community 41 - "Community 41"
Cohesion: 1.0
Nodes (1): Uses the refresh token to obtain a new access token and refresh token pair.

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Community 43"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "Community 44"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "Community 45"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "Community 46"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "Community 47"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "Community 48"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "Community 49"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "Community 50"
Cohesion: 1.0
Nodes (0): 

### Community 51 - "Community 51"
Cohesion: 1.0
Nodes (0): 

### Community 52 - "Community 52"
Cohesion: 1.0
Nodes (0): 

### Community 53 - "Community 53"
Cohesion: 1.0
Nodes (0): 

### Community 54 - "Community 54"
Cohesion: 1.0
Nodes (0): 

### Community 55 - "Community 55"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **19 isolated node(s):** `Run administrative tasks.`, `Creates a new contact in GoHighLevel.     Returns the contact ID on success, No`, `Updates an existing contact in GoHighLevel.     Accepts keyword args matching G`, `Migration`, `ASGI config for backend project.  It exposes the ASGI callable as a module-lev` (+14 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 22`** (2 nodes): `0001_initial.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (2 nodes): `asgi.py`, `ASGI config for backend project.  It exposes the ASGI callable as a module-lev`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (2 nodes): `settings.py`, `Django settings for backend project.  Generated by 'django-admin startproject'`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (2 nodes): `wsgi.py`, `WSGI config for backend project.  It exposes the WSGI callable as a module-lev`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (2 nodes): `0004_property_room_media.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (2 nodes): `0005_rename_address_property_above_grade_finished_area_source_and_more.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (2 nodes): `0006_alter_property_property_attached_yn.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (2 nodes): `0007_alter_property_fireplace_yn_and_more.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (2 nodes): `0008_property_category_type.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (2 nodes): `0009_alter_property_category_type.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (2 nodes): `0010_alter_media_media_category_and_more.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (2 nodes): `0011_alter_media_media_category_alter_media_media_url.py`, `Migration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (2 nodes): `debug-api.js`, `testApi()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (2 nodes): `loading.tsx`, `Loading()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (2 nodes): `robots.ts`, `robots()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (2 nodes): `ClientReviews.tsx`, `ReviewCard()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (2 nodes): `brandA.config.ts`, `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (1 nodes): `Returns the valid access token if still valid. Otherwise, returns None.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (1 nodes): `Regenerates both access token and refresh token and saves them to the database.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (1 nodes): `Uses the refresh token to obtain a new access token and refresh token pair.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (1 nodes): `tests.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (1 nodes): `next.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (1 nodes): `postcss.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (1 nodes): `tailwind.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (1 nodes): `LatestArticles.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (1 nodes): `PopularNeighborhoods.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (1 nodes): `RecentListings.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (1 nodes): `aspect-ratio.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (1 nodes): `collapsible.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (1 nodes): `PropertyBasicInfo.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (1 nodes): `eslint.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (1 nodes): `App.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Command` connect `Community 12` to `Community 3`, `Community 5`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `Property` connect `Community 5` to `Community 3`, `Community 12`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `Room` connect `Community 3` to `Community 12`, `Community 5`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Are the 37 inferred relationships involving `Property` (e.g. with `RoomInline` and `MediaInline`) actually correct?**
  _`Property` has 37 INFERRED edges - model-reasoned connections that need verification._
- **Are the 24 inferred relationships involving `AccessToken` (e.g. with `This function makes a request to CREA's authentication server and returns     t` and `Uses the refresh token to request a new access token and refresh token.`) actually correct?**
  _`AccessToken` has 24 INFERRED edges - model-reasoned connections that need verification._
- **Are the 24 inferred relationships involving `PropertySerializer` (e.g. with `Property` and `Room`) actually correct?**
  _`PropertySerializer` has 24 INFERRED edges - model-reasoned connections that need verification._
- **Are the 24 inferred relationships involving `PropertyDetailSerializer` (e.g. with `Property` and `Room`) actually correct?**
  _`PropertyDetailSerializer` has 24 INFERRED edges - model-reasoned connections that need verification._
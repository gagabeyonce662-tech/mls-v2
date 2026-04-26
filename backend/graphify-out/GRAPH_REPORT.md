# Graph Report - S:\mls-v2\backend  (2026-04-26)

## Corpus Check
- 63 files · ~45,627 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 308 nodes · 824 edges · 43 communities detected
- Extraction: 40% EXTRACTED · 60% INFERRED · 0% AMBIGUOUS · INFERRED: 498 edges (avg confidence: 0.55)
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

## God Nodes (most connected - your core abstractions)
1. `Property` - 75 edges
2. `PropertySerializer` - 63 edges
3. `PropertyDetailSerializer` - 57 edges
4. `AccessToken` - 56 edges
5. `MapAggregateCell` - 44 edges
6. `UserFeedbackSerializer` - 36 edges
7. `AISummaryGenerationError` - 34 edges
8. `Media` - 23 edges
9. `Room` - 22 edges
10. `VlogPost` - 17 edges

## Surprising Connections (you probably didn't know these)
- `Meta` --uses--> `Property`  [INFERRED]
  S:\mls-v2\backend\vlog\serializers.py → S:\mls-v2\backend\mls\models.py
- `Meta` --uses--> `VlogPost`  [INFERRED]
  S:\mls-v2\backend\vlog\serializers.py → S:\mls-v2\backend\vlog\models.py
- `Meta` --uses--> `VlogCategory`  [INFERRED]
  S:\mls-v2\backend\vlog\serializers.py → S:\mls-v2\backend\vlog\models.py
- `RoomInline` --uses--> `Property`  [INFERRED]
  S:\mls-v2\backend\mls\admin.py → S:\mls-v2\backend\mls\models.py
- `MediaInline` --uses--> `Property`  [INFERRED]
  S:\mls-v2\backend\mls\admin.py → S:\mls-v2\backend\mls\models.py

## Communities

### Community 0 - "Community 0"
Cohesion: 0.15
Nodes (60): AISummaryGenerationError, APIView, AccessToken, MapAggregateCell, Property, PropertyDetailSerializer, PropertySerializer, UserFeedbackSerializer (+52 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (22): Meta, VlogCategoryAdmin, VlogPostAdmin, VlogPostAdminForm, BaseCommand, clean_markdown_content(), Command, normalize_text() (+14 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (17): build_summary_prompt(), _extract_google_error(), generate_listing_summary(), _generate_with_model(), is_summary_complete(), Exception, fetch_properties(), fetch_properties_by_property_data() (+9 more)

### Community 3 - "Community 3"
Cohesion: 0.16
Nodes (21): MediaAdmin, MediaInline, PropertyAdmin, RoomAdmin, RoomInline, UserFeedbackAdmin, This function makes a request to CREA's authentication server and returns     t, Uses the refresh token to request a new access token and refresh token. (+13 more)

### Community 4 - "Community 4"
Cohesion: 0.18
Nodes (14): GoogleAuthSerializer, LoginSerializer, RegisterSerializer, UserProfileSerializer, create_ghl_contact(), _headers(), Creates a new contact in GoHighLevel.     Returns the contact ID on success, No, Updates an existing contact in GoHighLevel.     Accepts keyword args matching G (+6 more)

### Community 5 - "Community 5"
Cohesion: 0.15
Nodes (11): get_resolution_for_zoom(), _iter_active_property_coordinates(), rebuild_h3_aggregates(), bulk_upsert(), Command, safe_bool(), safe_datetime(), safe_decimal() (+3 more)

### Community 6 - "Community 6"
Cohesion: 0.22
Nodes (5): AbstractBaseUser, BaseUserManager, UserManager, User, PermissionsMixin

### Community 7 - "Community 7"
Cohesion: 0.29
Nodes (4): AppConfig, AccountsConfig, MlsConfig, VlogConfig

### Community 8 - "Community 8"
Cohesion: 0.5
Nodes (1): Migration

### Community 9 - "Community 9"
Cohesion: 0.67
Nodes (2): main(), Run administrative tasks.

### Community 10 - "Community 10"
Cohesion: 0.67
Nodes (0): 

### Community 11 - "Community 11"
Cohesion: 1.0
Nodes (1): ASGI config for backend project.  It exposes the ASGI callable as a module-lev

### Community 12 - "Community 12"
Cohesion: 1.0
Nodes (1): Django settings for backend project.  Generated by 'django-admin startproject'

### Community 13 - "Community 13"
Cohesion: 1.0
Nodes (1): WSGI config for backend project.  It exposes the WSGI callable as a module-lev

### Community 14 - "Community 14"
Cohesion: 1.0
Nodes (1): Migration

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
Nodes (1): Migration

### Community 24 - "Community 24"
Cohesion: 1.0
Nodes (1): Migration

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (1): Migration

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (1): Migration

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (1): Migration

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (0): 

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
Nodes (1): Returns the valid access token if still valid. Otherwise, returns None.

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (1): Regenerates both access token and refresh token and saves them to the database.

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (1): Uses the refresh token to obtain a new access token and refresh token pair.

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Community 41"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **23 isolated node(s):** `Run administrative tasks.`, `Creates a new contact in GoHighLevel.     Returns the contact ID on success, No`, `Updates an existing contact in GoHighLevel.     Accepts keyword args matching G`, `ASGI config for backend project.  It exposes the ASGI callable as a module-lev`, `Django settings for backend project.  Generated by 'django-admin startproject'` (+18 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 11`** (2 nodes): `ASGI config for backend project.  It exposes the ASGI callable as a module-lev`, `asgi.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (2 nodes): `settings.py`, `Django settings for backend project.  Generated by 'django-admin startproject'`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (2 nodes): `wsgi.py`, `WSGI config for backend project.  It exposes the WSGI callable as a module-lev`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (2 nodes): `Migration`, `0004_property_room_media.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (2 nodes): `Migration`, `0005_rename_address_property_above_grade_finished_area_source_and_more.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (2 nodes): `Migration`, `0006_alter_property_property_attached_yn.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (2 nodes): `Migration`, `0007_alter_property_fireplace_yn_and_more.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (2 nodes): `Migration`, `0008_property_category_type.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (2 nodes): `Migration`, `0009_alter_property_category_type.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (2 nodes): `Migration`, `0010_alter_media_media_category_and_more.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (2 nodes): `Migration`, `0011_alter_media_media_category_alter_media_media_url.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (2 nodes): `Migration`, `0012_media_media_file_property_is_featured_and_more.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (2 nodes): `Migration`, `0013_mapaggregatecell.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (2 nodes): `Migration`, `0014_property_ai_summary_fields.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (2 nodes): `Migration`, `0015_rename_mls_mapaggr_resolut_52c0de_idx_mls_mapaggr_resolut_46a66b_idx_and_more.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (2 nodes): `Migration`, `0016_userfeedback.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (2 nodes): `Migration`, `0002_vlogpost_is_manual.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (1 nodes): `check_db_counts.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (1 nodes): `check_images.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (1 nodes): `test_cloudinary.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (1 nodes): `urls.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (1 nodes): `Returns the valid access token if still valid. Otherwise, returns None.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (1 nodes): `Regenerates both access token and refresh token and saves them to the database.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (1 nodes): `Uses the refresh token to obtain a new access token and refresh token pair.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (1 nodes): `tests.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Property` connect `Community 0` to `Community 1`, `Community 2`, `Community 3`, `Community 5`?**
  _High betweenness centrality (0.150) - this node is a cross-community bridge._
- **Why does `Meta` connect `Community 3` to `Community 0`, `Community 1`, `Community 4`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Why does `PropertySerializer` connect `Community 0` to `Community 2`, `Community 3`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Are the 73 inferred relationships involving `Property` (e.g. with `RoomInline` and `MediaInline`) actually correct?**
  _`Property` has 73 INFERRED edges - model-reasoned connections that need verification._
- **Are the 61 inferred relationships involving `PropertySerializer` (e.g. with `Property` and `Room`) actually correct?**
  _`PropertySerializer` has 61 INFERRED edges - model-reasoned connections that need verification._
- **Are the 56 inferred relationships involving `PropertyDetailSerializer` (e.g. with `Property` and `Room`) actually correct?**
  _`PropertyDetailSerializer` has 56 INFERRED edges - model-reasoned connections that need verification._
- **Are the 54 inferred relationships involving `AccessToken` (e.g. with `This function makes a request to CREA's authentication server and returns     t` and `Uses the refresh token to request a new access token and refresh token.`) actually correct?**
  _`AccessToken` has 54 INFERRED edges - model-reasoned connections that need verification._
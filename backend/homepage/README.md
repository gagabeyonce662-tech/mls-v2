# homepage app

Backend for the v3 homepage sections that the MLS feed alone can't serve. Mounted at `/api/home/`.

## Setup

```bash
python manage.py migrate homepage
python manage.py seed_homepage_content     # incentives, news sources, community photos (idempotent)
python manage.py refresh_homepage_feeds    # first fill of news, market snapshot, sold-below-purchase
```

Review the seeded buyer incentives in admin (**Homepage › Buyer incentives**) before launch. Add source links and set "reviewed at" for each. They come from the HomeAtlasUI reference and contain no source links. The CMHC shared-equity program in that list stopped taking applications in 2024.

## Endpoints

| Path | Method | Auth | Source |
|---|---|---|---|
| `incentives/` · `partners/` · `community-images/` | GET | public | admin content |
| `news/?limit=` | GET | public | RSS, ingested by job |
| `investor-picks/?limit=&city=` | GET | public | local catalogue: sale listings + rental comps |
| `deals/?limit=` | GET | public | AMPRE price drops (503 if upstream down) |
| `sold-below-purchase/?limit=&city=` | GET | public | table filled by nightly job |
| `market-snapshot/` | GET | public | table refreshed by job (503 if never computed and AMPRE down) |
| `nearby-activity/?lat=&lng=&radius_km=` | GET | public | local catalogue, new listings in the last 30 days |
| `newsletter/subscribe/` | POST | optional | stores CASL consent and sends a welcome email |
| `nearby-alerts/` | GET, POST | required | alerts always go to the account's own email |
| `nearby-alerts/<id>/` | DELETE | required | |
| `unsubscribe/` | POST | public | `{kind: newsletter\|nearby, token}` |

## Jobs

| Job | Suggested schedule | Command |
|---|---|---|
| News ingest | hourly | `refresh_homepage_feeds --only news` |
| Market snapshot | every 6 h | `refresh_homepage_feeds --only market` |
| Sold below last purchase | nightly | `refresh_homepage_feeds --only sold-below` |
| Neighbour alerts email | daily | `refresh_homepage_feeds --only nearby-alerts` |

- **Celery:** set `HOMEPAGE_BEAT_ENABLED=1` to add these to beat (see `backend/settings.py`).
- **No worker (e.g. Vercel):** call the commands from cron.

## Method notes

- **Rental yield**: the median asking rent of at least 3 active rentals in the same city with the same bedroom count, widening to ±1 bedroom if needed.
  - Rentals are listings with a monthly `total_actual_rent` and no `list_price`.
  - Cap rate subtracts 4% vacancy, property tax, condo fees and 1% maintenance.
  - The API returns this method as `calc_basis`; the UI must show it.
  - Only 1–5 bedroom residential listings are considered.
- **Deals**: active residential listings with `ListPrice < OriginalListPrice`, ranked by percentage cut. Cuts under 2% or over 40% are discarded as noise or data errors.
- **Sold below last purchase**: repeat sales of the same street address (unit included) in AMPRE's closed history, which covers roughly 1–2 years.
  - Resales within 60 days are ignored.
  - Losses over 45% are treated as data errors.
- **Market snapshot**: residential closed sales across `GTA_CITIES`, the last 30 days against the 30 before. It uses the same median, days-on-market and sale-to-list maths as `market/sold-trends/`.

## Tests

`python manage.py test homepage`. These are pure-function tests with no database, so they run anywhere.

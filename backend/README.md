# Backend configuration

## Estate image uploads

EstateProperty featured and gallery uploads require Cloudinary. Set either
`CLOUDINARY_URL` or all of `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and
`CLOUDINARY_API_SECRET`. `ESTATE_IMAGE_MAX_UPLOAD_MB` is optional and defaults
to `10`.

An uploaded featured image is returned as `featured_image_url`; imported legacy
URLs remain supported and are used when no uploaded asset exists.

## AI search and listing summaries (OpenAI)

Set these in `.env.local` locally and in the Vercel project settings. Only
`OPENAI_API_KEY` is required; without it AI search quietly falls back to a
keyword search and listing summaries return a clear error.

| Variable | Default | Used for |
|---|---|---|
| `OPENAI_API_KEY` | — | Everything below |
| `OPENAI_SEARCH_MODEL` | `gpt-4.1-mini` | Sentence → filters (`POST /api/mls/ai-search/parse/`) |
| `OPENAI_SUMMARY_MODEL` | `gpt-4.1-mini` | Listing summaries; comma-separated list is tried in order |
| `OPENAI_EMBEDDING_MODEL` | `text-embedding-3-small` | "Best match" ranking |
| `OPENAI_EMBEDDING_DIMENSIONS` | `512` | Vector size (changing it re-embeds everything) |
| `AI_SEARCH_ANON_RATE` / `AI_SEARCH_USER_RATE` | `30/hour` / `120/hour` | Rate limits per guest IP / per account |

Use model names your OpenAI project has access to. Every parse is logged in
admin under **AI search logs** (query, filters, tokens, latency, fallbacks).

**Embeddings.** Run `python manage.py embed_listings` after each DDF sync (it
only calls OpenAI for listings whose text changed). Until it has run, "Best
match" simply keeps newest-first order. Search results are ranked with
`GET /api/mls/properties/filter/?orderby=relevance&semantic=<text>`; ranking
never removes listings, and covers the first 2,000 filtered matches.

## Required secrets

`settings.py` has no hardcoded credentials. Set these in `backend/.env.local`
(local, gitignored) or the deployment environment; see `.env.example`:

- `DATABASE_URL` — startup fails with a clear error if missing
- `DDF_CLIENT_ID`, `DDF_CLIENT_SECRET` — CREA DDF listing sync
- `AMPRE_ODATA_BEARER_TOKEN` — TRREB sold data (Market Trends, homepage feeds)

## Scheduled jobs (celery beat)

`docker-compose.yml` runs one `celery-beat` service. Each job only runs when
its flag is `1`:

| Flag | Job | When (UTC) |
|---|---|---|
| `DAILY_NEWSLETTER_BEAT_ENABLED` | Daily listing newsletter | `DAILY_NEWSLETTER_HOUR_UTC` (11:00) |
| `HOMEPAGE_BEAT_ENABLED` | News, market snapshot, sold-below-purchase, neighbour alerts | hourly to daily |
| `SOLD_TRENDS_WARM_BEAT_ENABLED` | Rebuild Market Trends sold data (8 cities + GTA) | every 4h |
| `SAVED_SEARCH_ALERTS_BEAT_ENABLED` | Saved-search alert emails (daily/weekly per search) | `SAVED_SEARCH_ALERTS_HOUR_UTC` (12:30) |

Beat and the web app must share a cache (`CACHE_URL`, Redis); with the local
in-memory fallback, warmed data is invisible to the web process.

Without celery, run the same jobs from cron:
`manage.py send_daily_listing_newsletters`, `manage.py refresh_homepage_feeds`,
`manage.py warm_sold_trends`, `manage.py send_saved_search_alerts`.

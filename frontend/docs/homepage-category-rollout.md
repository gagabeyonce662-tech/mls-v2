# Homepage Category Rollout Checklist

## Feature Flag
- `NEXT_PUBLIC_ENABLE_DYNAMIC_HOMEPAGE_CATEGORIES=false` by default.
- Enable only in staging first.

## Stage 1: Internal Validation
- Turn flag on in staging.
- Confirm top category order and visibility thresholds.
- Verify fallback works by simulating backend category fetch failure.

## Stage 2: Limited Exposure
- Enable flag for a small production slice via environment split.
- Track these events in browser logs/collector:
  - `homepage_category_impression`
  - `homepage_category_click`
  - `homepage_category_view_all`

## Stage 3: Full Rollout
- Validate CTR and listing-open trends are stable or improved.
- Enable for 100% traffic.
- Keep fallback and kill-switch flag available.

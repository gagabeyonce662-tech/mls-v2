---
description: Project conventions and coding guidelines for the MLS frontend
---

# MLS Frontend Conventions

## Design System

- **ALWAYS** import from `@/config/design-system` — never hardcode colors, spacing, or typography.
- Use the `colors` object for inline `style={}` values.
- Use the `propertyCard` token block for all card-related decisions (status colors, currency, layout, animation).
- Use `colorStyles` for Tailwind className strings.
- Currency is **CAD** (`en-CA` locale). Never use USD.

## Property Data

- **ALWAYS** use the normalized helpers from `@/lib/propertyUtils.ts` to access `Property` fields.
- The API returns both `snake_case` and `PascalCase` field names — the normalizer handles this.
- Never access `property.city` or `property.City` directly — use `getCity(property)`.
- If you need a new accessor, add it to `propertyUtils.ts`, not inline.

## Component Rules

- Check `.agent/workflows/component-registry.md` before creating any new component.
- Use **`PropertyCard`** for any property listing card — never build cards inline.
- Use **`Container`** for page-width wrappers — never write `max-w-[1320px] mx-auto px-4 lg:px-6 xl:px-8` by hand.
- Shared/reusable components go in `components/`. Page-specific ones go in `components/homepage/`, `components/listing/`, etc.
- shadcn/ui primitives live in `components/ui/` — do not edit them directly.

## File Organization

```
config/           → Design tokens, brand config
lib/              → API client, utilities, property normalizer
hooks/            → React Query hooks, custom hooks
contexts/         → React context providers
components/       → Shared components (PropertyCard, Container, Header, Footer)
components/ui/    → shadcn/ui primitives (auto-generated, do not edit)
components/homepage/  → Homepage-specific sections
components/listing/   → Listing detail page components
components/map/       → Map search components
components/blog/      → Blog components
app/(root)/       → Page routes
```

## Code Style

- All components are `"use client"` unless they are server components.
- Use `lucide-react` for icons — never import from other icon libraries.
- Animations go in `globals.css` as `@keyframes` — never use `<style jsx global>`.
- Use `as const` on exported config objects for type safety.
- Prefer named exports for utilities, default exports for components.

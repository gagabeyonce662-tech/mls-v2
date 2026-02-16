# Sizing & Spacing Overhaul — Walkthrough

**Date:** February 16, 2026  
**Scope:** Homepage layout, typography system, section spacing, property card sizing  
**Goal:** Shift the site from "dense listing portal" density → "premium Canadian realtor brand" density

---

## The Problem

The site had three sizing issues that made it feel more like a cheap property aggregator than a premium realtor's personal brand:

1. **Container width was 1800px** — way too wide. Content stretched edge-to-edge on large monitors, making text hard to read and the layout feel unfocused.
2. **Section spacing was 12–16px** (`mt-3`, `mt-4`) — sections were crammed together with almost no breathing room, creating visual clutter.
3. **Typography used fixed pixel values** — headings broke or felt wrong at different zoom levels (very common on Windows where many users browse at 125% zoom).

---

## Where Real Estate Sites Sit on the Density Spectrum

Different types of websites use different levels of visual density:

```
Most spacious ←————————————————————→ Most dense

Portfolio → SaaS Marketing → Real Estate Search → E-commerce → Dashboard
```

A **real estate search platform** (like this one) sits between SaaS marketing sites and e-commerce. It needs to:
- Feel **premium and trustworthy** (houses are high-value purchases)
- Display **multiple listings efficiently** (users browse and compare)
- Keep **text readable** for property descriptions

The key rule for real estate: **"Make it 20% more spacious than you think."**

---

## Change 1: Container Width — 1800px → 1320px

### Files changed
- `app/(root)/page.tsx` — all wrapper `<div>` elements
- `components/homepage/LocationsSection.tsx` — internal container

### What was wrong
The `max-w-[1800px]` container let content span nearly the full width of a monitor. On a 1920px-wide screen, content was 1800px wide with only 60px of margin on each side.

### Why 1320px
- **1280–1320px** is the standard container width for real estate and SaaS marketing sites
- Sites like Zillow, Realtor.ca, and Redfin all use containers in this range
- Wider containers make text lines too long (80+ characters), which hurts readability
- The narrower container also creates generous side margins that make the design feel premium

### The exception
Map-based search pages (like `/map-search`) can legitimately be wider since maps need horizontal space. This change only applies to the homepage and content-focused pages.

### Before vs After
```
Before: |——————————————— 1800px ———————————————|  (feels cheap, hard to scan)
After:  |     |———————— 1320px ————————|     |  (focused, premium, readable)
```

---

## Change 2: Section Spacing — 12–16px → 48–96px (fluid)

### Files changed
- `app/globals.css` — added `.section-gap` and `.section-gap-sm` utility classes
- `app/(root)/page.tsx` — replaced `mt-3` / `mt-4` with `section-gap` classes
- All listing components — increased internal `py-8` (32px) → `py-12` (48px)
- `ClientReviews.tsx` — increased `py-8` → `py-16`

### What was wrong
Major homepage sections (Featured Collections → Listings → Locations → Mortgage → Reviews) were separated by only `mt-3` (12px) or `mt-4` (16px). That's the spacing you'd use between items *inside* a card, not between entire page sections.

### The design principle
Professional web design uses a consistent spacing hierarchy:

| Element | Typical spacing |
|---------|----------------|
| Between items inside a component | 8–16px |
| Between components in a section | 16–32px |
| **Between major page sections** | **64–120px on desktop, 48–80px on mobile** |

Our sections were using "inside a component" spacing (12–16px) for "between major sections" — collapsing the visual hierarchy.

### Why fluid spacing with clamp()
Instead of using fixed breakpoints, we use CSS `clamp()`:

```css
.section-gap {
  margin-top: clamp(3rem, 6vw, 6rem); /* 48px on mobile → 96px on desktop */
}
```

This means:
- On a **375px mobile screen**: sections are 48px apart (compact but breathable)
- On a **768px tablet**: sections are ~60px apart (scaling up smoothly)
- On a **1440px desktop**: sections are 96px apart (generous and premium)

No breakpoints needed. It just scales.

### Why this matters for real estate specifically
Whitespace = perceived premium quality. When a user is considering a $500,000+ purchase, the site needs to feel calm, trustworthy, and high-end. Cramped layouts unconsciously signal "budget" or "spam" to users.

---

## Change 3: Fluid Typography — Fixed px → clamp() with rem

### Files changed
- `tailwind.config.ts` — all `ds-h*` font size definitions
- `config/design-system.ts` — typography token definitions

### What was wrong
All heading sizes were defined in fixed pixels:
```
ds-h1: 48px
ds-h2: 40px
ds-h3: 32px
```

This creates two problems:

1. **Zoom breakage**: Many Windows users browse at 110%–150% zoom. Fixed pixel layouts don't respond well to this — text overflows containers, layouts break, and the experience feels broken.

2. **No responsive scaling**: A 48px heading that looks perfect on a 1440px monitor is comically large on a 375px phone. You'd need multiple breakpoints to handle this manually.

### The solution: clamp()
```
Before: font-size: 48px;
After:  font-size: clamp(2rem, 4vw, 3rem);
```

How `clamp(minimum, preferred, maximum)` works:
- **Minimum (2rem / 32px)**: The heading never goes below this, even on tiny screens
- **Preferred (4vw)**: The heading scales with the viewport width (4% of screen width)
- **Maximum (3rem / 48px)**: The heading caps at this size on large screens

### Why rem instead of px
- `1rem` = the user's browser font size setting (usually 16px)
- When a user zooms to 125%, `rem` values scale up proportionally
- `px` values stay fixed even when the user zooms, fighting against their accessibility preference

### The full scale
| Token | Before | After | Behavior |
|-------|--------|-------|----------|
| `ds-h1` | `48px` | `clamp(2rem, 4vw, 3rem)` | 32px → 48px fluid |
| `ds-h2` | `40px` | `clamp(1.75rem, 3.5vw, 2.5rem)` | 28px → 40px fluid |
| `ds-h3` | `32px` | `clamp(1.5rem, 3vw, 2rem)` | 24px → 32px fluid |
| `ds-h4` | `24px` | `clamp(1.25rem, 2vw, 1.5rem)` | 20px → 24px fluid |
| `ds-h5` | `20px` | `clamp(1.125rem, 1.5vw, 1.25rem)` | 18px → 20px fluid |
| `ds-text` | `16px` | `1rem` | Scales with browser zoom |
| `ds-body` | `14px` | `0.875rem` | Scales with browser zoom |

---

## Change 4: Body Line-Height — 1.5 → 1.6

### Files changed
- `app/globals.css` — `body` rule
- `tailwind.config.ts` — `ds-text` and `ds-body` line-height values
- `config/design-system.ts` — typography token line-heights

### Why
Line-height 1.5 is the minimum for readable body text. Bumping to 1.6 provides:
- More space between lines, making paragraphs less fatiguing to read
- A subtle "premium" feel — luxury brands and high-end sites consistently use 1.5–1.7
- Better readability for property descriptions, which can be dense with details

This is a small change that most users won't consciously notice, but it contributes to the overall feeling that the site is "easy to read" and "well-designed."

---

## Change 5: Property Card Price Size — text-xl (20px) → text-2xl (24px)

### Files changed
- `components/homepage/FeaturedListings.tsx`
- `components/homepage/NewlyListedListings.tsx`
- `components/homepage/RentalProperties.tsx`
- `components/homepage/PreConstructionProperties.tsx`

### Why
On a real estate listing card, users scan in this order:

1. **Photo** → 2. **Price** → 3. **Location** → 4. **Beds/Baths**

Price needs to be the **most visually dominant text element** on the card. At `text-xl` (20px), the price was the same visual weight as the property title — not dominant enough.

At `text-2xl` (24px) with `font-bold`, the price now clearly wins the visual hierarchy:

```
Property type in City        ← 16px, semibold (secondary)
$749,000                     ← 24px, bold (DOMINANT)
🛏 3 Beds  🛁 2 Baths        ← 14px, normal (tertiary)
```

The recommended range for property prices on card UIs is **22–28px**. We chose 24px as a good middle ground.

---

## Change 6: Prose Width Utility

### Files changed
- `app/globals.css` — added `.prose-width` class

### What it does
```css
.prose-width {
  max-width: 65ch;
}
```

This constrains any text block to ~65 characters per line — the scientifically optimal range for reading comfort (60–75 characters).

### Why it exists
This utility isn't applied anywhere automatically yet, but it's available for use on:
- Property description text on detail pages
- Blog post content
- About page content
- Any long-form text

Without this constraint, paragraphs inside the 1320px container would span ~100+ characters per line on desktop, which is too wide for comfortable reading.

### How to use it
```tsx
<p className="prose-width">
  This beautiful 3-bedroom home features an open-concept layout...
</p>
```

---

## Summary of the Design Philosophy

Every change follows one core principle from the ChatGPT conversation:

> **Real estate search sits between SaaS marketing and e-commerce on the density spectrum — but should lean toward premium, spacious presentation.**

The specific rules applied:

| Rule | Implementation |
|------|---------------|
| Container width 1200–1320px | `max-w-[1320px]` on all homepage wrappers |
| Section spacing 80–120px desktop | `.section-gap` with `clamp(3rem, 6vw, 6rem)` |
| Price visually dominant (22–28px) | `text-2xl font-bold` on all card prices |
| Body text minimum 16px | `ds-text` (1rem) as the body standard |
| Line-height 1.5–1.7 for body | `line-height: 1.6` globally |
| Paragraph width 60–75 characters | `.prose-width` utility at `65ch` |
| Fluid typography with clamp() | All headings use `clamp(min, preferred, max)` |
| rem over px for zoom safety | All typography tokens in rem |

---

## What To Watch For

After these changes, keep an eye on:

1. **The filter sidebar**: At 1320px max-width, the sidebar + 3-column grid should still fit comfortably. If it feels cramped, the sidebar width (`w-72` / `w-80`) could be reduced slightly.

2. **Map search page**: If this page also uses `1800px` containers, that might be *intentional* since maps benefit from width. Review separately.

3. **Listing detail pages**: These weren't modified in this pass. They may still have inconsistent spacing or wide containers.

4. **Mobile testing**: The `clamp()` values should handle mobile gracefully, but verify that section spacing doesn't feel excessive on very small screens (375px).

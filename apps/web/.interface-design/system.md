# Job Tracker — Design System Notes

## Direction and feel
Nuxt UI (v4) as the design system — don't hand-roll controls or reinvent tokens it already provides. Product feel: quiet, functional, data-dense but not cluttered. Spanish/English mixed copy (existing convention): section headers and page chrome lean English ("Dashboard", "Market trends"), inline content/toasts/empty-states lean Spanish. Follow whichever convention the surrounding text already uses rather than picking one globally.

## Brand
- Primary accent: green (`primary: 'green'` in `app.config.ts`), custom Nuxt-brand ramp defined in `app/assets/css/main.css` (`--color-green-50..950`, base `#00DC82`/500 `#00C16A`/700 `#007F45`).
- Neutral: `neutral: 'neutral'` (Nuxt UI default gray scale).
- One accent used with intention — green means "the brand / the primary metric," not decoration. Don't introduce a second accent hue for structural UI.

## Depth strategy
Borders-only, via Nuxt UI's `border-default` token and `UCard`'s default `outline` variant (`ring ring-default divide-y divide-default`). No custom shadows added. Consistent with existing `TopProfileCard.vue` pattern.

## Spacing
Follows Tailwind's default scale via Nuxt UI component padding (`UCard` header/body = `p-4 sm:p-6` by default). Page sections use `space-y-8`, section-internal stacks `space-y-4`. Grids use `gap-4`.

## Charting (dataviz)
Library: `nuxt-charts` (wraps `vue-chrts`/`@unovis`) — already installed, no new chart deps. Components are client-only (`mode: 'client'` in the module); always wrap chart usage in `<ClientOnly>` with a `USkeleton` fallback sized to the chart's height, since these render nothing during SSR.

- **Sequential (magnitude) data** — job counts by location: single hue (green), light→dark, via `app/utils/colorScale.ts` (`sequentialColor`, `sequentialSize`). Size scaling is `sqrt`-based (area-proportional), not linear.
- **Categorical (identity) data** — work mode (remote/hybrid/onsite/unknown): fixed hue order, validated separately per color-mode surface with the dataviz skill's `validate_palette.js` (not an automatic light→dark flip):
  - Light: remote `#00C16A`, hybrid `#3B82F6`, onsite `#F59E0B`, unknown `#9CA3AF` (neutral, intentionally below chroma floor — it's the "no data" bucket).
  - Dark: remote `#007F45`, hybrid `#2563EB`, onsite `#D97706`, unknown `#71717A`.
  - Switch via `useColorMode()` (from `@nuxtjs/color-mode`, bundled with Nuxt UI — no extra install).
  - These are hardcoded hex, deliberately **not** bound to Nuxt UI's `success`/`info`/`warning` semantic tokens — those are reserved for actual status/severity meaning and shouldn't be reused for an unrelated categorical dimension.
- Single-series charts (timeline, skills bar): `hide-legend` — the card title already names the series; a legend box would be redundant per dataviz rules.
- Multi-series (work-mode donut): legend always shown (Nuxt UI's default bottom-center), since color-only identity needs a visible label per dataviz rules.

## Map pattern
`DottedMap` from `nuxt-charts` for a minimalist geo view — no topojson/geojson assets needed (self-contained). Pattern: neutral dot-grid texture (component default `var(--ui-text-dimmed)`, left untouched) + colored/sized pins overlaid at known centroids, sized/colored via the sequential scale above. Paired with a ranked list (rank number, label, count, thin proportional bar) alongside the map for exact numbers — the map is the ambient/gestalt view, the list is the precise one. Toggle between scopes (e.g. "México" / "Mundo") via `UTabs` (`size="xs"`, item shape `{ label, value }`, `v-model` bound to the active scope).

Empty-state layering: don't collapse straight to "no data" just because nothing is geocodable — separately check "no data at all" vs. "have data but couldn't plot it" (unmatched location names still count and list, they just don't get a map pin).

## Key component patterns
- **Chart card** — `UCard` with `#header` containing an `h3.font-semibold.text-highlighted` title + `p.text-xs.text-muted.mt-0.5` subtitle (count/context line), body holds the chart wrapped in `ClientOnly`. Every chart card has an explicit empty state (`v-if="!hasData"`, centered, `text-sm text-muted`, fixed height matching the chart's height so the card doesn't jump).
- **Ranked list row** (location map) — `rank (tabular-nums, muted, ~14px) · label (14px/500/highlighted, truncate) · count (14px/600/highlighted, tabular-nums)` on one line, with a 6px-tall rounded proportional bar underneath colored via the sequential scale.
- **AI insight callout** — `UCard` with icon+title header (`i-lucide-sparkles`, primary color), body stacks: summary paragraph → tag groups (`UBadge variant="subtle"`, primary for hot technologies, neutral for emerging roles) → salary note (bordered top, icon-prefixed) → recommendations list (bordered top, arrow-icon bullets).
- **Section stat line** — instead of a stat-tile card grid, a single muted `text-xs tabular-nums` line next to the section `h2` (e.g. "77 ofertas · 12 con descripción · últimos 30 días"). Reserve `UCard` stat tiles for when a number truly needs to be the page's focal point — don't default to a card-per-number grid.

## Layout hierarchy (dashboard "Market trends" section)
1. Section header + inline stat line (not stat cards).
2. Location map — full width, first, since it's the requested centerpiece.
3. `grid lg:grid-cols-3`: timeline chart (col-span-2) + work-mode donut (col-span-1).
4. `grid lg:grid-cols-3`: skills bar chart (col-span-2) + AI insights card (col-span-1).

Varying the grid split (not a uniform N-equal-card grid) is deliberate — it's what gives the section rhythm instead of reading as a flat stat wall.

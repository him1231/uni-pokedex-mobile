## Plan: Revamp uni-pokedex-mobile into a Pokémon Champions Battle-Prep Workspace

> **Planning Confidence**: High — All four open questions resolved. Champions availability sourced from Polygon (186 species + regionals + 59 Megas). TypeScript, zh-Hant, and form-tab decisions confirmed. Plan is fully actionable.

### Overview

The current app is a monolithic single-page Pokédex (~750-line `App.jsx`, no routing, no caching, no TypeScript). The revamp rebuilds it across six milestones into a Champions-first battle-prep workspace: TypeScript throughout, React Router, TanStack Query caching, virtualized list, a Champions-curated dex (186 species + regionals + 59 Megas), full detail pages with form tabs, a compare board, team builder with type matchup matrix, and a HOME transfer checker. Scope: **Large**.

---

### Context & Requirements

- **Goal**: Rebuild `uni-pokedex-mobile` as a Champions-first battle-prep workspace with TypeScript, proper routing, team-building tools, and accurate Champions availability data.
- **Scope**: Large — full architectural overhaul (TypeScript migration, routing, component decomposition, data layer expansion, 5 new page surfaces)
- **Acceptance Criteria**:
  - [ ] TypeScript throughout — all new and migrated files are `.ts`/`.tsx`; zero `any` in new code
  - [ ] Multi-page routing: `/` (Dex), `/pokemon/:id`, `/moves`, `/abilities`, `/team`, `/home-checker`
  - [ ] Champions dex shows exactly the 186 curated species + regional forms (sourced from Polygon list); non-Champions Pokémon visually marked as unavailable
  - [ ] Pokémon detail page includes: sprite, types, stats, abilities, evolution chain, moves, type-effectiveness chart, HOME transfer eligibility, and a **form/Mega tab strip** for forms and Mega Evolutions
  - [ ] MoveDex and AbilityDex are standalone pages (not modals)
  - [ ] Team builder: 6 slots, persisted, with type coverage table and weakness matrix
  - [ ] Compare board: 2–6 Pokémon side-by-side, stat highlighting
  - [ ] HOME transfer checker page using curated data
  - [ ] TanStack Query caching — no duplicate API calls for same resource
  - [ ] List virtualized (no 1000+ DOM nodes)
  - [ ] All UI copy/labels in zh-Hant
  - [ ] All existing features preserved (search, gen/type/version filters, sort, favorites)
  - [ ] Keyboard-navigable, WCAG AA contrast throughout
- **Hard Constraints**:
  - GitHub Pages deployable (`BASE_URL` pattern preserved)
  - React 19 / Vite stack (no framework swap)
  - zh-Hant as sole UI language for all labels and navigation
- **Soft Constraints**: No paid APIs; PokeAPI + manually curated JSON only
- **Assumptions**:
  - `[CONFIRMED]` Champions availability = 186 specific species + regional forms + 59 Megas per Polygon list (not 1–1025)
  - `[CONFIRMED]` TypeScript migration: yes — all new and migrated files in `.ts`/`.tsx`
  - `[CONFIRMED]` zh-Hant only for all UI labels
  - `[CONFIRMED]` Mega Evolutions and regional forms shown as tabs within Pokémon detail page
  - `[ASSUMED]` Tailwind CSS v4 adopted — *Rationale: mobile-first, design tokens built-in, full revamp scope justifies it*
  - `[ASSUMED]` HOME transfer routes will be manually authored — *Rationale: PokeAPI has no Champions-specific data; Polygon confirms all 186 are transferable via HOME*
  - `[ASSUMED] ⚠️ HIGH-RISK` VP recruiting/training cost data is not publicly available in structured form — *VP Planner scoped to Milestone 5 as a static guide; defer if data unavailable*

---

### Research Summary

- **Closest Existing Pattern**: App.jsx — all current overlay/filter/detail logic; direct migration target
- **Key Files**:
  - App.jsx — 750-line God component to decompose
  - pokeapi.js — live fetch helpers → migrate to `.ts` + TanStack Query hooks
  - versionExclusives.js — Champions/version filter → replace with curated species set
  - pokedex-summary.json — needs base stats; needs `isChampionsLegal` boolean
  - abilities-summary.json — missing `generationLabel` (known bug to fix)
  - build_datasets.py — extend for stats, ability gen, and Champions flags
  - vite.config.js — add `@/` alias and TypeScript support
- **Existing Patterns to Follow**:
  - `import.meta.env.BASE_URL` prefix on all local JSON fetches — must be preserved
  - `Promise.all` parallel fetch in `pokeapi.js` — keep, type with generics
  - `localStorage` key `ufavs` — migrate to Zustand persist store
  - Type badge color convention (`type-${slug}` CSS class) — standardize as Tailwind variant map
- **External Dependencies to add**: `react-router-dom@7`, `@tanstack/react-query@5`, `zustand@5`, `tailwindcss@4`, `react-window` + `@types/react-window`, TypeScript dev deps
- **Champions Data Facts**:
  - **186 base species** in the game (per Polygon, confirmed April 8 2026)
  - Includes **regional forms** (Alolan, Galarian, Hisuian, Paldean) for many species
  - **59 Mega Evolutions** available
  - All 186 can be recruited in-game **or** transferred via Pokémon HOME
  - Species range from Gen 1 (Venusaur #3) to Gen 9 (Hydrapple #1019) — not contiguous, not a range

---

### Implementation Steps

#### Milestone 1: Foundation — TypeScript, Tooling, Routing, Architecture

1. **Set up TypeScript and install all new dependencies**
   - **Files**: package.json, vite.config.js, new `tsconfig.json`, new `tsconfig.node.json`
   - **What to do**: Add TypeScript (`typescript`, `@types/react`, `@types/react-dom`, `@types/react-window`). Change vite.config.js to `vite.config.ts`. Add `react-router-dom@7`, `@tanstack/react-query@5`, `zustand@5`, `tailwindcss@4`, `react-window`. Configure `tsconfig.json` with strict mode, `"jsx": "react-jsx"`, and `"@/*": ["src/*"]` path alias. Configure Tailwind v4 in global CSS (`@import "tailwindcss"`). Add `@/` alias in `vite.config.ts`. Rename eslint.config.js to use TypeScript-aware rules.
   - **Dependencies**: None
   - **Effort**: S
   - **Complexity**: Low
   - **Risks**: Tailwind v4 uses CSS-first config — no `tailwind.config.js`; follow v4 docs precisely. TypeScript strict mode will surface existing implicit `any` in migrated files — treat as warnings not blockers during migration.

2. **Define shared TypeScript types**
   - **Files**: new `src/types/pokemon.ts`, `src/types/moves.ts`, `src/types/abilities.ts`, `src/types/workspace.ts`
   - **What to do**: Define interfaces for all data shapes used across the app: `PokemonSummary` (static JSON entry), `PokemonDetail` (live API response), `MoveEntry`, `AbilityEntry`, `TeamSlot`, `CompareSet`, `TypeEffectiveness`, `HomeTransferRoute`. These types are the contract between the data layer and UI — all hooks and components will import from here. Base on actual field names observed in the current JSON datasets and `pokeapi.js` return shapes.
   - **Dependencies**: Step 1
   - **Effort**: S
   - **Complexity**: Low
   - **Risks**: Align `PokemonSummary` carefully with the expanded JSON schema from Step 6 (stats fields) to avoid a breaking type change mid-plan

3. **Create the route skeleton and persistent layout**
   - **Files**: new `src/routes/index.tsx`, new `src/components/layout/NavBar.tsx`, new `src/components/layout/Layout.tsx`, updated `src/main.tsx` (rename from `.jsx`)
   - **What to do**: Define 6 routes with `createBrowserRouter`: `/`(圖鑑), `/pokemon/:id`(寶可夢詳情), `/moves`(招式圖鑑), `/abilities`(特性圖鑑), `/team`(隊伍), `/home-checker`(HOME轉移). Set `basename={import.meta.env.BASE_URL}` on the router to preserve GitHub Pages compatibility. `Layout.tsx` renders a sticky bottom `<nav>` (zh-Hant labels) with 5 tab icons + an `<Outlet>`. All nav items must have `aria-label` and keyboard focus rings.
   - **Dependencies**: Steps 1–2
   - **Effort**: M
   - **Complexity**: Medium
   - **Risks**: GitHub Pages 404 on hard-refresh for client-side routes — add a `404.html` redirect script (standard GitHub Pages SPA workaround) to public

4. **Extract data-fetching custom hooks (wrap in TanStack Query)**
   - **Files**: new `src/hooks/usePokemonList.ts`, `usePokemonDetail.ts`, `useMoveDetail.ts`, `useAbilityDetail.ts`, `useTypeEffectiveness.ts`; updated `src/lib/pokeapi.ts` (rename + type)
   - **What to do**: Migrate `pokeapi.js` → `pokeapi.ts`, typing all return values against `src/types/`. Wrap each fetch function in a typed `useQuery` hook. Cache keys: `['pokemon', id]`, `['move', id]`, `['ability', id]`, `['type', slug]`. `usePokemonList` loads all three local JSON files on mount via `useQuery` with `staleTime: Infinity` (static data never stale). `usePokemonDetail(id)` chains pokemon → species → evolution in one query function using `Promise.all` where parallel, serial where dependent (evolution URL from species). Set `QueryClient` default `staleTime` of 24h for live API calls.
   - **Dependencies**: Steps 1–2
   - **Effort**: M
   - **Complexity**: Medium
   - **Risks**: Evolution chain fetch is serial (species → chain URL → chain data) — must be kept as serial awaits inside the query function to preserve correctness

5. **Decompose App.jsx into typed page components and shared UI**
   - **Files**: new `src/pages/DexPage.tsx`, `MoveDexPage.tsx`, `AbilityDexPage.tsx`, `PokemonDetailPage.tsx`, `TeamBuilderPage.tsx`, `HomeCheckerPage.tsx`; new `src/components/ui/TypeBadge.tsx`, `SearchBar.tsx`, `FilterPanel.tsx`, `StatBar.tsx`; updated `src/components/pokemon/PokemonCard.tsx`; App.jsx reduced to `<RouterProvider>`
   - **What to do**: Move each overlay's JSX out of `App.jsx` into its corresponding page file. Extract repeated UI fragments into typed shared components: `TypeBadge` (takes `typeSlug: string`, renders colored pill), `SearchBar`, `FilterPanel`, `StatBar`. Keep `PokemonCard` prop contract identical — only rename to `.tsx` and add prop types. After this step `App.tsx` should be under 20 lines. **Critical**: Do not refactor any filter/sort logic during this move — copy it verbatim, add types only.
   - **Dependencies**: Steps 2–4
   - **Effort**: L
   - **Complexity**: High
   - **Risks**: Highest regression risk in the plan. Move code first, type it second. Manually verify all 6 version filters, gen filter, type filter, search, sort, and favorites after completion.

6. **Add list virtualization to the Dex page**
   - **Files**: src/pages/DexPage.tsx
   - **What to do**: Wrap the filtered `PokemonSummary[]` array in `react-window`'s `FixedSizeGrid` for a 2-column mobile grid. Card height must be fixed — measure the rendered card height and lock it as a constant. Pass `itemKey={(_idx, data) => data.list[_idx].id}` to avoid reconciliation issues during filter state changes. Import `VariableSizeGrid` if cards with different content heights are needed, otherwise `FixedSizeGrid` is simpler.
   - **Dependencies**: Step 5
   - **Effort**: M
   - **Complexity**: Medium
   - **Risks**: `react-window` requires integer pixel dimensions for rows/columns — responsive layouts must pick a breakpoint-specific card height. Test at 375px and 768px widths.

**Milestone 1 subtotal**: ~2 days

---

#### Milestone 2: Champions Data Layer

7. **Author the Champions availability data module**
   - **Files**: new `src/data/championsAvailability.ts`, updated versionExclusives.js → `versionExclusives.ts`
   - **What to do**: Create `championsAvailability.ts` exporting: (1) `CHAMPIONS_SPECIES_IDS: ReadonlySet<number>` — the exact 186 species IDs from the Polygon list (manually transcribed: #3, #6, #9, #15, #18, #24, #25, #26... through #1019); (2) `CHAMPIONS_REGIONAL_FORMS: ReadonlySet<string>` — slugs for all regional forms in the list (e.g. `"raichu-alola"`, `"ninetales-alola"`, etc.); (3) `CHAMPIONS_MEGA_FORMS: ReadonlySet<string>` — slugs for all 59 Megas; (4) `isChampionsLegal(speciesId: number): boolean` helper. Migrate `versionExclusives.js` to `.ts` and adjust to use `isChampionsLegal`. **Remove the old 1–1025 assumption entirely.**
   - **Dependencies**: Step 2
   - **Effort**: M
   - **Complexity**: Low (coding) / Medium (data transcription from Polygon)
   - **Risks**: The Polygon list uses species IDs — verify each entry maps correctly to the PokeAPI `speciesId` field. Regional forms and Megas share speciesId with their base (e.g. Alolan Raichu is speciesId 26, slug `raichu-alola`). Test edge cases: Paldean Tauros (3 combat forms, all speciesId 128).

8. **Expand the Python dataset builder — stats, ability gen, Champions flags**
   - **Files**: build_datasets.py, pokedex-summary.json, abilities-summary.json
   - **What to do**: (1) Add base stats to `pokedex-summary.json`: read `pokemon_stats.csv` and emit `hp`, `atk`, `def`, `spa`, `spd`, `spe`, `bst` per entry. (2) Fix `abilities-summary.json`: read `ability.csv` for `generation_id`, emit `generationId` + `generationLabel`. (3) Add `isChampionsLegal: boolean` to each `pokedex-summary.json` entry using the Champions species ID set from Step 7. Regenerate all three files and commit. Expected size increase: ~120KB for stats fields across 1025 entries.
   - **Dependencies**: Step 7
   - **Effort**: M
   - **Complexity**: Low
   - **Risks**: Stats CSV rows use `pokemon_id` (form-specific, matches `id` not `speciesId`) — join carefully for default-form entries. Test stat totals against known values (e.g. Chansey BST = 450).

9. **Author the HOME transfer routes dataset**
   - **Files**: new `public/data/home-transfer-routes.json`, updated `src/types/pokemon.ts`
   - **What to do**: Manually author `home-transfer-routes.json` as an array of `HomeTransferRoute` typed objects: `{ speciesId: number, slug: string, nameZhHant: string, methods: Array<{ fromGame: string, labelZhHant: string, notes: string }> }`. Cover the three confirmed Champions-compatible paths: (1) Pokémon HOME direct deposit, (2) Pokémon GO → HOME → Champions, (3) Legends: Z-A promotional transfers. All 186 species are eligible via HOME; annotate any that require specific steps. Add a top-level `lastUpdated` field for display on the HOME checker page.
   - **Dependencies**: Steps 2, 7
   - **Effort**: M
   - **Complexity**: Low (coding) / Medium (research accuracy)
   - **Risks**: Transfer restriction details may change post-launch. Displaying `lastUpdated` prominently and noting it is community-maintained mitigates trust issues.

10. **Surface Champions legality on Dex page cards and filter panel**
    - **Files**: src/pages/DexPage.tsx, src/components/pokemon/PokemonCard.tsx
    - **What to do**: Add `isChampionsLegal: boolean` to `PokemonCard` props. Render a small ⚔️ Champions badge on legal cards; apply a `opacity-40 grayscale` Tailwind class to unavailable Pokémon. Add a "僅Champions" toggle filter button to `FilterPanel` alongside the existing version filters. The default filter state should show all Pokémon (not Champions-only) to preserve backward compatibility.
    - **Dependencies**: Steps 6–8
    - **Effort**: S
    - **Complexity**: Low
    - **Risks**: None identified

**Milestone 2 subtotal**: ~1–1.5 days

---

#### Milestone 3: Core Lookup — Detail Page, MoveDex, AbilityDex

11. **Build the Pokémon detail page with form/Mega tabs (`/pokemon/:id`)**
    - **Files**: src/pages/PokemonDetailPage.tsx, new `src/components/pokemon/FormTabStrip.tsx`, `StatBars.tsx`, `EvolutionChain.tsx`, `TypeEffectivenessChart.tsx`, `MoveTable.tsx`
    - **What to do**: Route param `id` is the `speciesId`. Fetch via `usePokemonDetail(id)`. Render a scrollable page with sticky header (sprite + name + types). Sections: **Form Tabs** — tab strip showing available forms for this species that appear in `CHAMPIONS_REGIONAL_FORMS` or `CHAMPIONS_MEGA_FORMS` (e.g. Raichu → [通常, 阿羅拉], Charizard → [通常, Mega X, Mega Y]); switching tabs re-fetches detail for that form's slug. **Stats** — bar chart from expanded static JSON (Step 8), not live API. **Abilities** — list with hidden ability labeled; each ability chips navigates to `/abilities#slug`. **Moves** — from `MoveSections` (S/V only, existing logic). **Type Effectiveness** — 6-bucket defensive chart. **HOME Transfer** — reads `home-transfer-routes.json` for this speciesId; shows routes or a 不可轉移 notice. **Evolution chain** — chips navigate to `/pokemon/:id` via `<Link>`. **Champions status** — prominent badge at top if legal.
    - **Dependencies**: Steps 4, 7, 8, 9
    - **Effort**: L
    - **Complexity**: High
    - **Risks**: Form tabs require knowing which forms exist per species — derive from `CHAMPIONS_REGIONAL_FORMS` and `CHAMPIONS_MEGA_FORMS` sets, not from a live API forms call, to avoid an extra round-trip per page open.

12. **Build the MoveDex page (`/moves`)**
    - **Files**: src/pages/MoveDexPage.tsx, new `src/components/moves/MoveRow.tsx`, `MoveDetailPanel.tsx`
    - **What to do**: Port current MoveDex overlay logic to a standalone typed page. Filters: name search (zh/en), type, damage class, generation. Use `useMemo` on `moves` from `usePokemonList`. Fix the ability gen filter — now works after Step 8 rebuilds `abilities-summary.json`. Virtualize the list with `react-window` `FixedSizeList`. Clicking a move row expands `MoveDetailPanel` inline via `useMoveDetail(id)`. All labels zh-Hant.
    - **Dependencies**: Steps 4–6, 8
    - **Effort**: M
    - **Complexity**: Medium
    - **Risks**: None identified

13. **Build the AbilityDex page (`/abilities`)**
    - **Files**: src/pages/AbilityDexPage.tsx, new `src/components/abilities/AbilityRow.tsx`
    - **What to do**: Port current AbilityDex overlay to a standalone typed page. Filters: name search, generation. Fix gen filter (Step 8). Clicking an ability expands an inline detail panel via `useAbilityDetail(id)`. Add a "擁有此特性的寶可夢" count from the API `pokemonCount` field, linked to a pre-filtered Dex view.
    - **Dependencies**: Steps 4–6, 8
    - **Effort**: M
    - **Complexity**: Medium
    - **Risks**: None identified

**Milestone 3 subtotal**: ~1–1.5 days

---

#### Milestone 4: Workspace Layer — Pins, Compare Board, Team Builder

14. **Create the Zustand workspace store with localStorage persistence**
    - **Files**: new `src/store/workspaceStore.ts`
    - **What to do**: Zustand store with typed slices: `pins: Set<number>`, `recents: number[]` (max 10, FIFO), `team: (number | null)[]` (len 6), `compareSet: number[]` (max 6). Actions: `addPin`, `removePin`, `addRecent`, `setTeamSlot`, `clearTeamSlot`, `addToCompare`, `removeFromCompare`, `clearCompare`. Use Zustand `persist` middleware with `localStorage`, serializing `Set` as array. **Migration**: on first hydration, read existing `ufavs` key → populate `pins`, then delete `ufavs`. Store keys: `upins`, `uteam`, `ucompare`, `urecent`.
    - **Dependencies**: Step 1
    - **Effort**: M
    - **Complexity**: Medium
    - **Risks**: Zustand `persist` cannot serialize `Set` natively — use a custom `serialize`/`deserialize` in the `persist` config that converts Set ↔ Array

15. **Add workspace action buttons to cards and detail page**
    - **Files**: src/components/pokemon/PokemonCard.tsx, src/pages/PokemonDetailPage.tsx
    - **What to do**: Add icon buttons to `PokemonCard` (visible on hover/focus): 📌 pin toggle, ⚔️ add to team. On `PokemonDetailPage`: prominent "加入隊伍" and "加入比較" CTAs in the sticky header. All buttons consume Zustand actions from Step 14. Trigger `addRecent(speciesId)` on `PokemonDetailPage` mount. All buttons have `aria-label` in zh-Hant.
    - **Dependencies**: Steps 5, 11, 14
    - **Effort**: S
    - **Complexity**: Low
    - **Risks**: None identified

16. **Build the Team Builder page (`/team`) with coverage and weakness matrix**
    - **Files**: src/pages/TeamBuilderPage.tsx, new `src/components/team/TeamSlot.tsx`, `TypeCoverageTable.tsx`, `WeaknessMatrix.tsx`
    - **What to do**: Render 6 `TeamSlot` components from the store. Each slot shows sprite, zh-Hant name, types, and a 移除 button; empty slots show a "+" placeholder. Below the slots: (1) `TypeCoverageTable` — 18 offensive types × whether any team member has a same-type attack bonus move of that type (requires move data from `usePokemonDetail` for each slot — load lazily). (2) `WeaknessMatrix` — rows = 18 attacking types, columns = 6 team slots; cells = effectiveness multiplier (4×/2×/1×/0.5×/0.25×/0×) color-coded; data from cached `useTypeEffectiveness`. Show a "最近瀏覽" row above for quick additions. Gate the matrix calculation behind a "分析隊伍" button to avoid 36+ API calls on mount.
    - **Dependencies**: Steps 4, 10, 14–15
    - **Effort**: L
    - **Complexity**: High
    - **Risks**: Weakness matrix for 6 Pokémon requires type effectiveness data for all 6 simultaneously. TanStack Query will batch-cache, but first-time analysis on a cold cache triggers up to 36 concurrent `useTypeEffectiveness` queries. The "分析隊伍" button defers this until the user explicitly requests it.

17. **Build the Compare Board**
    - **Files**: new `src/components/team/CompareBoard.tsx`, integrated into src/pages/TeamBuilderPage.tsx as a bottom section (or accessible via a tab on that page)
    - **What to do**: Render the `compareSet` (2–6 Pokémon) as a sticky-header comparison table. Columns = Pokémon; rows = sprite, types, HP, 攻擊, 防禦, 特攻, 特防, 速度, BST. Stat cells highlight max value (green background) and min value (red background) per row. Abilities and top-5 moves by power as additional rows. Each column has a 移除 and a link to `/pokemon/:id`. Stats come from expanded static JSON (Step 8) — no live API call needed for stats.
    - **Dependencies**: Steps 14–16
    - **Effort**: L
    - **Complexity**: High
    - **Risks**: Requires stats in static JSON (Step 8). If Step 8 is not complete, stat rows show loading skeletons. Do not block this step on Step 8 — build the component with optional stat props.

**Milestone 4 subtotal**: ~1.5–2 days

---

#### Milestone 5: Battle Tools — HOME Checker & VP Planner

18. **Build the HOME Transfer Checker page (`/home-checker`)**
    - **Files**: src/pages/HomeCheckerPage.tsx, new `src/components/home/TransferRouteCard.tsx`
    - **What to do**: Load `home-transfer-routes.json` via a typed `useQuery` with `staleTime: Infinity`. Provide a search box (zh-Hant name or Pokédex number). For each result show: Champions legal badge, available transfer methods with `labelZhHant` and `notes`, or a 無法轉移 notice. Full-list mode below the search: all transferable Pokémon grouped by `fromGame`, each linked to `/pokemon/:id`. Display `lastUpdated` from the JSON file in a footer note.
    - **Dependencies**: Steps 3, 9, 11
    - **Effort**: M
    - **Complexity**: Medium
    - **Risks**: Data accuracy depends on Step 9 manual curation. Prominently display last-updated date.

19. **Build the VP Recruiting Planner page (static guide)**
    - **Files**: new `src/pages/VPPlannerPage.tsx`, new `public/data/vp-recruitment.json`
    - **What to do**: Manually author `vp-recruitment.json` with known VP costs per Pokémon sourced from official Champions materials. Schema: `{ speciesId: number, slug: string, nameZhHant: string, vpCost: number | null, requiresBattle: boolean, notes: string }`. Render a filterable, sortable table: zh-Hant name, VP cost, requires battle, notes. Add a 「我的VP」input field — the table filters/highlights affordable Pokémon (those with `vpCost <= inputValue`). Link each row to `/pokemon/:id`. If `vpCost` is `null`, display 「資料待確認」.
    - **Dependencies**: Steps 7, 11
    - **Effort**: M
    - **Complexity**: Medium
    - **Risks**: `[ASSUMED] ⚠️ HIGH-RISK` VP cost data is Champions-exclusive game data. If not available at implementation time, ship a placeholder page with a search and note. The `vpCost: number | null` schema allows partial data.

**Milestone 5 subtotal**: ~0.5–1 day

---

#### Milestone 6: Visual Analysis, Presets & Accessibility

20. **Add SVG stat radar chart to Pokémon detail and Compare Board**
    - **Files**: src/pages/PokemonDetailPage.tsx, src/components/team/CompareBoard.tsx, new `src/components/pokemon/StatRadarChart.tsx`
    - **What to do**: Implement a pure-SVG 6-axis radar chart (no chart library) for HP/攻擊/防禦/特攻/特防/速度. On `PokemonDetailPage`, render the chart alongside the bar chart as a toggle. On `CompareBoard`, overlay all compared Pokémon as color-coded strokes on a single radar. Stats from expanded static JSON. Add `aria-label` to the SVG summarizing stat values for screen readers.
    - **Dependencies**: Steps 8, 11, 17
    - **Effort**: M
    - **Complexity**: Medium
    - **Risks**: SVG polar coordinate math for 6 axes — use known formula `(r * cos(θ), r * sin(θ))`. Axes at 0°, 60°, 120°, 180°, 240°, 300° (one per stat).

21. **Add filter presets and result-mode toggles to Dex page**
    - **Files**: src/pages/DexPage.tsx, src/components/ui/FilterPanel.tsx
    - **What to do**: Add a 「儲存搜尋條件」button that serializes all active filters to `localStorage` under `upresets` (max 5, named by user). Render saved presets as one-tap chips above the filter panel. Add a result-mode toggle (grid 卡片 / list 列表 / compact 縮略), stored in `localStorage`. List mode renders a denser table row per Pokémon with inline stat columns (from expanded JSON); compact mode renders icon + zh-Hant name only.
    - **Dependencies**: Steps 6, 8
    - **Effort**: M
    - **Complexity**: Medium
    - **Risks**: None identified

22. **Accessibility audit and zh-Hant label sweep**
    - **Files**: All page and component files
    - **What to do**: (1) Add `aria-label` (zh-Hant), `aria-expanded`, `aria-live="polite"`, and `role` attributes to: filter panels, all modals, loading spinners, type effectiveness cells. (2) Ensure all interactive elements are keyboard reachable (`Tab`) and activatable (`Enter`/`Space`). (3) Verify WCAG AA contrast for all 18 type badge colors and all 6 effectiveness multiplier colors against Tailwind white/dark backgrounds — fix any that fail. (4) Add per-route `<title>` in zh-Hant using React Router's `<meta>` API. (5) Fix the `version-pill--scarlet` / `version-pill--violet` CSS classes that are currently undefined (add Tailwind equivalents).
    - **Dependencies**: All prior steps
    - **Effort**: M
    - **Complexity**: Medium
    - **Risks**: 18 type colors — several (e.g. 一般 Normal: `#A8A878`, 蟲 Bug: `#A8B820`) may fail WCAG AA on white backgrounds; use darker shades or white text.

**Milestone 6 subtotal**: ~1 day

**Total Effort Estimate**: ~8–11 days (working solo)

---

### Alternatives Considered

1. **Keep vanilla CSS, skip Tailwind**
   - **Approach**: Extend existing CSS variables, add new scoped CSS files per component
   - **Pros**: Zero migration cost, no new tooling
   - **Cons**: 18 type colors, 6 effectiveness colors, and a design token system for a full revamp all need to be manually maintained in CSS; Tailwind v4 eliminates this entirely
   - **Decision**: Not chosen — the full revamp scope justifies Tailwind v4 adoption

2. **Next.js SSG for static data pages** 
   - **Approach**: Use Next.js App Router, SSG Pokémon/Move/Ability pages
   - **Pros**: SEO, deep-linking native, server components
   - **Cons**: Abandons GitHub Pages + Vite; Champions workspace features (team builder, compare) are inherently SPA anyway
   - **Decision**: Not chosen — GitHub Pages constraint and SPA-first nature of workspace tools favor Vite

3. **Incremental refactor per milestone (Chosen)** ✅
   - **Approach**: This plan — TypeScript + tooling first, then routing, then data layer, then pages, then workspace features
   - **Pros**: Each milestone independently deployable; existing features preserved at every step; TypeScript catches regressions early
   - **Decision**: Chosen — logical dependency ordering, manageable risk at each step

---

### Definition of Done

- [ ] `npm run build` passes with zero TypeScript errors and zero lint errors
- [ ] All 6 routes render correctly on GitHub Pages subdirectory URL (test with `vite preview --base /uni-pokedex-mobile/`)
- [ ] All existing features preserved: search, gen/type/version filters, sort, favorites
- [ ] Champions dex filter shows exactly the 186 curated species + regional forms; non-Champions Pokémon shown greyed
- [ ] Pokémon list renders 1025 entries without DOM overload — confirmed via browser DevTools Elements count < 100 nodes in the list container
- [ ] Opening the same Pokémon detail twice produces zero additional network requests (TanStack Query cache verified via Network tab)
- [ ] Ability generation filter is populated and functional (bug from Step 8 fix verified)
- [ ] Raichu detail page shows form tabs: 通常 / 阿羅拉
- [ ] Charizard detail page shows form tabs: 通常 / Mega X / Mega Y
- [ ] Team builder persists 6 slots and type matrix across hard-refresh
- [ ] Compare board shows green/red stat highlights for 2+ Pokémon
- [ ] HOME checker returns transfer routes for Gengar (#94)
- [ ] All UI labels are in zh-Hant throughout (no stray English UI text)
- [ ] All interactive elements reachable by keyboard with visible focus rings
- [ ] Zero WCAG AA contrast failures (verified with browser accessibility tool)
- [ ] `npm run lint` passes with zero new errors

---

### Testing Strategy

- **Unit tests** (introduce Vitest in M1): `championsAvailability.ts` — test `isChampionsLegal` for edge cases (Tauros #128 multi-form, Hydrapple #1019, a non-Champions Pokémon like Bulbasaur #1); workspace store — test `addPin`, `setTeamSlot`, team overflow protection, localStorage migration from `ufavs`; type coverage table logic.
- **Integration tests**: `usePokemonDetail` with mocked TanStack Query — verify the serial chain (pokemon → species → evolution chain URL) returns a `PokemonDetail` typed object; `usePokemonList` verifies all three JSON files load and are parsed into typed arrays.
- **Regression**: After Step 5 (decompose), manually verify all 6 version filters, gen filter, type multi-select, text search, sort orders, and favorites toggle. After Steps 7–8, verify Champions flags on 5 confirmed legal and 5 confirmed illegal Pokémon.

---

### Cross-Cutting Concerns

- **Security**: No user auth, no server. VP budget planner numeric input (Step 19) must parse with `parseInt`/`parseFloat` and validate as a non-negative number to prevent NaN display. All external data is from PokeAPI (HTTPS) or bundled JSON.
- **Performance**: Virtualization (Step 6) critical for the full 1025-entry list. TanStack Query 24h staleTime prevents API hammering. "分析隊伍" button defers the 36-call weakness matrix until user-initiated. Stats in static JSON (Step 8) eliminates stat-related live API calls from the compare board.
- **Accessibility**: ARIA on filter panels (Step 22), modal focus trapping, skip-to-content link in `Layout.tsx` (Step 3), type badge contrast validation (Step 22).
- **Observability**: Wrap TanStack Query `onError` callbacks with `console.error` logging per hook to surface PokeAPI failures in development. No server-side monitoring needed.
- **Data/Migrations**: `localStorage` key `ufavs` → Zustand `pins` migration in Step 14. No server-side schema migrations.

---

### Risks & Mitigation

1. **Step 5 decomposition causes filter/sort regressions**
   - **Impact**: High | **Likelihood**: Medium
   - **Mitigation**: Copy filter/sort `useMemo` logic verbatim during migration — only add TypeScript types. Run the full filter regression checklist after Step 5 before proceeding to M2.

2. **Champions species list manual transcription errors**
   - **Impact**: High | **Likelihood**: Low
   - **Mitigation**: The Polygon list is the canonical source. After transcribing, verify the 186 count with `CHAMPIONS_SPECIES_IDS.size === 186` assertion in the unit test from the testing strategy. Cross-check 5 random entries against the page.

3. **TypeScript strict mode surfaces ~50+ implicit `any` issues during migration**
   - **Impact**: Medium | **Likelihood**: High
   - **Mitigation**: All migrated files start with a `// @ts-nocheck` comment, removed file-by-file as types are added. This unblocks routing (M1) while types are gradually hardened. All **new** files written from scratch must be strictly typed from day one.

4. **Weakness matrix API load (36 concurrent calls on first team analysis)**
   - **Impact**: Medium | **Likelihood**: High
   - **Mitigation**: "分析隊伍" button defers calls until user-initiated. TanStack Query caches per type slug — if the user has opened detail pages for most team members, many calls are already cached. 24h staleTime ensures subsequent sessions are fast.

5. **VP data unavailable at implementation time**
   - **Impact**: Low (single page) | **Likelihood**: High
   - **Mitigation**: Step 19 uses `vpCost: number | null` schema. Any Pokémon without confirmed data gets `null` and displays 「資料待確認」. Ship the page with partial data; no other milestone is blocked.

6. **GitHub Pages 404 on direct URL access to `/pokemon/1`**
   - **Impact**: Medium | **Likelihood**: High (known SPA limitation)
   - **Mitigation**: Add the standard GitHub Pages SPA workaround: a public/404.html that redirects to index.html with the path encoded as a query param, and a corresponding script in index.html that restores the path on load.

---

### Next Steps

All open questions are resolved. Suggested handoff sequence:
- Start with **Milestone 1** — delivers a refactored, TypeScript-enabled, routing-capable app with identical features; safe to merge independently
- Run **Milestone 2** (data) in parallel with **Milestone 3** (pages) — they are independent concerns
- **Milestones 4–6** follow sequentially after M3

Use **Start Implementation** to hand off to the implementation agent, specifying Milestone 1 as the first batch.
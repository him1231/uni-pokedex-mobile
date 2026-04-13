# Revamp Plan: uni-pokedex-mobile → Pokémon Champions Battle-Prep Workspace

> Last updated: 2026-04-13

## Decisions
- **TypeScript**: Yes — all new and migrated files in `.ts`/`.tsx`
- **Champions availability source**: [Polygon — all Pokémon in Champions](https://www.polygon.com/pokemon-champions-all-pokemon-list-pokedex/) (186 species + regional forms + 59 Megas, April 2026)
- **UI language**: zh-Hant only
- **Mega / alternate forms**: tabs within the Pokémon detail page

## Acceptance Criteria
- [ ] TypeScript throughout — all new/migrated files `.ts`/`.tsx`, zero `any` in new code
- [x] Multi-page routing: `/`(圖鑑), `/pokemon/:id`, `/moves`, `/abilities`, `/team`, `/home-checker`, `/vp-planner`
- [x] Champions dex shows 186 curated species + regional forms; non-Champions Pokémon visually marked
- [x] Pokémon detail page: sprite, types, stats, abilities, evolutions, moves, type-chart, HOME eligibility, form/Mega tabs
- [x] MoveDex and AbilityDex are standalone pages (not modals)
- [x] Team builder: 6 slots, persisted to localStorage, with type coverage and weakness matrix
- [x] Compare board: 2–6 Pokémon side-by-side with stat highlighting
- [x] HOME Transfer Checker page using curated data
- [x] API responses cached by TanStack Query — no duplicate calls for same resource
- [x] List virtualized (no 1025+ DOM nodes dumped at once)
- [x] All UI copy in zh-Hant
- [x] All existing features preserved (search, gen/type/version filters, sort, favorites)
- [ ] Keyboard-navigable, WCAG AA contrast throughout
- [ ] GitHub Pages deployable; all routes work on direct URL access

---

## Milestone 1 — Foundation: TypeScript, Routing, Architecture

### Step 1: Set up TypeScript and install all new dependencies
- [x] Install: `react-router-dom@7`, `@tanstack/react-query@5`, `zustand@5`, `react-window`, `tailwindcss`, `@tailwindcss/vite`
- [x] Install dev: `typescript`, `@types/react-window`
- [x] Create `tsconfig.json` (strict, bundler resolution, `@/` alias, `allowJs: true`)
- [x] Create `tsconfig.node.json`
- [x] Rename `vite.config.js` → `vite.config.ts` (add Tailwind plugin + `@/` alias)
- [x] Add `@import "tailwindcss"` to `index.css`
- [x] Add SPA redirect script to `index.html` + create `public/404.html`

### Step 2: Define shared TypeScript types
- [x] `src/types/pokemon.ts` — `PokemonSummary`, `PokemonDetail`, `TypeEntry`, `VersionTag`, `HomeTransferRoute`, etc.
- [x] `src/types/moves.ts` — `MoveSummary`, `MoveDetail`
- [x] `src/types/abilities.ts` — `AbilitySummary`, `AbilityDetail`
- [x] `src/types/workspace.ts` — `WorkspaceState`

### Step 3: Route skeleton + persistent layout
- [x] `src/routes/index.tsx` — 6 routes with `createBrowserRouter`, `basename = BASE_URL`
- [x] `src/components/layout/Layout.tsx` — `<Outlet>` + `<NavBar>`
- [x] `src/components/layout/NavBar.tsx` — bottom nav, zh-Hant labels, keyboard-accessible
- [x] `public/404.html` — GitHub Pages SPA redirect
- [x] `index.html` — update lang to `zh-Hant`, add SPA restore script

### Step 4: Extract data-fetching custom hooks (TanStack Query)
- [x] `src/lib/pokeapi.ts` — typed migration of `pokeapi.js`
- [x] `src/hooks/usePokemonList.ts` — `usePokemonList()`, `useAbilitiesList()`, `useMovesList()`
- [x] `src/hooks/usePokemonDetail.ts` — `usePokemonDetail(id)`, chains pokemon+species+evol
- [x] `src/hooks/useMoveDetail.ts` — `useMoveDetail(id)`
- [x] `src/hooks/useAbilityDetail.ts` — `useAbilityDetail(id)`
- [x] `src/hooks/useTypeEffectiveness.ts` — `useTypeEffectiveness(slugs[])`

### Step 5: Decompose App.jsx into typed page components
- [x] `src/types/*.ts` done (from Step 2)
- [x] `src/pages/DexPage.tsx` — search/filter/sort/list; card click → navigate `/pokemon/:id`
- [x] `src/pages/PokemonDetailPage.tsx` — uses `useParams`, `usePokemonDetail`, `useTypeEffectiveness`
- [x] `src/pages/MoveDexPage.tsx` — standalone move list page
- [x] `src/pages/AbilityDexPage.tsx` — standalone ability list page
- [x] `src/pages/TeamBuilderPage.tsx` — placeholder
- [x] `src/pages/HomeCheckerPage.tsx` — placeholder
- [x] `src/components/pokemon/PokemonCard.tsx` — typed card component
- [x] `src/components/ui/TypeBadge.tsx`
- [x] `src/App.tsx` — thin shell (`<QueryClientProvider>` + `<RouterProvider>`)
- [x] Rename `src/main.jsx` → `src/main.tsx`
- [x] Delete / replace `src/App.jsx` with `src/App.tsx`

### Step 6: Add list virtualization to Dex page
- [x] `DexPage.tsx` uses `react-window` `Grid` (2 columns, react-window v2 API)
- [x] Card height is fixed; cell renders from itemData
- [x] Grid height responds to window resize

---

## Milestone 2 — Champions Data Layer

### Step 7: Champions availability module
- [x] `src/data/championsAvailability.ts` — `CHAMPIONS_SPECIES_IDS` (186 species), `CHAMPIONS_REGIONAL_FORMS`, `CHAMPIONS_MEGA_FORMS`, `isChampionsLegal(id)` helper
- [x] Migrate `src/data/versionExclusives.js` → `.ts`
- [ ] Unit test: `isChampionsLegal` edge cases (Tauros 128, Hydrapple 1019, non-Champions Bulbasaur 1)

### Step 8: Expand Python dataset builder
- [x] Add base stats (hp/atk/def/spa/spd/spe/bst) to `pokedex-summary.json`
- [x] Fix ability `generationId` + `generationLabel` in `abilities-summary.json`
- [x] Add `isChampionsLegal: boolean` to each entry in `pokedex-summary.json`
- [x] Regenerate & commit both JSON files

### Step 9: Home transfer routes dataset
- [x] Manually author `public/data/home-transfer-routes.json` from official HOME + Champions docs
- [x] Add `HomeTransferRoute` type to `src/types/pokemon.ts`

### Step 10: Surface Champions legality on Dex page
- [x] `PokemonCard` shows ⚔️ badge for Champions-legal Pokémon
- [x] Non-legal Pokémon rendered greyed/dimmed
- [x] "僅Champions" toggle filter added to DexPage `FilterPanel`

---

## Milestone 3 — Core Lookup Pages

### Step 11: Pokémon detail page with form/Mega tabs
- [x] `src/pages/PokemonDetailPage.tsx` fully built (replaces M1 placeholder)
- [x] `src/components/pokemon/FormTabStrip.tsx` — tabs for regional forms + Megas from Champions data
- [x] `src/components/pokemon/StatBars.tsx`
- [x] `src/components/pokemon/EvolutionChain.tsx` — chips navigate via `<Link>`
- [x] `src/components/pokemon/MoveTable.tsx` + inline move detail
- [x] `src/components/pokemon/TypeEffectivenessChart.tsx`
- [x] HOME Transfer section in detail page using `home-transfer-routes.json`
- [x] Champions legal badge in sticky header

### Step 12: MoveDex standalone page
- [x] `src/pages/MoveDexPage.tsx` fully built
- [x] Filters: name, type, damage class, generation (gen filter now works after Step 8)
- [x] Virtualized list + inline move detail panel

### Step 13: AbilityDex standalone page
- [x] `src/pages/AbilityDexPage.tsx` fully built
- [x] Filters: name, generation
- [x] Inline ability detail; "擁有此特性的寶可夢" count with filtered Dex link

---

## Milestone 4 — Workspace Layer

### Step 14: Zustand workspace store
- [x] `src/store/workspaceStore.ts` — `pins`, `recents`, `team`, `compareSet` slices
- [x] `persist` middleware for `upins`, `uteam`, `ucompare`, `urecent`
- [x] Migrate existing `ufavs` localStorage key → `pins` on first hydration

### Step 15: Workspace action buttons
- [x] Pin + "加入隊伍" on `PokemonCard` (hover/focus visible)
- [x] "加入隊伍" + "加入比較" CTAs on `PokemonDetailPage`
- [x] `addRecent(speciesId)` on detail page mount

### Step 16: Team Builder page
- [x] `src/pages/TeamBuilderPage.tsx` — 6 `TeamSlot` components
- [x] `src/components/team/TypeCoverageTable.tsx`
- [x] `src/components/team/WeaknessMatrix.tsx` — 18×6 matrix, color-coded
- [x] "分析隊伍" button to defer 36-call weakness matrix until user-initiated
- [x] "最近瀏覽" row for quick team additions (picker shows recents when empty query)

### Step 17: Compare Board
- [x] `src/components/team/CompareBoard.tsx` — side-by-side stat comparison
- [x] Green/red cell highlighting for max/min stat per row
- [x] Integrated into TeamBuilderPage as a section

---

## Milestone 5 — Battle Tools

### Step 18: HOME Transfer Checker page
- [x] `src/pages/HomeCheckerPage.tsx` — search by name/ID, shows transfer routes
- [x] Full-list mode grouped by `fromGame`
- [x] Displays `lastUpdated` note

### Step 19: VP Recruiting Planner (static guide)
- [x] `public/data/vp-recruitment.json` authored from official Champions data
- [x] `src/pages/VPPlannerPage.tsx` — filterable/sortable table with VP budget input
- [x] `vpCost: null` entries display "資料待確認"

---

## Milestone 6 — Visual Analysis & Accessibility

### Step 20: SVG stat radar chart
- [x] `src/components/pokemon/StatRadarChart.tsx` — pure SVG, 6 axes
- [x] Used in `PokemonDetailPage` (toggle with bars) and `CompareBoard` (multi-overlay)
- [x] `aria-label` with stat values for screen readers

### Step 21: Filter presets + result modes
- [x] "儲存搜尋條件" saves up to 5 presets to localStorage
- [x] Result-mode toggle: 卡片 / 列表 / 縮略

### Step 22: Accessibility audit
- [x] ARIA roles, `aria-label`, `aria-expanded` on all interactive panels
- [x] All interactions reachable via keyboard (Tab + Enter/Space)
- [ ] WCAG AA contrast verified for all 18 type badge colors
- [x] Per-route `<title>` in zh-Hant
- [x] Fix `version-pill--scarlet` / `version-pill--violet` CSS classes

---

## Definition of Done
- [x] `npm run build` passes — zero TypeScript errors, zero lint errors
- [ ] All 6 routes work on GitHub Pages subdirectory URL
- [ ] All existing features preserved (search, filters, sort, favorites)
- [ ] Champions filter shows 186 curated species correctly
- [ ] 1025-entry list renders with < 100 DOM nodes in list container (virtualized)
- [ ] Re-opening same Pokemon detail = zero additional network requests (TanStack cache)
- [ ] Ability generation filter populated and functional (bug fixed)
- [ ] Raichu shows tabs: 通常 / 阿羅拉
- [ ] Charizard shows tabs: 通常 / Mega X / Mega Y
- [ ] Team builder persists across hard-refresh
- [ ] Compare board shows green/red stat highlights
- [ ] HOME checker returns routes for Gengar (#94)
- [ ] All UI labels are zh-Hant
- [ ] All interactive elements keyboard-reachable
- [ ] Zero WCAG AA contrast failures

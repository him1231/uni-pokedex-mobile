import { useCallback, useMemo, useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Grid, type CellComponentProps } from 'react-window'
import { usePokemonList } from '@/hooks/usePokemonList'
import { VERSION_FILTER_OPTIONS, matchesVersionFilter } from '@/data/versionExclusives'
import PokemonCard from '@/components/pokemon/PokemonCard'
import type { PokemonSummary } from '@/types/pokemon'

const COLUMN_COUNT = 2
const CARD_HEIGHT = 168 // px per row, including padding
const COLUMN_COUNT_THUMB = 4
const LIST_ROW_HEIGHT = 64
const THUMB_ROW_HEIGHT = 84

const PRESETS_KEY = 'dex-presets'

interface FilterPreset {
  label: string
  query: string
  versionFilter: string
  generationFilter: string
  typeFilter: string
  sortOption: 'id' | 'name' | 'generation'
  showChampionsOnly: boolean
}

interface CellItemData {
  items: PokemonSummary[]
  colCount: number
  onCardClick: (p: PokemonSummary) => void
}

// Defined outside DexPage to prevent re-creation on each render
function Cell(props: CellComponentProps<CellItemData>) {
  const { columnIndex, rowIndex, style, items, colCount, onCardClick } = props
  const index = rowIndex * colCount + columnIndex
  if (index >= items.length) return <div style={style} />
  const p = items[index]
  return (
    <div style={{ ...style, padding: '4px 6px', boxSizing: 'border-box' }}>
      <PokemonCard
        pokemon={p}
        onClick={() => onCardClick(p)}
      />
    </div>
  )
}

function ListCell(props: CellComponentProps<CellItemData>) {
  const { rowIndex, style, items, onCardClick } = props
  const p = items[rowIndex]
  if (!p) return <div style={style} />
  return (
    <div
      style={{ ...style, padding: '4px 8px', boxSizing: 'border-box' }}
      className="list-row"
      role="button"
      tabIndex={0}
      onClick={() => onCardClick(p)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onCardClick(p) }}
    >
      <img src={p.sprite} alt={p.nameZhHant} className="list-row__sprite" />
      <div className="list-row__info">
        <span className="list-row__id">#{String(p.speciesId || p.id).padStart(4, '0')}</span>
        <span className="list-row__name">{p.nameZhHant}</span>
      </div>
      <div className="list-row__types">
        {p.types.map((t) => (
          <span key={t.slug} className={`type-pill type-${t.slug}`}>{t.nameZhHant}</span>
        ))}
      </div>
    </div>
  )
}

function ThumbCell(props: CellComponentProps<CellItemData>) {
  const { columnIndex, rowIndex, style, items, colCount, onCardClick } = props
  const index = rowIndex * colCount + columnIndex
  if (index >= items.length) return <div style={style} />
  const p = items[index]
  return (
    <div
      style={{ ...style, padding: '3px', boxSizing: 'border-box' }}
      className="thumb-cell"
      role="button"
      tabIndex={0}
      onClick={() => onCardClick(p)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onCardClick(p) }}
    >
      <img src={p.sprite} alt={p.nameZhHant} className="thumb-cell__sprite" />
      <div className="thumb-cell__name">{p.nameZhHant}</div>
    </div>
  )
}

const GENERATION_ORDER = [
  'Gen 1 · 關都',
  'Gen 2 · 城都',
  'Gen 3 · 豐緣',
  'Gen 4 · 神奧',
  'Gen 5 · 合眾',
  'Gen 6 · 卡洛斯',
  'Gen 7 · 阿羅拉',
  'Gen 8 · 伽勒爾 / 洗翠',
  'Gen 9 · 帕底亞',
]

const TYPE_LABELS: Record<string, { zh: string }> = {
  normal: { zh: '一般' }, fire: { zh: '火' }, water: { zh: '水' },
  electric: { zh: '電' }, grass: { zh: '草' }, ice: { zh: '冰' },
  fighting: { zh: '格鬥' }, poison: { zh: '毒' }, ground: { zh: '地面' },
  flying: { zh: '飛行' }, psychic: { zh: '超能力' }, bug: { zh: '蟲' },
  rock: { zh: '岩石' }, ghost: { zh: '幽靈' }, dragon: { zh: '龍' },
  dark: { zh: '惡' }, steel: { zh: '鋼' }, fairy: { zh: '妖精' },
}

function sortByGenerationOrder(arr: string[]) {
  return arr.slice().sort((a, b) => {
    const ai = GENERATION_ORDER.indexOf(a)
    const bi = GENERATION_ORDER.indexOf(b)
    if (ai === -1 && bi === -1) return a.localeCompare(b)
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })
}

export default function DexPage() {
  useEffect(() => { document.title = 'Uni 圖鑑' }, [])
  const navigate = useNavigate()
  const { data: list = [], isLoading } = usePokemonList()

  const [query, setQuery] = useState('')
  const [versionFilter, setVersionFilter] = useState('all')
  const [generationFilter, setGenerationFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortOption, setSortOption] = useState<'id' | 'name' | 'generation'>('id')
  const [showChampionsOnly, setShowChampionsOnly] = useState(false)
  const [showTypePanel, setShowTypePanel] = useState(false)
  const [showSortPanel, setShowSortPanel] = useState(false)
  const [resultMode, setResultMode] = useState<'card' | 'list' | 'thumb'>('card')
  const [presets, setPresets] = useState<FilterPreset[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(PRESETS_KEY) ?? '[]') as FilterPreset[]
    } catch {
      return []
    }
  })

  const savePreset = useCallback(() => {
    if (presets.length >= 5) { alert('最多儲存 5 個搜尋條件預設。'); return }
    const label = window.prompt('預設名稱（最多 12 字）:')?.trim().slice(0, 12)
    if (!label) return
    const next: FilterPreset[] = [
      ...presets,
      { label, query, versionFilter, generationFilter, typeFilter, sortOption, showChampionsOnly },
    ]
    setPresets(next)
    localStorage.setItem(PRESETS_KEY, JSON.stringify(next))
  }, [presets, query, versionFilter, generationFilter, typeFilter, sortOption, showChampionsOnly])

  const applyPreset = useCallback((pr: FilterPreset) => {
    setQuery(pr.query)
    setVersionFilter(pr.versionFilter)
    setGenerationFilter(pr.generationFilter)
    setTypeFilter(pr.typeFilter)
    setSortOption(pr.sortOption)
    setShowChampionsOnly(pr.showChampionsOnly)
  }, [])

  const deletePreset = useCallback((idx: number) => {
    const next = presets.filter((_, i) => i !== idx)
    setPresets(next)
    localStorage.setItem(PRESETS_KEY, JSON.stringify(next))
  }, [presets])

  const pokedexGenerationOptions = useMemo(() => {
    const set = new Set<string>()
    list.forEach((p) => { if (p.generationLabel) set.add(p.generationLabel) })
    return sortByGenerationOrder(Array.from(set))
  }, [list])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const res = list.filter((p: PokemonSummary) => {
      if (q) {
        const matchQuery =
          String(p.id) === q ||
          p.nameZhHant.toLowerCase().includes(q) ||
          p.nameEn.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q)
        if (!matchQuery) return false
      }
      const tags = p.versionTags ?? []
      if (showChampionsOnly && !p.isChampionsLegal) return false
      if (!matchesVersionFilter(tags, versionFilter, p.championAvailable)) return false
      if (generationFilter !== 'all' && p.generationLabel !== generationFilter) return false
      if (typeFilter !== 'all') {
        if (!p.types.some((t) => t.slug === typeFilter)) return false
      }
      return true
    })

    res.sort((a: PokemonSummary, b: PokemonSummary) => {
      if (sortOption === 'id') return (a.speciesId || a.id) - (b.speciesId || b.id)
      if (sortOption === 'name') return String(a.nameZhHant || '').localeCompare(String(b.nameZhHant || ''))
      if (sortOption === 'generation') return String(a.generationLabel || '').localeCompare(String(b.generationLabel || ''))
      return 0
    })

    return res
  }, [list, query, versionFilter, generationFilter, typeFilter, sortOption, showChampionsOnly])

  const handleCardClick = useCallback((p: PokemonSummary) => {
    navigate(`/pokemon/${p.speciesId || p.id}`)
  }, [navigate])

  const [gridHeight, setGridHeight] = useState(600)

  useEffect(() => {
    function measure() {
      setGridHeight(Math.max(300, window.innerHeight - 220))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const colCount = resultMode === 'thumb' ? COLUMN_COUNT_THUMB : resultMode === 'list' ? 1 : COLUMN_COUNT
  const rowHeight = resultMode === 'thumb' ? THUMB_ROW_HEIGHT : resultMode === 'list' ? LIST_ROW_HEIGHT : CARD_HEIGHT

  const itemData: CellItemData = useMemo(() => ({
    items: filtered,
    colCount,
    onCardClick: handleCardClick,
  }), [filtered, colCount, handleCardClick])

  return (
    <div className="dex-page">
      {/* Header */}
      <header className="top">
        <div className="top__titlerow">
          <h1>Uni 圖鑑</h1>
          <div className="top__nav-links">
            <Link to="/moves" className="header-link">招式</Link>
            <Link to="/abilities" className="header-link">特性</Link>
          </div>
        </div>
        <div className="controls">
          <input
            placeholder="搜尋名字或編號（例：皮卡丘 / 25）"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search"
            aria-label="搜尋寶可夢"
          />
          <button
            type="button"
            className={`search champions-toggle${showChampionsOnly ? ' champions-toggle--on' : ''}`}
            onClick={() => setShowChampionsOnly((v) => !v)}
            aria-pressed={showChampionsOnly}
            aria-label="僅顯示Champions寶可夢"
          >
            ⚔️ 僅Champions
          </button>
          <select
            value={versionFilter}
            onChange={(e) => setVersionFilter(e.target.value)}
            className="search"
            aria-label="版本篩選"
          >
            {VERSION_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={generationFilter}
            onChange={(e) => setGenerationFilter(e.target.value)}
            className="search"
            aria-label="世代篩選"
          >
            <option value="all">所有世代</option>
            {pokedexGenerationOptions.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {/* Presets bar */}
        <div className="presets-bar" aria-label="搜尋條件預設">
          {presets.map((pr, i) => (
            <span key={i} className="preset-chip">
              <button
                type="button"
                className="preset-chip__label"
                onClick={() => applyPreset(pr)}
                aria-label={`套用預設：${pr.label}`}
              >
                {pr.label}
              </button>
              <button
                type="button"
                className="preset-chip__del"
                onClick={() => deletePreset(i)}
                aria-label={`刪除預設：${pr.label}`}
              >
                ✕
              </button>
            </span>
          ))}
          {presets.length < 5 && (
            <button type="button" className="preset-save-btn" onClick={savePreset} aria-label="儲存目前搜尋條件">
              ＋ 儲存條件
            </button>
          )}
        </div>

        {/* Result-mode toggle */}
        <div className="result-mode-toggle" role="group" aria-label="顯示模式">
          {([
            { mode: 'card', label: '卡片' },
            { mode: 'list', label: '列表' },
            { mode: 'thumb', label: '縮略' },
          ] as const).map(({ mode, label }) => (
            <button
              key={mode}
              type="button"
              className={`result-mode-btn${resultMode === mode ? ' result-mode-btn--active' : ''}`}
              onClick={() => setResultMode(mode)}
              aria-pressed={resultMode === mode}
            >
              {label}
            </button>
          ))}
          <span className="result-mode-count">{filtered.length} 隻</span>
        </div>
      </header>

      {/* Main list */}
      <main className="main">
        <div style={{ width: '100%' }}>
          {isLoading ? (
            <div className="empty">載入圖鑑資料中…</div>
          ) : filtered.length === 0 ? (
            <div className="empty">找不到寶可夢</div>
          ) : (
            <Grid
              columnCount={colCount}
              rowCount={Math.ceil(filtered.length / colCount)}
              columnWidth={`${(100 / colCount).toFixed(2)}%`}
              rowHeight={rowHeight}
              style={{ height: gridHeight, width: '100%', overflowY: 'auto' }}
              defaultWidth={360}
              defaultHeight={gridHeight}
              overscanCount={3}
              cellComponent={resultMode === 'list' ? ListCell : resultMode === 'thumb' ? ThumbCell : Cell}
              cellProps={itemData}
            />
          )}
        </div>
      </main>

      {/* Floating action buttons */}
      <div className="fab-group" aria-label="篩選與排序">
        {/* Type filter FAB */}
        <div className="fab-wrap">
          <button
            type="button"
            className={`fab${typeFilter !== 'all' ? ' fab--active' : ''}`}
            onClick={() => { setShowTypePanel((v) => !v); setShowSortPanel(false) }}
            aria-expanded={showTypePanel}
            aria-label="屬性篩選"
          >
            {typeFilter !== 'all' ? TYPE_LABELS[typeFilter]?.zh ?? typeFilter : '🔖'}
          </button>
          {showTypePanel && (
            <div className="fab-panel" role="dialog" aria-label="選擇屬性">
              <div className="fab-panel__grid">
                <button
                  type="button"
                  className={`fab-type-btn${typeFilter === 'all' ? ' is-active' : ''}`}
                  onClick={() => { setTypeFilter('all'); setShowTypePanel(false) }}
                >
                  全部
                </button>
                {Object.entries(TYPE_LABELS).map(([slug, { zh }]) => (
                  <button
                    key={slug}
                    type="button"
                    className={`fab-type-btn type-pill type-${slug}${typeFilter === slug ? ' is-active' : ''}`}
                    onClick={() => { setTypeFilter(slug); setShowTypePanel(false) }}
                  >
                    {zh}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sort FAB */}
        <div className="fab-wrap">
          <button
            type="button"
            className="fab"
            onClick={() => { setShowSortPanel((v) => !v); setShowTypePanel(false) }}
            aria-expanded={showSortPanel}
            aria-label="排序"
          >
            ↕
          </button>
          {showSortPanel && (
            <div className="fab-panel" role="dialog" aria-label="排序方式">
              {[
                { value: 'id', label: '編號' },
                { value: 'name', label: '名稱' },
                { value: 'generation', label: '世代' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`fab-sort-btn${sortOption === value ? ' is-active' : ''}`}
                  onClick={() => { setSortOption(value as 'id' | 'name' | 'generation'); setShowSortPanel(false) }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

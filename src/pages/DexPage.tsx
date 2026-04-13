import { useCallback, useMemo, useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Grid, type CellComponentProps } from 'react-window'
import { usePokemonList } from '@/hooks/usePokemonList'
import { VERSION_FILTER_OPTIONS, matchesVersionFilter } from '@/data/versionExclusives'
import PokemonCard from '@/components/pokemon/PokemonCard'
import type { PokemonSummary } from '@/types/pokemon'

const COLUMN_COUNT = 2
const CARD_HEIGHT = 168 // px per row, including padding

interface CellItemData {
  items: PokemonSummary[]
  colCount: number
  favorites: number[]
  onCardClick: (p: PokemonSummary) => void
  onToggleFav: (id: number) => void
}

// Defined outside DexPage to prevent re-creation on each render
function Cell(props: CellComponentProps<CellItemData>) {
  const { columnIndex, rowIndex, style, items, colCount, favorites, onCardClick, onToggleFav } = props
  const index = rowIndex * colCount + columnIndex
  if (index >= items.length) return <div style={style} />
  const p = items[index]
  return (
    <div style={{ ...style, padding: '4px 6px', boxSizing: 'border-box' }}>
      <PokemonCard
        pokemon={p}
        onClick={() => onCardClick(p)}
        isFav={favorites.includes(p.id)}
        onToggleFav={() => onToggleFav(p.id)}
      />
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
  const navigate = useNavigate()
  const { data: list = [], isLoading } = usePokemonList()

  const [query, setQuery] = useState('')
  const [versionFilter, setVersionFilter] = useState('all')
  const [generationFilter, setGenerationFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortOption, setSortOption] = useState<'id' | 'name' | 'generation'>('id')
  const [showTypePanel, setShowTypePanel] = useState(false)
  const [showSortPanel, setShowSortPanel] = useState(false)
  const [favorites, setFavorites] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('ufavs') || '[]') as number[]
    } catch {
      return []
    }
  })

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
  }, [list, query, versionFilter, generationFilter, typeFilter, sortOption])

  const toggleFav = useCallback((id: number) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      localStorage.setItem('ufavs', JSON.stringify(next))
      return next
    })
  }, [])

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

  const itemData: CellItemData = useMemo(() => ({
    items: filtered,
    colCount: COLUMN_COUNT,
    favorites,
    onCardClick: handleCardClick,
    onToggleFav: toggleFav,
  }), [filtered, favorites, handleCardClick, toggleFav])

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
              columnCount={COLUMN_COUNT}
              rowCount={Math.ceil(filtered.length / COLUMN_COUNT)}
              columnWidth="50%"
              rowHeight={CARD_HEIGHT}
              style={{ height: gridHeight, width: '100%', overflowY: 'auto' }}
              defaultWidth={360}
              defaultHeight={gridHeight}
              overscanCount={3}
              cellComponent={Cell}
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

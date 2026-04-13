import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePokemonList, useHomeTransferData } from '@/hooks/usePokemonList'
import type { HomeTransferRoute } from '@/types/pokemon'

const FROM_GAME_ORDER = ['home-direct', 'go-home', 'sv', 'swsh', 'bdsp', 'pla', 'other']

function RouteCard({ route }: { route: HomeTransferRoute }) {
  return (
    <div className="hc-route-card">
      <Link to={`/pokemon/${route.speciesId}`} className="hc-route-card__title">
        <span className="hc-route-card__id">#{String(route.speciesId).padStart(4, '0')}</span>
        <span className="hc-route-card__name">{route.nameZhHant}</span>
      </Link>
      <div className="hc-route-card__methods">
        {route.methods.map((m) => (
          <div key={m.fromGame} className="hc-route-card__method">
            <span className="hc-route-card__method-label">{m.labelZhHant}</span>
            {m.notes && <span className="hc-route-card__method-notes">{m.notes}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HomeCheckerPage() {
  useEffect(() => { document.title = 'HOME 轉移查詢 | Uni 圖鑑' }, [])
  const { data: list = [] } = usePokemonList()
  const { data: homeData, isLoading } = useHomeTransferData()

  const [query, setQuery] = useState('')
  const [viewMode, setViewMode] = useState<'search' | 'all'>('search')
  const [groupBy, setGroupBy] = useState<string>('none')

  const routes = homeData?.routes ?? []

  // Search result: find by name/ID
  const searchResult = useMemo(() => {
    if (!query.trim()) return null
    const q = query.trim().toLowerCase()
    const summaryHit = list.find(
      (p) =>
        String(p.speciesId) === q ||
        p.nameZhHant.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q),
    )
    if (!summaryHit) return { found: false as const, query: q }
    const route = routes.find((r) => r.speciesId === summaryHit.speciesId)
    return { found: true as const, summary: summaryHit, route: route ?? null }
  }, [query, list, routes])

  // Full-list grouped view
  const grouped = useMemo(() => {
    if (groupBy === 'none') return null
    const map = new Map<string, HomeTransferRoute[]>()
    for (const r of routes) {
      for (const m of r.methods) {
        const key = m.fromGame
        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push(r)
      }
    }
    // sort by FROM_GAME_ORDER
    const entries = Array.from(map.entries()).sort(([a], [b]) => {
      const ai = FROM_GAME_ORDER.indexOf(a)
      const bi = FROM_GAME_ORDER.indexOf(b)
      if (ai === -1 && bi === -1) return a.localeCompare(b)
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
    return entries
  }, [routes, groupBy])

  return (
    <div className="hc-page">
      <header className="hc-header">
        <h2>HOME 轉移確認</h2>
        {homeData?.lastUpdated && (
          <div className="hc-updated">資料更新：{homeData.lastUpdated}</div>
        )}
      </header>

      {/* Mode toggle */}
      <div className="hc-mode-toggle">
        <button
          type="button"
          className={`hc-mode-btn${viewMode === 'search' ? ' is-active' : ''}`}
          onClick={() => setViewMode('search')}
        >
          🔍 搜尋
        </button>
        <button
          type="button"
          className={`hc-mode-btn${viewMode === 'all' ? ' is-active' : ''}`}
          onClick={() => setViewMode('all')}
        >
          📋 完整清單
        </button>
      </div>

      {isLoading && <div className="empty">載入 HOME 轉移資料中…</div>}

      {/* Search mode */}
      {!isLoading && viewMode === 'search' && (
        <div className="hc-search-section">
          <input
            className="search hc-search-input"
            placeholder="輸入寶可夢名稱或編號（例：94 / 耿鬼）"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="搜尋寶可夢 HOME 轉移"
          />

          {searchResult && (
            <div className="hc-search-result">
              {!searchResult.found ? (
                <div className="hc-not-found">找不到「{searchResult.query}」</div>
              ) : !searchResult.route ? (
                <div className="hc-unavailable">
                  <Link to={`/pokemon/${searchResult.summary.speciesId}`} className="hc-result-link">
                    <img src={searchResult.summary.sprite} alt="" className="hc-result-sprite" />
                    <strong>{searchResult.summary.nameZhHant}</strong>
                  </Link>
                  <p className="hc-unavailable-msg">⚠️ 此寶可夢目前不支援 HOME 轉移至 Champions</p>
                </div>
              ) : (
                <div className="hc-available">
                  <Link to={`/pokemon/${searchResult.summary.speciesId}`} className="hc-result-link">
                    <img src={searchResult.summary.sprite} alt="" className="hc-result-sprite" />
                    <strong>{searchResult.summary.nameZhHant}</strong>
                  </Link>
                  <div className="hc-route-card__methods">
                    {searchResult.route.methods.map((m) => (
                      <div key={m.fromGame} className="hc-route-card__method">
                        <span className="hc-route-card__method-label">✅ {m.labelZhHant}</span>
                        {m.notes && <span className="hc-route-card__method-notes">{m.notes}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Full list mode */}
      {!isLoading && viewMode === 'all' && (
        <div className="hc-list-section">
          <div className="hc-list-controls">
            <label className="hc-group-label" htmlFor="hc-group-select">群組依據：</label>
            <select
              id="hc-group-select"
              className="search"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              aria-label="群組方式"
            >
              <option value="none">不分群</option>
              <option value="fromGame">來源遊戲</option>
            </select>
            <span className="hc-count">{routes.length} 隻可轉移</span>
          </div>

          {groupBy === 'none' ? (
            <div className="hc-route-list">
              {routes.map((r) => (
                <RouteCard key={r.speciesId} route={r} />
              ))}
            </div>
          ) : (
            grouped?.map(([game, gameRoutes]) => (
              <section key={game} className="hc-group-section">
                <h3 className="hc-group-title">
                  {gameRoutes[0]?.methods.find((m) => m.fromGame === game)?.labelZhHant ?? game}
                  <span className="hc-group-count">（{gameRoutes.length} 隻）</span>
                </h3>
                <div className="hc-route-list">
                  {gameRoutes.map((r) => (
                    <RouteCard key={r.speciesId} route={r} />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      )}
    </div>
  )
}


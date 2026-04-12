import React, { useEffect, useMemo, useState } from 'react'
import './App.css'
import PokemonCard from './components/PokemonCard'
import { fetchPokemonDetail } from './lib/pokeapi'
import { VERSION_FILTER_OPTIONS, getVersionTags, matchesVersionFilter } from './data/versionExclusives'

function App() {
  const [list, setList] = useState([])
  const [abilitiesMap, setAbilitiesMap] = useState(new Map())
  const [query, setQuery] = useState('')
  const [versionFilter, setVersionFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const dataUrl = (path) => `${import.meta.env.BASE_URL}${path}`
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ufavs') || '[]')
    } catch (e) {
      return []
    }
  })

  useEffect(() => {
    fetch(dataUrl('data/pokedex-summary.json'))
      .then((r) => r.json())
      .then((data) => {
        // enrich with version tags for filtering/UI
        const enriched = data.map((p) => ({ ...p, versionTags: getVersionTags(p.speciesId || p.id) }))
        setList(enriched)
      })
      .catch(() => setList([]))

    fetch(dataUrl('data/abilities-summary.json'))
      .then((r) => r.json())
      .then((arr) => setAbilitiesMap(new Map(arr.map((a) => [a.id, a]))))
      .catch(() => {})
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return list.filter((p) => {
      if (q) {
        const matchQuery =
          String(p.id) === q ||
          p.nameZhHant.toLowerCase().includes(q) ||
          p.nameEn.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q)
        if (!matchQuery) return false
      }
      // version filter
      const tags = p.versionTags || []
      if (!matchesVersionFilter(tags, versionFilter)) return false
      return true
    })
  }, [list, query, versionFilter])

  function toggleFav(id) {
    const next = favorites.includes(id) ? favorites.filter((x) => x !== id) : [...favorites, id]
    setFavorites(next)
    localStorage.setItem('ufavs', JSON.stringify(next))
  }

  async function openDetail(p) {
    setSelected(p)
    setDetail(null)
    setLoadingDetail(true)
    try {
      const d = await fetchPokemonDetail(p.id, abilitiesMap)
      setDetail(d)
    } catch (e) {
      setDetail({ error: true })
    } finally {
      setLoadingDetail(false)
    }
  }

  function closeDetail() {
    setSelected(null)
    setDetail(null)
  }

  return (
    <div className="app-root">
      <header className="top">
        <h1>Uni Pokédex — Mobile</h1>
        <div className="controls">
          <input
            placeholder="搜尋名字或編號 (例：皮卡丘 / 25)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search"
          />

          <select
            value={versionFilter}
            onChange={(e) => setVersionFilter(e.target.value)}
            className="search"
            aria-label="版本篩選"
          >
            {VERSION_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <main className="main">
        <section className="list">
          {filtered.length === 0 ? (
            <div className="empty">找不到 Pokémon</div>
          ) : (
            filtered.map((p) => (
              <PokemonCard
                key={p.id}
                pokemon={p}
                onClick={() => openDetail(p)}
                isFav={favorites.includes(p.id)}
                onToggleFav={() => toggleFav(p.id)}
              />
            ))
          )}
        </section>
      </main>

      {selected && (
        <div className="detail-overlay" onClick={closeDetail}>
          <div className="detail" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={closeDetail} aria-label="close">
              ✕
            </button>
            <div className="detail-top">
              <img
                className="detail-sprite"
                src={selected.sprite}
                alt={selected.nameZhHant}
              />
              <div>
                <h2>
                  #{String(selected.speciesId).padStart(3, '0')} {selected.nameZhHant}
                </h2>
                <div className="types-row">
                  {selected.types.map((t) => (
                    <span key={t.slug} className={`type pill ${t.slug}`}>
                      {t.nameZhHant}
                    </span>
                  ))}
                </div>
                <div className="meta-small">{selected.generationLabel}</div>
              </div>
            </div>

            <div className="detail-body">
              {loadingDetail ? (
                <div>載入中…</div>
              ) : detail?.error ? (
                <div>無法取得詳情</div>
              ) : (
                detail && (
                  <>
                    <p className="flavor">{detail.flavorText}</p>

                    <section className="stats">
                      <h3>種族值</h3>
                      <div className="stat-list">
                        {detail.stats.map((s) => (
                          <div key={s.slug} className="stat-row">
                            <div className="stat-label">{s.label}</div>
                            <div className="stat-value">{s.value}</div>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="abilities">
                      <h3>特性</h3>
                      <ul>
                        {detail.abilities.map((a) => (
                          <li key={String(a.id) + a.nameEn}>
                            {a.nameZhHant || a.nameEn} {a.isHidden ? <em>（隱藏）</em> : ''}
                          </li>
                        ))}
                      </ul>
                    </section>
                  </>
                )
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="footer">Built for you — mobile-first, no ads.</footer>
    </div>
  )
}

export default App

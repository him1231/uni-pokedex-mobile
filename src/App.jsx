import React, { useEffect, useMemo, useState } from 'react'
import './App.css'
import PokemonCard from './components/PokemonCard'
import { fetchMoveDetail, fetchPokemonDetail, fetchAbilityDetail, fetchTypeEffectiveness } from './lib/pokeapi'
import { VERSION_FILTER_OPTIONS, getVersionTags, isChampionAvailable, matchesVersionFilter } from './data/versionExclusives'

function App() {
  const [list, setList] = useState([])
  const [abilitiesMap, setAbilitiesMap] = useState(new Map())
  const [movesMap, setMovesMap] = useState(new Map())
  const [query, setQuery] = useState('')
  const [versionFilter, setVersionFilter] = useState('all')
  const [generationFilter, setGenerationFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [selectedMove, setSelectedMove] = useState(null)
  const [moveDetail, setMoveDetail] = useState(null)
  const [loadingMoveDetail, setLoadingMoveDetail] = useState(false)
  const [typeChart, setTypeChart] = useState(null)
  const [loadingTypeChart, setLoadingTypeChart] = useState(false)

  // Global ability dex panel states
  const [showAbilityDex, setShowAbilityDex] = useState(false)
  const [abilityQuery, setAbilityQuery] = useState('')
  const [abilityFilterGen, setAbilityFilterGen] = useState('all')
  const [selectedAbility, setSelectedAbility] = useState(null)
  const [abilityDetail, setAbilityDetail] = useState(null)
  const [loadingAbilityDetail, setLoadingAbilityDetail] = useState(false)

  // Global move dex panel states
  const [showMoveDex, setShowMoveDex] = useState(false)
  const [moveQuery, setMoveQuery] = useState('')
  const [moveFilterType, setMoveFilterType] = useState('all')
  const [moveFilterDamage, setMoveFilterDamage] = useState('all')
  const [moveFilterGen, setMoveFilterGen] = useState('all')
  const dataUrl = (path) => `${import.meta.env.BASE_URL}${path}`
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ufavs') || '[]')
    } catch (e) {
      return []
    }
  })

  // Floating buttons: type filter + sort
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortOption, setSortOption] = useState('id')
  const [showTypePanel, setShowTypePanel] = useState(false)
  const [showSortPanel, setShowSortPanel] = useState(false)

  useEffect(() => {
    fetch(dataUrl('data/pokedex-summary.json'))
      .then((r) => r.json())
      .then((data) => {
        // enrich with version tags for filtering/UI
        const enriched = data.map((p) => ({
          ...p,
          versionTags: getVersionTags(p.speciesId || p.id),
          championAvailable: isChampionAvailable(p.speciesId || p.id),
        }))
        setList(enriched)
      })
      .catch(() => setList([]))

    fetch(dataUrl('data/abilities-summary.json'))
      .then((r) => r.json())
      .then((arr) => setAbilitiesMap(new Map(arr.map((a) => [a.id, a]))))
      .catch(() => {})

    fetch(dataUrl('data/moves-summary.json'))
      .then((r) => r.json())
      .then((arr) => setMovesMap(new Map(arr.map((m) => [m.slug, m]))))
      .catch(() => {})
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let res = list.filter((p) => {
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
      if (!matchesVersionFilter(tags, versionFilter, p.championAvailable)) return false
      // generation filter
      if (generationFilter !== 'all' && p.generationLabel !== generationFilter) return false
      // type filter (from FAB)
      if (typeFilter !== 'all') {
        const types = p.types || []
        if (!types.some((t) => t.slug === typeFilter)) return false
      }
      return true
    })

    // sorting
    res.sort((a, b) => {
      if (sortOption === 'id') {
        return (a.speciesId || a.id) - (b.speciesId || b.id)
      }
      if (sortOption === 'name') {
        return String(a.nameZhHant || '').localeCompare(String(b.nameZhHant || ''))
      }
      if (sortOption === 'generation') {
        return String(a.generationLabel || '').localeCompare(String(b.generationLabel || ''))
      }
      return 0
    })

    return res
  }, [list, query, versionFilter, generationFilter, typeFilter, sortOption])

  // Type labels (zh / en) for display in the chart
  const TYPE_LABELS = {
    normal: { zh: '一般', en: 'Normal' },
    fire: { zh: '火', en: 'Fire' },
    water: { zh: '水', en: 'Water' },
    electric: { zh: '電', en: 'Electric' },
    grass: { zh: '草', en: 'Grass' },
    ice: { zh: '冰', en: 'Ice' },
    fighting: { zh: '格鬥', en: 'Fighting' },
    poison: { zh: '毒', en: 'Poison' },
    ground: { zh: '地面', en: 'Ground' },
    flying: { zh: '飛行', en: 'Flying' },
    psychic: { zh: '超能力', en: 'Psychic' },
    bug: { zh: '蟲', en: 'Bug' },
    rock: { zh: '岩石', en: 'Rock' },
    ghost: { zh: '幽靈', en: 'Ghost' },
    dragon: { zh: '龍', en: 'Dragon' },
    dark: { zh: '惡', en: 'Dark' },
    steel: { zh: '鋼', en: 'Steel' },
    fairy: { zh: '妖精', en: 'Fairy' },
  }

  useEffect(() => {
    // When a new Pokémon is selected, fetch its type effectiveness chart
    if (!selected) {
      setTypeChart(null)
      setLoadingTypeChart(false)
      return
    }

    const slugs = (selected.types || []).map((t) => t.slug)
    if (slugs.length === 0) {
      setTypeChart(null)
      setLoadingTypeChart(false)
      return
    }

    let cancelled = false
    setLoadingTypeChart(true)
    setTypeChart(null)
    fetchTypeEffectiveness(slugs)
      .then((chart) => {
        if (cancelled) return
        setTypeChart(chart)
      })
      .catch(() => {
        if (cancelled) return
        setTypeChart(null)
      })
      .finally(() => {
        if (cancelled) return
        setLoadingTypeChart(false)
      })

    return () => {
      cancelled = true
    }
  }, [selected])


  const summaryBySpeciesId = useMemo(
    () => new Map(list.map((pokemon) => [pokemon.speciesId, pokemon])),
    [list],
  )

  // global abilities list and filters
  const abilitiesList = useMemo(() => Array.from(abilitiesMap.values()), [abilitiesMap])

  const abilityGenerationOptions = useMemo(() => {
    const set = new Set()
    abilitiesList.forEach((a) => {
      if (a.generationLabel) set.add(a.generationLabel)
    })
    return Array.from(set)
  }, [abilitiesList])

  const pokedexGenerationOptions = useMemo(() => {
    const set = new Set()
    list.forEach((p) => {
      if (p.generationLabel) set.add(p.generationLabel)
    })
    return Array.from(set)
  }, [list])

  const filteredAbilities = useMemo(() => {
    const q = abilityQuery.trim().toLowerCase()
    return abilitiesList.filter((a) => {
      if (q) {
        const matchQuery =
          String(a.id) === q ||
          (a.nameZhHant && a.nameZhHant.toLowerCase().includes(q)) ||
          (a.nameEn && a.nameEn.toLowerCase().includes(q)) ||
          (a.slug && a.slug.toLowerCase().includes(q))
        if (!matchQuery) return false
      }
      if (abilityFilterGen !== 'all' && a.generationLabel !== abilityFilterGen) return false
      return true
    })
  }, [abilitiesList, abilityQuery, abilityFilterGen])

  // global moves list and filters
  const movesList = useMemo(() => Array.from(movesMap.values()), [movesMap])

  const moveGenerationOptions = useMemo(() => {
    const set = new Set()
    movesList.forEach((m) => {
      if (m.generationLabel) set.add(m.generationLabel)
    })
    return Array.from(set)
  }, [movesList])

  const filteredMoves = useMemo(() => {
    const q = moveQuery.trim().toLowerCase()
    return movesList.filter((m) => {
      if (q) {
        const matchQuery =
          String(m.id) === q ||
          (m.nameZhHant && m.nameZhHant.toLowerCase().includes(q)) ||
          (m.nameEn && m.nameEn.toLowerCase().includes(q)) ||
          (m.slug && m.slug.toLowerCase().includes(q))
        if (!matchQuery) return false
      }
      if (moveFilterType !== 'all' && (!m.type || m.type.slug !== moveFilterType)) return false
      if (moveFilterDamage !== 'all' && (!m.damageClass || m.damageClass.slug !== moveFilterDamage)) return false
      if (moveFilterGen !== 'all' && m.generationLabel !== moveFilterGen) return false
      return true
    })
  }, [movesList, moveQuery, moveFilterType, moveFilterDamage, moveFilterGen])

  function toggleFav(id) {
    const next = favorites.includes(id) ? favorites.filter((x) => x !== id) : [...favorites, id]
    setFavorites(next)
    localStorage.setItem('ufavs', JSON.stringify(next))
  }

  async function openDetail(p) {
    setSelected(p)
    setDetail(null)
    setSelectedMove(null)
    setMoveDetail(null)
    setLoadingDetail(true)
    try {
      const d = await fetchPokemonDetail(p.id, abilitiesMap, movesMap)
      setDetail(d)
    } catch (e) {
      setDetail({ error: true })
    } finally {
      setLoadingDetail(false)
    }
  }

  async function openMoveDetail(move) {
    setSelectedMove(move)
    setMoveDetail(null)
    setLoadingMoveDetail(true)
    try {
      const data = await fetchMoveDetail(move.moveId)
      setMoveDetail(data)
    } catch (e) {
      setMoveDetail({ error: true })
    } finally {
      setLoadingMoveDetail(false)
    }
  }

  async function openAbilityDetail(ability) {
    setSelectedAbility(ability)
    setAbilityDetail(null)
    setLoadingAbilityDetail(true)
    try {
      const data = await fetchAbilityDetail(ability.id)
      setAbilityDetail(data)
    } catch (e) {
      setAbilityDetail({ error: true })
    } finally {
      setLoadingAbilityDetail(false)
    }
  }

  function closeDetail() {
    setSelected(null)
    setDetail(null)
    setSelectedMove(null)
    setMoveDetail(null)
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

          <button type="button" className="search" onClick={() => setShowAbilityDex(true)} aria-label="特性搜尋">
            特性
          </button>
          <button type="button" className="search" onClick={() => setShowMoveDex(true)} aria-label="招式搜尋">
            招式
          </button>
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

                    {detail.evolutionSpeciesIds?.length > 0 && (
                      <section className="detail-section">
                        <h3>進化鏈</h3>
                        <div className="evolution-family">
                          {detail.evolutionSpeciesIds.map((speciesId) => {
                            const familyPokemon = summaryBySpeciesId.get(speciesId)
                            if (!familyPokemon) {
                              return (
                                <span key={speciesId} className="evolution-chip evolution-chip--ghost">
                                  #{String(speciesId).padStart(4, '0')}
                                </span>
                              )
                            }
                            const isCurrent = familyPokemon.speciesId === selected.speciesId
                            return (
                              <button
                                key={speciesId}
                                type="button"
                                className={`evolution-chip ${isCurrent ? 'is-current' : ''}`}
                                onClick={() => openDetail(familyPokemon)}
                              >
                                <img src={familyPokemon.sprite} alt={familyPokemon.nameZhHant} />
                                <span>#{String(familyPokemon.speciesId).padStart(4, '0')}</span>
                                <strong>{familyPokemon.nameZhHant}</strong>
                              </button>
                            )
                          })}
                        </div>
                      </section>
                    )}

                    <section className="detail-section stats">
                      <h3>種族值</h3>
                      <div className="stat-list">
                        {detail.stats.map((s) => {
                          const maxStat = 255
                          const pct = Math.round((s.value / maxStat) * 100)
                          return (
                            <div key={s.slug} className="stat-row">
                              <div className="stat-label">{s.label}</div>
                              <div className="stat-bar-wrap">
                                <div className="stat-bar" aria-hidden>
                                  <div className="stat-bar__fill" style={{ width: `${pct}%` }} />
                                </div>
                                <div className="stat-value">{s.value}</div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </section>

                    <section className="detail-section abilities">
                      <h3>特性</h3>
                      <ul>
                        {detail.abilities.map((a) => (
                          <li key={String(a.id) + a.nameEn}>
                            {a.nameZhHant || a.nameEn} {a.isHidden ? <em>（隱藏）</em> : ''}
                          </li>
                        ))}
                      </ul>
                    </section>

                    <section className="detail-section type-effectiveness">
                      <h3>屬性相剋</h3>
                      {loadingTypeChart ? (
                        <div className="empty-subsection">載入屬性相剋中…</div>
                      ) : !typeChart ? (
                        <div className="empty-subsection">暫無屬性資料</div>
                      ) : (
                        <div className="type-chart-grid">
                          {['4','2','1','0.5','0.25','0'].map((label) => {
                            const bucket = typeChart.filter((t) => String(t.multiplier) === (label === '1' ? '1' : label === '0' ? '0' : label)).filter(Boolean)
                            // Note: multiplier may be 4,2,1,0.5,0.25,0
                            const items = typeChart.filter((t) => {
                              if (label === '4') return t.multiplier === 4
                              if (label === '2') return t.multiplier === 2
                              if (label === '1') return t.multiplier === 1
                              if (label === '0.5') return t.multiplier === 0.5
                              if (label === '0.25') return t.multiplier === 0.25
                              if (label === '0') return t.multiplier === 0
                              return false
                            })

                            return (
                              <div key={label} className="type-chart-bucket">
                                <div className="type-chart-bucket__label">{label}{label === '0' ? '×' : '×'}</div>
                                <div className="type-chart-bucket__items">
                                  {items.length === 0 ? (
                                    <span className="empty-subsection" style={{display:'inline-block',padding:'6px 8px'}}>—</span>
                                  ) : (
                                    items.map((t) => (
                                      <span key={t.slug} className={`type-pill type-${t.slug}`} style={{marginRight:8}}>
                                        {TYPE_LABELS[t.slug]?.zh ?? (t.slug.charAt(0).toUpperCase() + t.slug.slice(1))}
                                        <small style={{marginLeft:6,color:'#6b7280'}}>×{t.multiplier}</small>
                                      </span>
                                    ))
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </section>

                    <section className="detail-section move-sections">
                      <h3>招式學習表</h3>
                      {detail.moveSections?.length ? (
                        detail.moveSections.map((section) => (
                          <div key={section.key} className="move-section-card">
                            <div className="move-section-card__header">
                              <strong>{section.label}</strong>
                              <span>{section.items.length} 招</span>
                            </div>
                            <div className="move-list">
                              {section.items.map((move) => (
                                <button
                                  key={move.id}
                                  type="button"
                                  className={`move-row ${selectedMove?.id === move.id ? 'is-active' : ''}`}
                                  onClick={() => openMoveDetail(move)}
                                >
                                  <div className="move-row__main">
                                    <div className="move-row__titleline">
                                      {section.key === 'levelUp' && (
                                        <span className="move-row__level">Lv.{move.level}</span>
                                      )}
                                      <strong>{move.nameZhHant}</strong>
                                      <span className="move-row__subname">{move.nameEn}</span>
                                    </div>
                                    <div className="move-row__meta">
                                      {move.type && (
                                        <span className={`type-pill type-${move.type.slug}`}>
                                          {move.type.nameZhHant}
                                        </span>
                                      )}
                                      {move.damageClass && (
                                        <span className="move-meta-pill">{move.damageClass.labelZhHant}</span>
                                      )}
                                      {move.power !== null && <span className="move-meta-pill">威力 {move.power}</span>}
                                      {move.accuracy !== null && <span className="move-meta-pill">命中 {move.accuracy}</span>}
                                      {move.pp !== null && <span className="move-meta-pill">PP {move.pp}</span>}
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="empty-subsection">暫時未有可顯示招式資料</div>
                      )}

                      <div className="move-detail-panel">
                        <div className="move-detail-panel__header">
                          <h4>招式詳情</h4>
                          <span>{selectedMove ? '點選其他招式可切換' : '點選上面任一招式查看'}</span>
                        </div>

                        {!selectedMove ? (
                          <div className="empty-subsection">請先點選一個招式</div>
                        ) : loadingMoveDetail ? (
                          <div className="empty-subsection">載入招式詳情中…</div>
                        ) : moveDetail?.error ? (
                          <div className="empty-subsection">無法取得招式詳情</div>
                        ) : (
                          <div className="move-detail-card">
                            <div className="move-detail-card__titleline">
                              <strong>{selectedMove.nameZhHant}</strong>
                              <span>{selectedMove.nameEn}</span>
                            </div>
                            <div className="move-detail-card__pills">
                              {selectedMove.type && (
                                <span className={`type-pill type-${selectedMove.type.slug}`}>
                                  {selectedMove.type.nameZhHant}
                                </span>
                              )}
                              {selectedMove.damageClass && (
                                <span className="move-meta-pill">{selectedMove.damageClass.labelZhHant}</span>
                              )}
                              {selectedMove.power !== null && <span className="move-meta-pill">威力 {selectedMove.power}</span>}
                              {selectedMove.accuracy !== null && <span className="move-meta-pill">命中 {selectedMove.accuracy}</span>}
                              {selectedMove.pp !== null && <span className="move-meta-pill">PP {selectedMove.pp}</span>}
                            </div>
                            <p className="move-detail-card__effect">{moveDetail?.effect || '暫時未有簡述。'}</p>
                            <div className="move-detail-grid">
                              <div className="move-detail-item"><span>對象</span><strong>{moveDetail?.target || '—'}</strong></div>
                              <div className="move-detail-item"><span>異常</span><strong>{moveDetail?.ailment || '—'}</strong></div>
                              <div className="move-detail-item"><span>最少命中</span><strong>{moveDetail?.minHits ?? '—'}</strong></div>
                              <div className="move-detail-item"><span>最多命中</span><strong>{moveDetail?.maxHits ?? '—'}</strong></div>
                              <div className="move-detail-item"><span>吸血</span><strong>{moveDetail?.drain ?? '—'}</strong></div>
                              <div className="move-detail-item"><span>治療</span><strong>{moveDetail?.healing ?? '—'}</strong></div>
                              <div className="move-detail-item"><span>要害率</span><strong>{moveDetail?.critRate ?? '—'}</strong></div>
                              <div className="move-detail-item"><span>畏縮率</span><strong>{moveDetail?.flinchChance ?? '—'}</strong></div>
                              <div className="move-detail-item"><span>能力變化率</span><strong>{moveDetail?.statChance ?? '—'}</strong></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </section>
                  </>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {showAbilityDex && (
        <div className="detail-overlay" onClick={() => setShowAbilityDex(false)}>
          <div className="detail" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setShowAbilityDex(false)} aria-label="close">✕</button>
            <div className="detail-top">
              <h2 style={{margin:0}}>全域特性搜尋</h2>
            </div>

            <div className="detail-body">
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                <input
                  placeholder="搜尋特性或編號 (例：威嚇 / intimidate)"
                  value={abilityQuery}
                  onChange={(e) => setAbilityQuery(e.target.value)}
                  className="search"
                />
                <div style={{display:'flex',gap:8}}>
                  <select value={abilityFilterGen} onChange={(e) => setAbilityFilterGen(e.target.value)} className="search" aria-label="世代">
                    <option value="all">全部世代</option>
                    {abilityGenerationOptions.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="move-list" style={{marginTop:12,maxHeight:'50vh',overflowY:'auto'}}>
                {filteredAbilities.length === 0 ? (
                  <div className="empty-subsection">找不到特性</div>
                ) : (
                  filteredAbilities.map((ability) => (
                    <button key={ability.id} type="button" className={`move-row ${selectedAbility?.id === ability.id ? 'is-active' : ''}`} onClick={() => openAbilityDetail(ability)}>
                      <div className="move-row__main">
                        <div className="move-row__titleline">
                          <strong>{ability.nameZhHant}</strong>
                          <span className="move-row__subname">{ability.nameEn}</span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="move-detail-panel" style={{marginTop:12}}>
                <div className="move-detail-panel__header">
                  <h4>特性詳情</h4>
                  <span>{selectedAbility ? '點選其他特性可切換' : '點選上面任一特性查看'}</span>
                </div>

                {!selectedAbility ? (
                  <div className="empty-subsection">請先點選一個特性</div>
                ) : loadingAbilityDetail ? (
                  <div className="empty-subsection">載入特性詳情中…</div>
                ) : abilityDetail?.error ? (
                  <div className="empty-subsection">無法取得特性詳情</div>
                ) : (
                  <div className="move-detail-card">
                    <div className="move-detail-card__titleline">
                      <strong>{selectedAbility.nameZhHant}</strong>
                      <span>{selectedAbility.nameEn}</span>
                    </div>
                    <p className="move-detail-card__effect">{abilityDetail?.effect || abilityDetail?.flavorText || '暫時未有簡述。'}</p>
                    <div className="move-detail-grid">
                      <div className="move-detail-item"><span>世代</span><strong>{abilityDetail?.generationLabel || '—'}</strong></div>
                      <div className="move-detail-item"><span>影響寶可夢數</span><strong>{abilityDetail?.pokemonCount ?? '—'}</strong></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showMoveDex && (
        <div className="detail-overlay" onClick={() => setShowMoveDex(false)}>
          <div className="detail" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setShowMoveDex(false)} aria-label="close">
              ✕
            </button>
            <div className="detail-top">
              <h2 style={{margin:0}}>全域招式搜尋</h2>
            </div>

            <div className="detail-body">
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                <input
                  placeholder="搜尋招式或編號 (例：火焰拳 / fire-punch)"
                  value={moveQuery}
                  onChange={(e) => setMoveQuery(e.target.value)}
                  className="search"
                />
                <div style={{display:'flex',gap:8}}>
                  <select value={moveFilterType} onChange={(e) => setMoveFilterType(e.target.value)} className="search" aria-label="屬性">
                    <option value="all">全部屬性</option>
                    {Object.keys(TYPE_LABELS).map((k) => (
                      <option key={k} value={k}>{TYPE_LABELS[k].zh} · {TYPE_LABELS[k].en}</option>
                    ))}
                  </select>

                  <select value={moveFilterDamage} onChange={(e) => setMoveFilterDamage(e.target.value)} className="search" aria-label="招式分類">
                    <option value="all">全部招式分類</option>
                    <option value="physical">物理</option>
                    <option value="special">特殊</option>
                    <option value="status">變化</option>
                  </select>

                  <select value={moveFilterGen} onChange={(e) => setMoveFilterGen(e.target.value)} className="search" aria-label="世代">
                    <option value="all">全部世代</option>
                    {moveGenerationOptions.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="move-list" style={{marginTop:12,maxHeight:'50vh',overflowY:'auto'}}>
                {filteredMoves.length === 0 ? (
                  <div className="empty-subsection">找不到招式</div>
                ) : (
                  filteredMoves.map((move) => (
                    <button
                      key={move.id}
                      type="button"
                      className={`move-row ${selectedMove?.id === move.id ? 'is-active' : ''}`}
                      onClick={() => openMoveDetail({ ...move, moveId: move.id })}
                    >
                      <div className="move-row__main">
                        <div className="move-row__titleline">
                          <strong>{move.nameZhHant}</strong>
                          <span className="move-row__subname">{move.nameEn}</span>
                        </div>
                        <div className="move-row__meta">
                          {move.type && <span className={`type-pill type-${move.type.slug}`}>{move.type.nameZhHant}</span>}
                          {move.damageClass && <span className="move-meta-pill">{move.damageClass.labelZhHant}</span>}
                          {move.power !== null && <span className="move-meta-pill">威力 {move.power}</span>}
                          {move.accuracy !== null && <span className="move-meta-pill">命中 {move.accuracy}</span>}
                          {move.pp !== null && <span className="move-meta-pill">PP {move.pp}</span>}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="move-detail-panel" style={{marginTop:12}}>
                <div className="move-detail-panel__header">
                  <h4>招式詳情</h4>
                  <span>{selectedMove ? '點選其他招式可切換' : '點選上面任一招式查看'}</span>
                </div>

                {!selectedMove ? (
                  <div className="empty-subsection">請先點選一個招式</div>
                ) : loadingMoveDetail ? (
                  <div className="empty-subsection">載入招式詳情中…</div>
                ) : moveDetail?.error ? (
                  <div className="empty-subsection">無法取得招式詳情</div>
                ) : (
                  <div className="move-detail-card">
                    <div className="move-detail-card__titleline">
                      <strong>{selectedMove.nameZhHant}</strong>
                      <span>{selectedMove.nameEn}</span>
                    </div>
                    <div className="move-detail-card__pills">
                      {selectedMove.type && <span className={`type-pill type-${selectedMove.type.slug}`}>{selectedMove.type.nameZhHant}</span>}
                      {selectedMove.damageClass && <span className="move-meta-pill">{selectedMove.damageClass.labelZhHant}</span>}
                      {selectedMove.power !== null && <span className="move-meta-pill">威力 {selectedMove.power}</span>}
                      {selectedMove.accuracy !== null && <span className="move-meta-pill">命中 {selectedMove.accuracy}</span>}
                      {selectedMove.pp !== null && <span className="move-meta-pill">PP {selectedMove.pp}</span>}
                    </div>
                    <p className="move-detail-card__effect">{moveDetail?.effect || '暫時未有簡述。'}</p>
                    <div className="move-detail-grid">
                      <div className="move-detail-item"><span>對象</span><strong>{moveDetail?.target || '—'}</strong></div>
                      <div className="move-detail-item"><span>異常</span><strong>{moveDetail?.ailment || '—'}</strong></div>
                      <div className="move-detail-item"><span>最少命中</span><strong>{moveDetail?.minHits ?? '—'}</strong></div>
                      <div className="move-detail-item"><span>最多命中</span><strong>{moveDetail?.maxHits ?? '—'}</strong></div>
                      <div className="move-detail-item"><span>吸血</span><strong>{moveDetail?.drain ?? '—'}</strong></div>
                      <div className="move-detail-item"><span>治療</span><strong>{moveDetail?.healing ?? '—'}</strong></div>
                      <div className="move-detail-item"><span>要害率</span><strong>{moveDetail?.critRate ?? '—'}</strong></div>
                      <div className="move-detail-item"><span>畏縮率</span><strong>{moveDetail?.flinchChance ?? '—'}</strong></div>
                      <div className="move-detail-item"><span>能力變化率</span><strong>{moveDetail?.statChance ?? '—'}</strong></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating action buttons */}
      <div className="fab-container" aria-hidden={false}>
        <button className="fab fab--filter" onClick={() => setShowTypePanel(!showTypePanel)} aria-label="屬性篩選">★</button>
        <button className="fab fab--sort" onClick={() => setShowSortPanel(!showSortPanel)} aria-label="排序">⇅</button>
      </div>

      {showTypePanel && (
        <div className="fab-panel" role="dialog" aria-label="屬性篩選面板">
          <h4>屬性篩選</h4>
          <div className="chips">
            <button className={`chip ${typeFilter === 'all' ? 'is-on' : ''}`} onClick={() => { setTypeFilter('all'); setShowTypePanel(false); }}>全部</button>
            {Object.keys(TYPE_LABELS).map((k) => (
              <button key={k} className={`chip ${typeFilter === k ? 'is-on' : ''}`} onClick={() => { setTypeFilter(typeFilter === k ? 'all' : k); setShowTypePanel(false); }}>
                {TYPE_LABELS[k].zh}
              </button>
            ))}
          </div>
        </div>
      )}

      {showSortPanel && (
        <div className="fab-panel" role="dialog" aria-label="排序面板">
          <h4>排序</h4>
          <div className="chips">
            <button className={`chip ${sortOption === 'id' ? 'is-on' : ''}`} onClick={() => { setSortOption('id'); setShowSortPanel(false); }}>編號</button>
            <button className={`chip ${sortOption === 'name' ? 'is-on' : ''}`} onClick={() => { setSortOption('name'); setShowSortPanel(false); }}>中文名</button>
            <button className={`chip ${sortOption === 'generation' ? 'is-on' : ''}`} onClick={() => { setSortOption('generation'); setShowSortPanel(false); }}>世代</button>
          </div>
        </div>
      )}

      <footer className="footer">Built for you — mobile-first, no ads.</footer>
    </div>
  )
}

export default App

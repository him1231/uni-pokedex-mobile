import { useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { usePokemonDetail } from '@/hooks/usePokemonDetail'
import { usePokemonList } from '@/hooks/usePokemonList'
import { useTypeEffectiveness } from '@/hooks/useTypeEffectiveness'
import { useMoveDetail } from '@/hooks/useMoveDetail'
import type { MoveRef } from '@/types/pokemon'

const TYPE_LABELS: Record<string, string> = {
  normal: '一般', fire: '火', water: '水', electric: '電', grass: '草', ice: '冰',
  fighting: '格鬥', poison: '毒', ground: '地面', flying: '飛行', psychic: '超能力',
  bug: '蟲', rock: '岩石', ghost: '幽靈', dragon: '龍', dark: '惡', steel: '鋼', fairy: '妖精',
}

export default function PokemonDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const pokemonId = id ? Number(id) : undefined

  const { data: list = [] } = usePokemonList()
  const { data: detail, isLoading, isError } = usePokemonDetail(pokemonId)

  const summary = useMemo(
    () => list.find((p) => (p.speciesId || p.id) === pokemonId),
    [list, pokemonId],
  )
  const summaryBySpeciesId = useMemo(
    () => new Map(list.map((p) => [p.speciesId, p])),
    [list],
  )

  const typeSlugs = useMemo(() => detail?.types ?? [], [detail])
  const { data: typeChart, isLoading: loadingTypeChart } = useTypeEffectiveness(typeSlugs)

  const [selectedMove, setSelectedMove] = useState<MoveRef | null>(null)
  const { data: moveDetail, isLoading: loadingMoveDetail } = useMoveDetail(selectedMove?.moveId)

  if (!pokemonId) {
    return <div className="empty">無效的寶可夢編號</div>
  }

  return (
    <div className="detail-page">
      {/* Back navigation */}
      <div className="detail-page__header">
        <button type="button" className="back-btn" onClick={() => navigate(-1)} aria-label="返回">
          ← 返回
        </button>
        {summary && (
          <div className="detail-page__title">
            <span className="detail-page__num">#{String(summary.speciesId).padStart(4, '0')}</span>
            <span className="detail-page__name">{summary.nameZhHant}</span>
          </div>
        )}
      </div>

      {/* Top section — sprite + basic info */}
      {summary && (
        <div className="detail-top">
          <img className="detail-sprite" src={summary.sprite} alt={summary.nameZhHant} />
          <div>
            <h2>
              #{String(summary.speciesId).padStart(3, '0')} {summary.nameZhHant}
            </h2>
            <div className="types-row">
              {summary.types.map((t) => (
                <span key={t.slug} className={`type pill ${t.slug}`}>
                  {t.nameZhHant}
                </span>
              ))}
            </div>
            <div className="meta-small">{summary.generationLabel}</div>
          </div>
        </div>
      )}

      {/* Detail body */}
      <div className="detail-body">
        {isLoading && <div className="empty">載入詳情中…</div>}
        {isError && <div className="empty">無法取得寶可夢詳情</div>}

        {detail && (
          <>
            {detail.flavorText && <p className="flavor">{detail.flavorText}</p>}

            {/* Evolution chain */}
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
                    const isCurrent = familyPokemon.speciesId === pokemonId
                    return (
                      <Link
                        key={speciesId}
                        to={`/pokemon/${familyPokemon.speciesId}`}
                        className={`evolution-chip${isCurrent ? ' is-current' : ''}`}
                      >
                        <img src={familyPokemon.sprite} alt={familyPokemon.nameZhHant} />
                        <span>#{String(familyPokemon.speciesId).padStart(4, '0')}</span>
                        <strong>{familyPokemon.nameZhHant}</strong>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Base stats */}
            <section className="detail-section stats">
              <h3>種族值</h3>
              <div className="stat-list">
                {detail.stats.map((s) => {
                  const pct = Math.round((s.value / 255) * 100)
                  return (
                    <div key={s.slug} className="stat-row">
                      <div className="stat-label">{s.label}</div>
                      <div className="stat-bar-wrap">
                        <div className="stat-bar" aria-hidden="true">
                          <div className="stat-bar__fill" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="stat-value">{s.value}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Abilities */}
            <section className="detail-section abilities">
              <h3>特性</h3>
              <ul>
                {detail.abilities.map((a) => (
                  <li key={`${a.id}-${a.nameEn}`}>
                    {a.nameZhHant || a.nameEn}{a.isHidden ? <em>（隱藏）</em> : ''}
                  </li>
                ))}
              </ul>
            </section>

            {/* Type effectiveness */}
            <section className="detail-section type-effectiveness">
              <h3>屬性相剋</h3>
              {loadingTypeChart ? (
                <div className="empty-subsection">載入屬性相剋中…</div>
              ) : !typeChart ? (
                <div className="empty-subsection">暫無屬性資料</div>
              ) : (
                <div className="type-chart-grid">
                  {(['4', '2', '1', '0.5', '0.25', '0'] as const).map((label) => {
                    const multiplierVal = Number(label)
                    const items = typeChart.filter((t) => t.multiplier === multiplierVal)
                    return (
                      <div key={label} className="type-chart-bucket">
                        <div className="type-chart-bucket__label">{label}×</div>
                        <div className="type-chart-bucket__items">
                          {items.length === 0 ? (
                            <span className="empty-subsection" style={{ display: 'inline-block', padding: '6px 8px' }}>—</span>
                          ) : (
                            items.map((t) => (
                              <span key={t.slug} className={`type-pill type-${t.slug}`} style={{ marginRight: 8 }}>
                                {TYPE_LABELS[t.slug] ?? t.slug}
                                <small style={{ marginLeft: 6, color: '#6b7280' }}>×{t.multiplier}</small>
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

            {/* Moves */}
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
                          className={`move-row${selectedMove?.id === move.id ? ' is-active' : ''}`}
                          onClick={() => setSelectedMove(move)}
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
                                <span className={`type-pill type-${move.type.slug}`}>{move.type.nameZhHant}</span>
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

              {/* Move detail panel */}
              <div className="move-detail-panel">
                <div className="move-detail-panel__header">
                  <h4>招式詳情</h4>
                  <span>{selectedMove ? '點選其他招式可切換' : '點選上面任一招式查看'}</span>
                </div>
                {!selectedMove ? (
                  <div className="empty-subsection">請先點選一個招式</div>
                ) : loadingMoveDetail ? (
                  <div className="empty-subsection">載入招式詳情中…</div>
                ) : (
                  <div className="move-detail-card">
                    <div className="move-detail-card__titleline">
                      <strong>{selectedMove.nameZhHant}</strong>
                      <span>{selectedMove.nameEn}</span>
                    </div>
                    <div className="move-detail-card__pills">
                      {selectedMove.type && (
                        <span className={`type-pill type-${selectedMove.type.slug}`}>{selectedMove.type.nameZhHant}</span>
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
        )}
      </div>
    </div>
  )
}

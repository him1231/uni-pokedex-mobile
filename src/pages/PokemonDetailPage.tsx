import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePokemonDetail } from '@/hooks/usePokemonDetail'
import { usePokemonList, useHomeTransferData } from '@/hooks/usePokemonList'
import { useTypeEffectiveness } from '@/hooks/useTypeEffectiveness'
import { useWorkspaceStore } from '@/store/workspaceStore'
import FormTabStrip from '@/components/pokemon/FormTabStrip'
import StatBars from '@/components/pokemon/StatBars'
import StatRadarChart from '@/components/pokemon/StatRadarChart'
import EvolutionChain from '@/components/pokemon/EvolutionChain'
import MoveTable from '@/components/pokemon/MoveTable'
import TypeEffectivenessChart from '@/components/pokemon/TypeEffectivenessChart'

export default function PokemonDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const pokemonId = id ? Number(id) : undefined

  const { data: list = [] } = usePokemonList()
  const { data: homeTransferData } = useHomeTransferData()

  const addRecent = useWorkspaceStore((s) => s.addRecent)
  const pins = useWorkspaceStore((s) => s.pins)
  const togglePin = useWorkspaceStore((s) => s.togglePin)
  const addToTeam = useWorkspaceStore((s) => s.addToTeam)
  const addToCompare = useWorkspaceStore((s) => s.addToCompare)
  const compareSet = useWorkspaceStore((s) => s.compareSet)

  // Record this visit in recents
  useEffect(() => {
    if (pokemonId) addRecent(pokemonId)
  }, [pokemonId, addRecent])

  // Per-route page title
  useEffect(() => {
    if (summary) {
      document.title = `${summary.nameZhHant} | Uni 圖鑑`
    } else {
      document.title = 'Uni 圖鑑'
    }
  }, [summary])

  const summary = useMemo(
    () => list.find((p) => (p.speciesId || p.id) === pokemonId),
    [list, pokemonId],
  )
  const summaryBySpeciesId = useMemo(
    () => new Map(list.map((p) => [p.speciesId, p])),
    [list],
  )

  // Form tab — null means use base species slug
  const [activeFormSlug, setActiveFormSlug] = useState<string | null>(null)
  const [statView, setStatView] = useState<'bars' | 'radar'>('bars')
  const resolvedSlug = activeFormSlug ?? summary?.slug ?? pokemonId

  const { data: detail, isLoading, isError } = usePokemonDetail(resolvedSlug)

  const typeSlugs = useMemo(() => detail?.types ?? [], [detail])
  const { data: typeChart, isLoading: loadingTypeChart } = useTypeEffectiveness(typeSlugs)

  const homeRoute = useMemo(
    () => homeTransferData?.routes.find((r) => r.speciesId === pokemonId) ?? null,
    [homeTransferData, pokemonId],
  )

  if (!pokemonId) {
    return <div className="empty">無效的寶可夢編號</div>
  }

  return (
    <div className="detail-page">
      {/* Sticky header */}
      <div className="detail-page__header">
        <button type="button" className="back-btn" onClick={() => navigate(-1)} aria-label="返回">
          ← 返回
        </button>
        {summary && (
          <div className="detail-page__title">
            <span className="detail-page__num">#{String(summary.speciesId).padStart(4, '0')}</span>
            <span className="detail-page__name">{summary.nameZhHant}</span>
            {summary.isChampionsLegal && (
              <span className="detail-page__champions-badge" aria-label="Pokémon Champions 可用" title="Pokémon Champions 可用">⚔️</span>
            )}
          </div>
        )}
      </div>

      {/* Top section — sprite + basic info */}
      {summary && (
        <div className="detail-top">
          <img className="detail-sprite" src={summary.sprite} alt={summary.nameZhHant} />
          <div>
            <h2>#{String(summary.speciesId).padStart(3, '0')} {summary.nameZhHant}</h2>
            <div className="types-row">
              {summary.types.map((t) => (
                <span key={t.slug} className={`type pill ${t.slug}`}>{t.nameZhHant}</span>
              ))}
            </div>
            <div className="meta-small">{summary.generationLabel}</div>
            {summary.isChampionsLegal && (
              <div className="champions-legal-badge">⚔️ Pokémon Champions 可用</div>
            )}
          </div>
        </div>
      )}

      {/* Workspace CTAs */}
      {summary && pokemonId && (
        <div className="detail-workspace-actions">
          <button
            type="button"
            className={`workspace-btn workspace-btn--pin${pins.includes(pokemonId) ? ' is-on' : ''}`}
            onClick={() => togglePin(pokemonId)}
            aria-label={pins.includes(pokemonId) ? '取消收藏' : '加入收藏'}
          >
            {pins.includes(pokemonId) ? '★ 已收藏' : '☆ 收藏'}
          </button>
          <button
            type="button"
            className="workspace-btn workspace-btn--team"
            onClick={() => addToTeam(pokemonId)}
            aria-label={`將 ${summary.nameZhHant} 加入隊伍`}
          >
            ＋加入隊伍
          </button>
          <button
            type="button"
            className={`workspace-btn workspace-btn--compare${compareSet.includes(pokemonId) ? ' is-on' : ''}`}
            onClick={() => compareSet.includes(pokemonId) ? undefined : addToCompare(pokemonId)}
            aria-label={`將 ${summary.nameZhHant} 加入比較`}
            disabled={compareSet.includes(pokemonId)}
          >
            {compareSet.includes(pokemonId) ? '✓ 比較中' : '⇄ 加入比較'}
          </button>
        </div>
      )}

      {/* Form tab strip */}
      {summary && pokemonId && (
        <FormTabStrip
          speciesId={pokemonId}
          baseSlug={summary.slug}
          activeSlug={activeFormSlug ?? summary.slug}
          onSelectSlug={(slug) => setActiveFormSlug(slug === summary.slug ? null : slug)}
        />
      )}

      {/* Detail body */}
      <div className="detail-body">
        {isLoading && <div className="empty">載入詳情中…</div>}
        {isError && <div className="empty">無法取得寶可夢詳情（此形態可能尚不支援）</div>}

        {detail && (
          <>
            {detail.flavorText && <p className="flavor">{detail.flavorText}</p>}

            <EvolutionChain
              evolutionSpeciesIds={detail.evolutionSpeciesIds}
              currentSpeciesId={pokemonId}
              summaryBySpeciesId={summaryBySpeciesId}
            />

            <section className="detail-section stats">
              <div className="stats-header">
                <h3>種族值</h3>
                <div className="stats-view-toggle" role="group" aria-label="種族值顯示方式">
                  <button
                    type="button"
                    className={`stats-view-btn${statView === 'bars' ? ' is-active' : ''}`}
                    onClick={() => setStatView('bars')}
                    aria-pressed={statView === 'bars'}
                  >
                    列表
                  </button>
                  <button
                    type="button"
                    className={`stats-view-btn${statView === 'radar' ? ' is-active' : ''}`}
                    onClick={() => setStatView('radar')}
                    aria-pressed={statView === 'radar'}
                  >
                    雷達圖
                  </button>
                </div>
              </div>
              {statView === 'bars' ? (
                <StatBars stats={detail.stats} />
              ) : (
                <div className="stat-radar-wrap">
                  <StatRadarChart stats={detail.stats} />
                </div>
              )}
            </section>

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

            <section className="detail-section type-effectiveness">
              <h3>屬性相剋</h3>
              <TypeEffectivenessChart typeChart={typeChart ?? []} isLoading={loadingTypeChart} />
            </section>

            {/* HOME Transfer section */}
            <section className="detail-section home-transfer">
              <h3>Pokémon HOME 轉移</h3>
              {!homeTransferData ? (
                <div className="empty-subsection">載入轉移資料中…</div>
              ) : !homeRoute ? (
                <div className="home-transfer__unavailable">⚠️ 此寶可夢暫不支援 HOME 轉移至 Champions</div>
              ) : (
                <div className="home-transfer__routes">
                  {homeRoute.methods.map((method) => (
                    <div key={method.fromGame} className="home-transfer__route-row">
                      <span className="home-transfer__route-label">{method.labelZhHant}</span>
                      {method.notes && <span className="home-transfer__route-notes">{method.notes}</span>}
                    </div>
                  ))}
                  {homeTransferData.lastUpdated && (
                    <div className="home-transfer__updated">資料更新：{homeTransferData.lastUpdated}</div>
                  )}
                </div>
              )}
            </section>

            <section className="detail-section move-sections">
              <h3>招式學習表</h3>
              <MoveTable moveSections={detail.moveSections} />
            </section>
          </>
        )}
      </div>
    </div>
  )
}

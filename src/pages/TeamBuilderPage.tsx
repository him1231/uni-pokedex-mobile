import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { usePokemonList } from '@/hooks/usePokemonList'
import TypeCoverageTable from '@/components/team/TypeCoverageTable'
import WeaknessMatrix from '@/components/team/WeaknessMatrix'
import CompareBoard from '@/components/team/CompareBoard'
import type { PokemonSummary } from '@/types/pokemon'

function TeamSlot({
  slot,
  speciesId,
  summary,
}: {
  slot: number
  speciesId: number | null
  summary: PokemonSummary | null
}) {
  const setTeamSlot = useWorkspaceStore((s) => s.setTeamSlot)
  const clearTeamSlot = useWorkspaceStore((s) => s.clearTeamSlot)
  const recents = useWorkspaceStore((s) => s.recents)
  const { data: list = [] } = usePokemonList()
  const [showPicker, setShowPicker] = useState(false)
  const [pickerQuery, setPickerQuery] = useState('')

  const pickerResults = useMemo(() => {
    if (!showPicker) return []
    const q = pickerQuery.trim().toLowerCase()
    if (!q) {
      // Show recents first
      return recents
        .map((id) => list.find((p) => p.speciesId === id))
        .filter(Boolean) as PokemonSummary[]
    }
    return list
      .filter(
        (p) =>
          p.nameZhHant.toLowerCase().includes(q) ||
          p.nameEn.toLowerCase().includes(q) ||
          String(p.speciesId) === q,
      )
      .slice(0, 20)
  }, [showPicker, pickerQuery, recents, list])

  if (!summary) {
    return (
      <div className="team-slot team-slot--empty">
        <button
          type="button"
          className="team-slot__add-btn"
          onClick={() => setShowPicker((v) => !v)}
          aria-label={`選擇隊伍第 ${slot + 1} 格`}
        >
          ＋
        </button>
        {showPicker && (
          <div className="team-slot__picker">
            <input
              autoFocus
              placeholder="搜尋寶可夢…"
              value={pickerQuery}
              onChange={(e) => setPickerQuery(e.target.value)}
              className="team-slot__picker-input"
              aria-label="搜尋寶可夢"
            />
            <ul className="team-slot__picker-list">
              {pickerResults.map((p) => (
                <li key={p.speciesId}>
                  <button
                    type="button"
                    className="team-slot__picker-item"
                    onClick={() => { setTeamSlot(slot, p.speciesId); setShowPicker(false); setPickerQuery('') }}
                  >
                    <img src={p.sprite} alt="" className="team-slot__picker-sprite" />
                    <span>{p.nameZhHant}</span>
                    <span className="team-slot__picker-id">#{String(p.speciesId).padStart(4, '0')}</span>
                  </button>
                </li>
              ))}
              {pickerResults.length === 0 && pickerQuery && (
                <li className="team-slot__picker-empty">找不到結果</li>
              )}
            </ul>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="team-slot team-slot--filled">
      <Link to={`/pokemon/${summary.speciesId}`} className="team-slot__link">
        <img src={summary.sprite} alt={summary.nameZhHant} className="team-slot__sprite" />
        <div className="team-slot__info">
          <div className="team-slot__name">{summary.nameZhHant}</div>
          <div className="team-slot__types">
            {summary.types.map((t) => (
              <span key={t.slug} className={`type-pill type-${t.slug}`}>{t.nameZhHant}</span>
            ))}
          </div>
        </div>
      </Link>
      <button
        type="button"
        className="team-slot__remove"
        onClick={() => clearTeamSlot(slot)}
        aria-label={`移除 ${summary.nameZhHant}`}
      >
        ✕
      </button>
    </div>
  )
}

export default function TeamBuilderPage() {
  useEffect(() => { document.title = '隊伍建立 | Uni 圖鑑' }, [])
  const team = useWorkspaceStore((s) => s.team)
  const clearTeam = useWorkspaceStore((s) => s.clearTeam)
  const { data: list = [] } = usePokemonList()
  const [showAnalysis, setShowAnalysis] = useState(false)

  const teamSummaries = useMemo(
    () => team.map((id) => (id ? (list.find((p) => p.speciesId === id) ?? null) : null)),
    [team, list],
  )

  const hasAnyMember = teamSummaries.some(Boolean)

  return (
    <div className="team-builder-page">
      <div className="team-builder-page__header">
        <h2>隊伍建立</h2>
        {hasAnyMember && (
          <button type="button" className="workspace-btn workspace-btn--clear" onClick={clearTeam}>
            清空隊伍
          </button>
        )}
      </div>

      {/* 6 Team Slots */}
      <div className="team-slots">
        {team.map((speciesId, i) => (
          <TeamSlot
            key={i}
            slot={i}
            speciesId={speciesId}
            summary={teamSummaries[i]}
          />
        ))}
      </div>

      {/* Analysis — deferred behind "分析隊伍" button */}
      {hasAnyMember && (
        <div className="team-analysis">
          {!showAnalysis ? (
            <button
              type="button"
              className="workspace-btn workspace-btn--analyze"
              onClick={() => setShowAnalysis(true)}
            >
              分析隊伍
            </button>
          ) : (
            <>
              <TypeCoverageTable teamSummaries={teamSummaries} />
              <WeaknessMatrix teamSummaries={teamSummaries} />
            </>
          )}
        </div>
      )}

      {/* Compare Board */}
      <CompareBoard summaryList={list} />
    </div>
  )
}


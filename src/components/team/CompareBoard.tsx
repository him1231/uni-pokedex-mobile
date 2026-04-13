import { useState } from 'react'
import { useWorkspaceStore } from '@/store/workspaceStore'
import StatRadarChart from '@/components/pokemon/StatRadarChart'
import type { PokemonSummary, StatEntry } from '@/types/pokemon'

interface CompareBoardProps {
  summaryList: PokemonSummary[]
}

const STAT_KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const
const STAT_LABELS: Record<typeof STAT_KEYS[number], string> = {
  hp: 'HP', atk: '攻擊', def: '防禦', spa: '特攻', spd: '特防', spe: '速度',
}

export default function CompareBoard({ summaryList }: CompareBoardProps) {
  const compareSet = useWorkspaceStore((s) => s.compareSet)
  const removeFromCompare = useWorkspaceStore((s) => s.removeFromCompare)
  const clearCompare = useWorkspaceStore((s) => s.clearCompare)
  const [statView, setStatView] = useState<'table' | 'radar'>('table')

  const members = compareSet
    .map((id) => summaryList.find((p) => p.speciesId === id) ?? null)
    .filter(Boolean) as PokemonSummary[]

  /** Convert flat summary stats to StatEntry[] for RadarChart */
  const toStatEntries = (m: PokemonSummary): StatEntry[] => [
    { slug: 'hp', label: 'HP', value: m.hp },
    { slug: 'attack', label: '攻擊', value: m.atk },
    { slug: 'defense', label: '防禦', value: m.def },
    { slug: 'special-attack', label: '特攻', value: m.spa },
    { slug: 'special-defense', label: '特防', value: m.spd },
    { slug: 'speed', label: '速度', value: m.spe },
  ]

  if (members.length === 0) {
    return (
      <div className="compare-board compare-board--empty">
        <p>從圖鑑或詳情頁點擊「⇄ 加入比較」，最多可比較 6 隻。</p>
      </div>
    )
  }

  return (
    <div className="compare-board">
      <div className="compare-board__header">
        <h4>比較板</h4>
        <div className="compare-view-toggle" role="group" aria-label="顯示模式">
          <button
            type="button"
            className={`compare-view-btn${statView === 'table' ? ' compare-view-btn--active' : ''}`}
            onClick={() => setStatView('table')}
            aria-pressed={statView === 'table'}
          >
            表格
          </button>
          <button
            type="button"
            className={`compare-view-btn${statView === 'radar' ? ' compare-view-btn--active' : ''}`}
            onClick={() => setStatView('radar')}
            aria-pressed={statView === 'radar'}
          >
            雷達圖
          </button>
        </div>
        <button type="button" className="workspace-btn workspace-btn--clear" onClick={clearCompare}>
          清除全部
        </button>
      </div>

      {statView === 'radar' && (
        <div className="compare-radar-wrap">
          {members.map((m, i) => (
            <div key={m.speciesId} className="compare-radar-item">
              <img src={m.sprite} alt={m.nameZhHant} className="compare-radar-sprite" />
              <div className="compare-radar-label">{m.nameZhHant}</div>
              <StatRadarChart
                stats={toStatEntries(m)}
                compareStats={i === 0 ? undefined : toStatEntries(members[0])}
              />
            </div>
          ))}
        </div>
      )}

      <div className={`compare-board__scroll${statView === 'radar' ? ' compare-board__scroll--hidden' : ''}`}>
        <table className="compare-table">
          <thead>
            <tr>
              <th />
              {members.map((m) => (
                <th key={m.speciesId} className="compare-member-col">
                  <div className="compare-member">
                    <img src={m.sprite} alt={m.nameZhHant} className="compare-sprite" />
                    <div className="compare-member-name">{m.nameZhHant}</div>
                    <button
                      type="button"
                      className="compare-remove-btn"
                      onClick={() => removeFromCompare(m.speciesId)}
                      aria-label={`移除 ${m.nameZhHant}`}
                    >
                      ✕
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {STAT_KEYS.map((key) => {
              const values = members.map((m) => m[key] as number)
              const max = Math.max(...values)
              const min = Math.min(...values)
              const allSame = max === min
              return (
                <tr key={key}>
                  <td className="compare-stat-label">{STAT_LABELS[key]}</td>
                  {members.map((m) => {
                    const val = m[key] as number
                    const cls = allSame
                      ? ''
                      : val === max
                      ? ' compare-cell--max'
                      : val === min
                      ? ' compare-cell--min'
                      : ''
                    return (
                      <td key={m.speciesId} className={`compare-cell${cls}`}>
                        {val}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
            <tr>
              <td className="compare-stat-label">總計</td>
              {members.map((m) => (
                <td key={m.speciesId} className="compare-cell compare-cell--bst">
                  {m.bst}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

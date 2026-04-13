import { useWorkspaceStore } from '@/store/workspaceStore'
import type { PokemonSummary } from '@/types/pokemon'

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

  const members = compareSet
    .map((id) => summaryList.find((p) => p.speciesId === id) ?? null)
    .filter(Boolean) as PokemonSummary[]

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
        <button type="button" className="workspace-btn workspace-btn--clear" onClick={clearCompare}>
          清除全部
        </button>
      </div>

      <div className="compare-board__scroll">
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

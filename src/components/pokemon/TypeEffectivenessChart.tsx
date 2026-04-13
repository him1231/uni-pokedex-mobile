import type { TypeEffectivenessEntry } from '@/types/pokemon'

const TYPE_LABELS: Record<string, string> = {
  normal: '一般', fire: '火', water: '水', electric: '電', grass: '草', ice: '冰',
  fighting: '格鬥', poison: '毒', ground: '地面', flying: '飛行', psychic: '超能力',
  bug: '蟲', rock: '岩石', ghost: '幽靈', dragon: '龍', dark: '惡', steel: '鋼', fairy: '妖精',
}

const MULTIPLIER_BUCKETS = ['4', '2', '1', '0.5', '0.25', '0'] as const

interface TypeEffectivenessChartProps {
  typeChart: TypeEffectivenessEntry[]
  isLoading: boolean
}

export default function TypeEffectivenessChart({ typeChart, isLoading }: TypeEffectivenessChartProps) {
  if (isLoading) return <div className="empty-subsection">載入屬性相剋中…</div>
  if (!typeChart) return <div className="empty-subsection">暫無屬性資料</div>

  return (
    <div className="type-chart-grid">
      {MULTIPLIER_BUCKETS.map((label) => {
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
  )
}

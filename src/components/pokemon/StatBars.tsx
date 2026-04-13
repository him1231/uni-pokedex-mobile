import type { StatEntry } from '@/types/pokemon'

interface StatBarsProps {
  stats: StatEntry[]
}

export default function StatBars({ stats }: StatBarsProps) {
  return (
    <div className="stat-list">
      {stats.map((s) => {
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
  )
}

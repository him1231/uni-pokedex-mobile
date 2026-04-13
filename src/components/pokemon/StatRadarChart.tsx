import type { StatEntry } from '@/types/pokemon'

interface StatRadarChartProps {
  /** 6 stat entries: hp, attack, defense, special-attack, special-defense, speed */
  stats: StatEntry[]
  /** Optional second dataset for comparison overlay (e.g. CompareBoard) */
  compareStats?: StatEntry[]
  /** Axis label color, defaults to var(--muted) */
  size?: number
}

const MAX_STAT = 255
const AXES = 6
const LABEL_PAD = 22 // px from polygon edge to label centre

function polarToXY(angle: number, radius: number, cx: number, cy: number) {
  // 0° = top, clockwise
  const rad = (angle - 90) * (Math.PI / 180)
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  }
}

function statsToPoints(stats: StatEntry[], r: number, cx: number, cy: number): string {
  return stats
    .map((s, i) => {
      const angle = (360 / AXES) * i
      const ratio = Math.min(s.value / MAX_STAT, 1)
      const { x, y } = polarToXY(angle, ratio * r, cx, cy)
      return `${x},${y}`
    })
    .join(' ')
}

function gridPoints(level: number, r: number, cx: number, cy: number): string {
  return Array.from({ length: AXES }, (_, i) => {
    const angle = (360 / AXES) * i
    const { x, y } = polarToXY(angle, r * level, cx, cy)
    return `${x},${y}`
  }).join(' ')
}

export default function StatRadarChart({ stats, compareStats, size = 220 }: StatRadarChartProps) {
  if (stats.length !== 6) return null

  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - LABEL_PAD - 4

  const ariaLabel = stats.map((s) => `${s.label} ${s.value}`).join('、')

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className="stat-radar"
      role="img"
      aria-label={`種族值雷達圖：${ariaLabel}`}
    >
      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1].map((level) => (
        <polygon
          key={level}
          points={gridPoints(level, r, cx, cy)}
          fill="none"
          stroke="var(--border, #e5e7eb)"
          strokeWidth={1}
        />
      ))}

      {/* Axis spokes */}
      {stats.map((_, i) => {
        const { x, y } = polarToXY((360 / AXES) * i, r, cx, cy)
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border, #e5e7eb)" strokeWidth={1} />
      })}

      {/* Compare overlay (behind primary) */}
      {compareStats && compareStats.length === 6 && (
        <polygon
          points={statsToPoints(compareStats, r, cx, cy)}
          fill="rgba(59,130,246,0.15)"
          stroke="#3b82f6"
          strokeWidth={1.5}
        />
      )}

      {/* Primary stat polygon */}
      <polygon
        points={statsToPoints(stats, r, cx, cy)}
        fill="rgba(239,68,68,0.2)"
        stroke="#ef4444"
        strokeWidth={2}
      />

      {/* Axis labels */}
      {stats.map((s, i) => {
        const angle = (360 / AXES) * i
        const { x, y } = polarToXY(angle, r + LABEL_PAD, cx, cy)
        return (
          <text
            key={s.slug}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={10}
            fill="var(--muted, #6b7280)"
            aria-hidden="true"
          >
            {s.label}
          </text>
        )
      })}

      {/* Stat value dots */}
      {stats.map((s, i) => {
        const angle = (360 / AXES) * i
        const ratio = Math.min(s.value / MAX_STAT, 1)
        const { x, y } = polarToXY(angle, ratio * r, cx, cy)
        return (
          <circle key={s.slug} cx={x} cy={y} r={3} fill="#ef4444" aria-hidden="true">
            <title>{s.label}: {s.value}</title>
          </circle>
        )
      })}
    </svg>
  )
}

import { useMemo } from 'react'
import { ATTACK_COVERAGE, ALL_TYPES, TYPE_LABELS_ZH } from '@/lib/typeChart'
import type { PokemonSummary } from '@/types/pokemon'

interface TypeCoverageTableProps {
  teamSummaries: (PokemonSummary | null)[]
}

export default function TypeCoverageTable({ teamSummaries }: TypeCoverageTableProps) {
  const coveredTypes = useMemo(() => {
    const covered = new Set<string>()
    for (const member of teamSummaries) {
      if (!member) continue
      for (const t of member.types) {
        const hits = ATTACK_COVERAGE[t.slug] ?? []
        hits.forEach((target) => covered.add(target))
      }
    }
    return covered
  }, [teamSummaries])

  return (
    <div className="type-coverage">
      <h4>屬性覆蓋</h4>
      <div className="type-coverage__grid">
        {ALL_TYPES.map((slug) => (
          <span
            key={slug}
            className={`type-pill type-${slug}${coveredTypes.has(slug) ? '' : ' type-pill--dim'}`}
            title={coveredTypes.has(slug) ? '有覆蓋' : '未覆蓋'}
          >
            {TYPE_LABELS_ZH[slug]}
          </span>
        ))}
      </div>
    </div>
  )
}

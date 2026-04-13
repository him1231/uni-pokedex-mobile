import { useTypeEffectiveness } from '@/hooks/useTypeEffectiveness'
import { ALL_TYPES, TYPE_LABELS_ZH } from '@/lib/typeChart'
import type { PokemonSummary } from '@/types/pokemon'
import type { TypeEffectivenessEntry } from '@/types/pokemon'

interface WeaknessMatrixProps {
  teamSummaries: (PokemonSummary | null)[]
}

/** Single cell for one attacking type vs. one team slot */
function WeaknessCell({ multiplier }: { multiplier: number | undefined }) {
  if (multiplier === undefined) return <td className="wm-cell wm-cell--empty">—</td>
  if (multiplier === 0) return <td className="wm-cell wm-cell--immune">0</td>
  if (multiplier <= 0.25) return <td className="wm-cell wm-cell--resist2">¼</td>
  if (multiplier <= 0.5) return <td className="wm-cell wm-cell--resist">½</td>
  if (multiplier >= 4) return <td className="wm-cell wm-cell--weak2">4×</td>
  if (multiplier >= 2) return <td className="wm-cell wm-cell--weak">2×</td>
  return <td className="wm-cell wm-cell--neutral" />
}

/** Hook wrapper: loads type effectiveness for one member, returns map */
function useMemberTypeMap(member: PokemonSummary | null): Map<string, number> | null {
  const slugs = member ? member.types.map((t) => t.slug) : []
  const { data } = useTypeEffectiveness(slugs)
  if (!member || !data) return null
  const map = new Map<string, number>()
  for (const entry of (data as TypeEffectivenessEntry[])) {
    map.set(entry.slug, entry.multiplier)
  }
  return map
}

/** Renders a single column (team member) for the matrix */
function MemberColumn({ member }: { member: PokemonSummary | null }) {
  const map = useMemberTypeMap(member)
  return (
    <>
      {ALL_TYPES.map((slug) => (
        <WeaknessCell key={slug} multiplier={map?.get(slug)} />
      ))}
    </>
  )
}

export default function WeaknessMatrix({ teamSummaries }: WeaknessMatrixProps) {
  const activeSummaries = teamSummaries.filter(Boolean) as PokemonSummary[]

  return (
    <div className="weakness-matrix-wrap">
      <h4>弱點矩陣</h4>
      <div className="weakness-matrix-scroll">
        <table className="weakness-matrix">
          <thead>
            <tr>
              <th className="wm-label-col">屬性</th>
              {activeSummaries.map((m) => (
                <th key={m.speciesId} className="wm-member-col">
                  <img src={m.sprite} alt={m.nameZhHant} className="wm-sprite" />
                  <div className="wm-member-name">{m.nameZhHant}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALL_TYPES.map((slug, i) => (
              <tr key={slug}>
                <td className={`wm-type-label type-${slug}`}>{TYPE_LABELS_ZH[slug]}</td>
                {activeSummaries.map((m) => (
                  // Each MemberColumn renders all rows, so here we pluck only row i
                  <MemberColumnCell key={m.speciesId} member={m} typeSlug={slug} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/** Renders one cell for a specific member + type */
function MemberColumnCell({ member, typeSlug }: { member: PokemonSummary; typeSlug: string }) {
  const slugs = member.types.map((t) => t.slug)
  const { data } = useTypeEffectiveness(slugs)
  const multiplier = (data as TypeEffectivenessEntry[] | undefined)?.find(
    (e) => e.slug === typeSlug,
  )?.multiplier
  return <WeaknessCell multiplier={multiplier} />
}

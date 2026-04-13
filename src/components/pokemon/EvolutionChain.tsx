import { Link } from 'react-router-dom'
import type { PokemonSummary } from '@/types/pokemon'

interface EvolutionChainProps {
  evolutionSpeciesIds: number[]
  currentSpeciesId: number
  summaryBySpeciesId: Map<number, PokemonSummary>
}

export default function EvolutionChain({
  evolutionSpeciesIds,
  currentSpeciesId,
  summaryBySpeciesId,
}: EvolutionChainProps) {
  if (!evolutionSpeciesIds || evolutionSpeciesIds.length === 0) return null

  return (
    <section className="detail-section">
      <h3>進化鏈</h3>
      <div className="evolution-family">
        {evolutionSpeciesIds.map((speciesId) => {
          const member = summaryBySpeciesId.get(speciesId)
          if (!member) {
            return (
              <span key={speciesId} className="evolution-chip evolution-chip--ghost">
                #{String(speciesId).padStart(4, '0')}
              </span>
            )
          }
          const isCurrent = member.speciesId === currentSpeciesId
          return (
            <Link
              key={speciesId}
              to={`/pokemon/${member.speciesId}`}
              className={`evolution-chip${isCurrent ? ' is-current' : ''}`}
            >
              <img src={member.sprite} alt={member.nameZhHant} />
              <span>#{String(member.speciesId).padStart(4, '0')}</span>
              <strong>{member.nameZhHant}</strong>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

import { useWorkspaceStore } from '@/store/workspaceStore'
import type { PokemonSummary } from '@/types/pokemon'
import '../pokemon-card.css'

interface PokemonCardProps {
  pokemon: PokemonSummary
  onClick: () => void
}

function formatNo(no: number) {
  return String(no).padStart(4, '0')
}

export default function PokemonCard({ pokemon, onClick }: PokemonCardProps) {
  const speciesId = pokemon.speciesId
  const pins = useWorkspaceStore((s) => s.pins)
  const togglePin = useWorkspaceStore((s) => s.togglePin)
  const addToTeam = useWorkspaceStore((s) => s.addToTeam)
  const isPinned = pins.includes(speciesId)

  return (
    <article
      className={`pokemon-card${pokemon.isChampionsLegal ? '' : ' pokemon-card--not-legal'}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
      aria-label={`${pokemon.nameZhHant}，#${formatNo(speciesId)}`}
    >
      <div className="pokemon-card__thumb">
        <img src={pokemon.sprite} alt={pokemon.nameZhHant} className="pokemon-card__sprite" />
      </div>

      <div className="pokemon-card__body">
        <div className="pokemon-card__topline">
          <span className="pokemon-card__id">#{formatNo(speciesId)}</span>
          <div className="pokemon-card__topline-right">
            {pokemon.isChampionsLegal && (
              <span className="pokemon-card__champions-badge" aria-label="Champions 可用">⚔️</span>
            )}
            <button
              className={`pokemon-card__fav ${isPinned ? 'is-on' : ''}`}
              onClick={(e) => { e.stopPropagation(); togglePin(speciesId) }}
              aria-label={isPinned ? '取消收藏' : '加入收藏'}
              type="button"
            >
              {isPinned ? '★' : '☆'}
            </button>
          </div>
        </div>

        <div className="pokemon-card__name">{pokemon.nameZhHant}</div>
        <div className="pokemon-card__subname">{pokemon.nameEn}</div>
        <div className="pokemon-card__meta">{pokemon.generationLabel}</div>

        <div className="pokemon-card__pills">
          {pokemon.types.map((type) => (
            <span key={type.slug} className={`type-pill type-${type.slug}`}>
              {type.nameZhHant}
            </span>
          ))}
        </div>

        {pokemon.versionTags.length > 0 && (
          <div className="pokemon-card__versions">
            {pokemon.versionTags.map((tag) => (
              <span key={tag.key} className={`version-pill version-pill--${tag.side}`}>
                {tag.shortLabel}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Workspace actions — visible on hover/focus-within */}
      <div className="pokemon-card__actions">
        <button
          type="button"
          className="pokemon-card__action-btn"
          onClick={(e) => { e.stopPropagation(); addToTeam(speciesId) }}
          aria-label={`將 ${pokemon.nameZhHant} 加入隊伍`}
        >
          ＋隊伍
        </button>
      </div>
    </article>
  )
}

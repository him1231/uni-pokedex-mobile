import React from 'react'
import './pokemon-card.css'

function formatNo(no) {
  return String(no).padStart(4, '0')
}

export default function PokemonCard({ pokemon, onClick, isFav, onToggleFav }) {
  return (
    <article className="pokemon-card" onClick={onClick} role="button" tabIndex={0}>
      <div className="pokemon-card__thumb">
        <img src={pokemon.sprite} alt={pokemon.nameZhHant} className="pokemon-card__sprite" />
      </div>

      <div className="pokemon-card__body">
        <div className="pokemon-card__topline">
          <span className="pokemon-card__id">#{formatNo(pokemon.speciesId)}</span>
          <button
            className={`pokemon-card__fav ${isFav ? 'is-on' : ''}`}
            onClick={(event) => {
              event.stopPropagation()
              onToggleFav()
            }}
            aria-label="toggle favorite"
            type="button"
          >
            {isFav ? '★' : '☆'}
          </button>
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
    </article>
  )
}

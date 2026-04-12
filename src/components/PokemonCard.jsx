import React from 'react'
import './pokemon-card.css'

export default function PokemonCard({ pokemon, onClick, isFav, onToggleFav }) {
  return (
    <article className="pc-card" onClick={onClick} role="button">
      <div className="pc-left">
        <img src={pokemon.sprite} alt={pokemon.nameEn} className="pc-sprite" />
      </div>
      <div className="pc-main">
        <div className="pc-id">#{String(pokemon.speciesId).padStart(3, '0')}</div>
        <div className="pc-name">{pokemon.nameZhHant}</div>
        <div className="pc-types">
          {pokemon.types.map((t) => (
            <span key={t.slug} className={`type pill ${t.slug}`}>
              {t.nameZhHant}
            </span>
          ))}
        </div>
      </div>
      <button
        className={`pc-fav ${isFav ? 'on' : ''}`}
        onClick={(e) => {
          e.stopPropagation()
          onToggleFav && onToggleFav()
        }}
        aria-label="toggle favorite"
      >
        {isFav ? '★' : '☆'}
      </button>
    </article>
  )
}

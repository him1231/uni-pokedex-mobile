import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAbilitiesList } from '@/hooks/usePokemonList'
import { useAbilityDetail } from '@/hooks/useAbilityDetail'
import type { AbilitySummary } from '@/types/abilities'

const GENERATION_ORDER = [
  'Gen 1 · 關都', 'Gen 2 · 城都', 'Gen 3 · 豐緣', 'Gen 4 · 神奧', 'Gen 5 · 合眾',
  'Gen 6 · 卡洛斯', 'Gen 7 · 阿羅拉', 'Gen 8 · 伽勒爾 / 洗翠', 'Gen 9 · 帕底亞',
]

function sortByGenerationOrder(arr: string[]): string[] {
  return arr.slice().sort((a, b) => {
    const ai = GENERATION_ORDER.indexOf(a)
    const bi = GENERATION_ORDER.indexOf(b)
    if (ai === -1 && bi === -1) return a.localeCompare(b)
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })
}

export default function AbilityDexPage() {
  useEffect(() => { document.title = '特性圖鑑 | Uni 圖鑑' }, [])
  const { data: abilitiesList = [], isLoading: listLoading } = useAbilitiesList()

  const [abilityQuery, setAbilityQuery] = useState('')
  const [abilityFilterGen, setAbilityFilterGen] = useState('all')
  const [selectedAbility, setSelectedAbility] = useState<AbilitySummary | null>(null)

  const { data: abilityDetail, isLoading: loadingAbilityDetail } = useAbilityDetail(selectedAbility?.id)

  const abilityGenerationOptions = useMemo(() => {
    const set = new Set<string>()
    abilitiesList.forEach((a) => { if (a.generationLabel) set.add(a.generationLabel) })
    return sortByGenerationOrder(Array.from(set))
  }, [abilitiesList])

  const filteredAbilities = useMemo(() => {
    const q = abilityQuery.trim().toLowerCase()
    return abilitiesList.filter((a) => {
      if (q) {
        const match =
          String(a.id) === q ||
          (a.nameZhHant && a.nameZhHant.toLowerCase().includes(q)) ||
          (a.nameEn && a.nameEn.toLowerCase().includes(q)) ||
          (a.slug && a.slug.toLowerCase().includes(q))
        if (!match) return false
      }
      if (abilityFilterGen !== 'all' && a.generationLabel !== abilityFilterGen) return false
      return true
    })
  }, [abilitiesList, abilityQuery, abilityFilterGen])

  return (
    <div className="dex-page">
      <header className="dex-page__header">
        <h1>特性圖鑑</h1>
        <div className="controls">
          <input
            placeholder="搜尋特性或編號 (例：威嚇 / intimidate)"
            value={abilityQuery}
            onChange={(e) => setAbilityQuery(e.target.value)}
            className="search"
          />
          <div className="controls-row">
            <select
              value={abilityFilterGen}
              onChange={(e) => setAbilityFilterGen(e.target.value)}
              className="search"
              aria-label="世代篩選"
            >
              <option value="all">全部世代</option>
              {abilityGenerationOptions.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="dex-page__body">
        {/* Ability list */}
        <div className="move-list dex-page__list">
          {listLoading ? (
            <div className="empty">載入特性中…</div>
          ) : filteredAbilities.length === 0 ? (
            <div className="empty">找不到特性</div>
          ) : (
            filteredAbilities.map((ability) => (
              <button
                key={ability.id}
                type="button"
                className={`move-row${selectedAbility?.id === ability.id ? ' is-active' : ''}`}
                onClick={() => setSelectedAbility(ability)}
              >
                <div className="move-row__main">
                  <div className="move-row__titleline">
                    <strong>{ability.nameZhHant}</strong>
                    <span className="move-row__subname">{ability.nameEn}</span>
                  </div>
                  {ability.generationLabel && (
                    <div className="move-row__meta">
                      <span className="move-meta-pill">{ability.generationLabel}</span>
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Ability detail panel */}
        <div className="move-detail-panel dex-page__detail">
          <div className="move-detail-panel__header">
            <h4>特性詳情</h4>
            <span>{selectedAbility ? '點選其他特性可切換' : '點選左側任一特性查看'}</span>
          </div>
          {!selectedAbility ? (
            <div className="empty-subsection">請先點選一個特性</div>
          ) : loadingAbilityDetail ? (
            <div className="empty-subsection">載入特性詳情中…</div>
          ) : (
            <div className="move-detail-card">
              <div className="move-detail-card__titleline">
                <strong>{selectedAbility.nameZhHant}</strong>
                <span>{selectedAbility.nameEn}</span>
              </div>
              <p className="move-detail-card__effect">
                {abilityDetail?.effect || abilityDetail?.flavorText || '暫時未有簡述。'}
              </p>
              <div className="move-detail-grid">
                <div className="move-detail-item">
                  <span>世代</span>
                  <strong>{abilityDetail?.generationLabel || selectedAbility.generationLabel || '—'}</strong>
                </div>
                <div className="move-detail-item">
                  <span>影響寶可夢數</span>
                  <strong>
                    {abilityDetail?.pokemonCount != null ? (
                      <Link
                        to={`/?ability=${encodeURIComponent(selectedAbility.slug)}`}
                        className="ability-pokemon-link"
                      >
                        {abilityDetail.pokemonCount} 隻
                      </Link>
                    ) : '—'}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

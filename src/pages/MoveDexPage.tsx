import { useMemo, useState } from 'react'
import { useMovesList } from '@/hooks/usePokemonList'
import { useMoveDetail } from '@/hooks/useMoveDetail'
import type { MoveSummary } from '@/types/moves'

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

const TYPE_LABELS: Record<string, string> = {
  normal: '一般', fire: '火', water: '水', electric: '電', grass: '草', ice: '冰',
  fighting: '格鬥', poison: '毒', ground: '地面', flying: '飛行', psychic: '超能力',
  bug: '蟲', rock: '岩石', ghost: '幽靈', dragon: '龍', dark: '惡', steel: '鋼', fairy: '妖精',
}

export default function MoveDexPage() {
  const { data: movesList = [], isLoading: listLoading } = useMovesList()

  const [moveQuery, setMoveQuery] = useState('')
  const [moveFilterType, setMoveFilterType] = useState('all')
  const [moveFilterDamage, setMoveFilterDamage] = useState('all')
  const [moveFilterGen, setMoveFilterGen] = useState('all')
  const [selectedMove, setSelectedMove] = useState<MoveSummary | null>(null)

  const { data: moveDetail, isLoading: loadingMoveDetail } = useMoveDetail(selectedMove?.id)

  const moveGenerationOptions = useMemo(() => {
    const set = new Set<string>()
    movesList.forEach((m) => { if (m.generationLabel) set.add(m.generationLabel) })
    return sortByGenerationOrder(Array.from(set))
  }, [movesList])

  const filteredMoves = useMemo(() => {
    const q = moveQuery.trim().toLowerCase()
    return movesList.filter((m) => {
      if (q) {
        const match =
          String(m.id) === q ||
          (m.nameZhHant && m.nameZhHant.toLowerCase().includes(q)) ||
          (m.nameEn && m.nameEn.toLowerCase().includes(q)) ||
          (m.slug && m.slug.toLowerCase().includes(q))
        if (!match) return false
      }
      if (moveFilterType !== 'all' && (!m.type || m.type.slug !== moveFilterType)) return false
      if (moveFilterDamage !== 'all' && (!m.damageClass || m.damageClass.slug !== moveFilterDamage)) return false
      if (moveFilterGen !== 'all' && m.generationLabel !== moveFilterGen) return false
      return true
    })
  }, [movesList, moveQuery, moveFilterType, moveFilterDamage, moveFilterGen])

  return (
    <div className="dex-page">
      <header className="dex-page__header">
        <h1>招式圖鑑</h1>
        <div className="controls">
          <input
            placeholder="搜尋招式或編號 (例：火焰拳 / fire-punch)"
            value={moveQuery}
            onChange={(e) => setMoveQuery(e.target.value)}
            className="search"
          />
          <div className="controls-row">
            <select
              value={moveFilterType}
              onChange={(e) => setMoveFilterType(e.target.value)}
              className="search"
              aria-label="屬性篩選"
            >
              <option value="all">全部屬性</option>
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v} · {k}</option>
              ))}
            </select>
            <select
              value={moveFilterDamage}
              onChange={(e) => setMoveFilterDamage(e.target.value)}
              className="search"
              aria-label="招式分類篩選"
            >
              <option value="all">全部分類</option>
              <option value="physical">物理</option>
              <option value="special">特殊</option>
              <option value="status">變化</option>
            </select>
            <select
              value={moveFilterGen}
              onChange={(e) => setMoveFilterGen(e.target.value)}
              className="search"
              aria-label="世代篩選"
            >
              <option value="all">全部世代</option>
              {moveGenerationOptions.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="dex-page__body">
        {/* Move list */}
        <div className="move-list dex-page__list">
          {listLoading ? (
            <div className="empty">載入招式中…</div>
          ) : filteredMoves.length === 0 ? (
            <div className="empty">找不到招式</div>
          ) : (
            filteredMoves.map((move) => (
              <button
                key={move.id}
                type="button"
                className={`move-row${selectedMove?.id === move.id ? ' is-active' : ''}`}
                onClick={() => setSelectedMove(move)}
              >
                <div className="move-row__main">
                  <div className="move-row__titleline">
                    <strong>{move.nameZhHant}</strong>
                    <span className="move-row__subname">{move.nameEn}</span>
                  </div>
                  <div className="move-row__meta">
                    {move.type && (
                      <span className={`type-pill type-${move.type.slug}`}>{move.type.nameZhHant}</span>
                    )}
                    {move.damageClass && (
                      <span className="move-meta-pill">{move.damageClass.labelZhHant}</span>
                    )}
                    {move.power != null && <span className="move-meta-pill">威力 {move.power}</span>}
                    {move.accuracy != null && <span className="move-meta-pill">命中 {move.accuracy}</span>}
                    {move.pp != null && <span className="move-meta-pill">PP {move.pp}</span>}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Move detail panel */}
        <div className="move-detail-panel dex-page__detail">
          <div className="move-detail-panel__header">
            <h4>招式詳情</h4>
            <span>{selectedMove ? '點選其他招式可切換' : '點選左側任一招式查看'}</span>
          </div>
          {!selectedMove ? (
            <div className="empty-subsection">請先點選一個招式</div>
          ) : loadingMoveDetail ? (
            <div className="empty-subsection">載入招式詳情中…</div>
          ) : (
            <div className="move-detail-card">
              <div className="move-detail-card__titleline">
                <strong>{selectedMove.nameZhHant}</strong>
                <span>{selectedMove.nameEn}</span>
              </div>
              <div className="move-detail-card__pills">
                {selectedMove.type && (
                  <span className={`type-pill type-${selectedMove.type.slug}`}>{selectedMove.type.nameZhHant}</span>
                )}
                {selectedMove.damageClass && (
                  <span className="move-meta-pill">{selectedMove.damageClass.labelZhHant}</span>
                )}
                {selectedMove.power != null && <span className="move-meta-pill">威力 {selectedMove.power}</span>}
                {selectedMove.accuracy != null && <span className="move-meta-pill">命中 {selectedMove.accuracy}</span>}
                {selectedMove.pp != null && <span className="move-meta-pill">PP {selectedMove.pp}</span>}
              </div>
              <p className="move-detail-card__effect">{moveDetail?.effect || '暫時未有簡述。'}</p>
              <div className="move-detail-grid">
                <div className="move-detail-item"><span>世代</span><strong>{moveDetail?.generationLabel || selectedMove.generationLabel || '—'}</strong></div>
                <div className="move-detail-item"><span>對象</span><strong>{moveDetail?.target || '—'}</strong></div>
                <div className="move-detail-item"><span>異常</span><strong>{moveDetail?.ailment || '—'}</strong></div>
                <div className="move-detail-item"><span>最少命中</span><strong>{moveDetail?.minHits ?? '—'}</strong></div>
                <div className="move-detail-item"><span>最多命中</span><strong>{moveDetail?.maxHits ?? '—'}</strong></div>
                <div className="move-detail-item"><span>吸血</span><strong>{moveDetail?.drain ?? '—'}</strong></div>
                <div className="move-detail-item"><span>治療</span><strong>{moveDetail?.healing ?? '—'}</strong></div>
                <div className="move-detail-item"><span>要害率</span><strong>{moveDetail?.critRate ?? '—'}</strong></div>
                <div className="move-detail-item"><span>畏縮率</span><strong>{moveDetail?.flinchChance ?? '—'}</strong></div>
                <div className="move-detail-item"><span>能力變化率</span><strong>{moveDetail?.statChance ?? '—'}</strong></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

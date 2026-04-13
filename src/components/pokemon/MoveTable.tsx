import { useState } from 'react'
import { useMoveDetail } from '@/hooks/useMoveDetail'
import type { MoveSection, MoveRef } from '@/types/pokemon'

interface MoveTableProps {
  moveSections: MoveSection[]
}

export default function MoveTable({ moveSections }: MoveTableProps) {
  const [selectedMove, setSelectedMove] = useState<MoveRef | null>(null)
  const { data: moveDetail, isLoading: loadingMoveDetail } = useMoveDetail(selectedMove?.moveId)

  if (!moveSections?.length) {
    return <div className="empty-subsection">暫時未有可顯示招式資料</div>
  }

  return (
    <>
      {moveSections.map((section) => (
        <div key={section.key} className="move-section-card">
          <div className="move-section-card__header">
            <strong>{section.label}</strong>
            <span>{section.items.length} 招</span>
          </div>
          <div className="move-list">
            {section.items.map((move) => (
              <button
                key={move.id}
                type="button"
                className={`move-row${selectedMove?.id === move.id ? ' is-active' : ''}`}
                onClick={() => setSelectedMove(selectedMove?.id === move.id ? null : move)}
              >
                <div className="move-row__main">
                  <div className="move-row__titleline">
                    {section.key === 'levelUp' && (
                      <span className="move-row__level">Lv.{move.level}</span>
                    )}
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
                    {move.power !== null && <span className="move-meta-pill">威力 {move.power}</span>}
                    {move.accuracy !== null && <span className="move-meta-pill">命中 {move.accuracy}</span>}
                    {move.pp !== null && <span className="move-meta-pill">PP {move.pp}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Inline move detail panel */}
      <div className="move-detail-panel">
        <div className="move-detail-panel__header">
          <h4>招式詳情</h4>
          <span>{selectedMove ? '點選其他招式可切換' : '點選上面任一招式查看'}</span>
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
              {selectedMove.power !== null && <span className="move-meta-pill">威力 {selectedMove.power}</span>}
              {selectedMove.accuracy !== null && <span className="move-meta-pill">命中 {selectedMove.accuracy}</span>}
              {selectedMove.pp !== null && <span className="move-meta-pill">PP {selectedMove.pp}</span>}
            </div>
            <p className="move-detail-card__effect">{moveDetail?.effect || '暫時未有簡述。'}</p>
            <div className="move-detail-grid">
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
    </>
  )
}

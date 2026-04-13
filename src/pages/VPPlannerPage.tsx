import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

interface VPEntry {
  speciesId: number
  nameZhHant: string
  nameEn: string
  vpCost: number | null
  method: string
  notes: string
}

interface VPData {
  lastUpdated: string
  notes: string
  entries: VPEntry[]
}

const BASE_URL = import.meta.env.BASE_URL as string

function useVPData() {
  return useQuery<VPData>({
    queryKey: ['vpRecruitment'],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}data/vp-recruitment.json`)
      if (!res.ok) throw new Error('VP資料載入失敗')
      return res.json()
    },
    staleTime: Infinity,
  })
}

type SortKey = 'id' | 'name' | 'vpCost'

export default function VPPlannerPage() {
  useEffect(() => { document.title = 'VP 招募計劃 | Uni 圖鑑' }, [])
  const { data, isLoading } = useVPData()
  const [query, setQuery] = useState('')
  const [budget, setBudget] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('id')
  const [sortAsc, setSortAsc] = useState(true)
  const [showUnknownOnly, setShowUnknownOnly] = useState(false)

  const entries = data?.entries ?? []

  const budgetNum = budget.trim() ? parseInt(budget.replace(/[^0-9]/g, ''), 10) : null

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let res = entries.filter((e) => {
      if (q && !e.nameZhHant.toLowerCase().includes(q) && !e.nameEn.toLowerCase().includes(q) && String(e.speciesId) !== q) return false
      if (showUnknownOnly && e.vpCost !== null) return false
      if (budgetNum !== null && e.vpCost !== null && e.vpCost > budgetNum) return false
      return true
    })

    res = [...res].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'id') cmp = a.speciesId - b.speciesId
      else if (sortKey === 'name') cmp = a.nameZhHant.localeCompare(b.nameZhHant)
      else if (sortKey === 'vpCost') {
        const av = a.vpCost ?? Infinity
        const bv = b.vpCost ?? Infinity
        cmp = av - bv
      }
      return sortAsc ? cmp : -cmp
    })
    return res
  }, [entries, query, budgetNum, showUnknownOnly, sortKey, sortAsc])

  const totalDisplayed = useMemo(
    () => filtered.reduce((sum, e) => sum + (e.vpCost ?? 0), 0),
    [filtered],
  )

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v)
    else { setSortKey(key); setSortAsc(true) }
  }

  const sortIcon = (key: SortKey) =>
    sortKey === key ? (sortAsc ? ' ↑' : ' ↓') : ''

  return (
    <div className="vp-page">
      <header className="vp-header">
        <h2>VP 招募計畫</h2>
        {data?.lastUpdated && <div className="hc-updated">資料更新：{data.lastUpdated}</div>}
      </header>

      {/* Controls */}
      <div className="vp-controls">
        <input
          className="search"
          placeholder="搜尋寶可夢名稱或編號"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="搜尋寶可夢"
        />
        <div className="vp-budget-row">
          <label htmlFor="vp-budget" className="vp-budget-label">VP 預算上限：</label>
          <input
            id="vp-budget"
            className="search vp-budget-input"
            type="number"
            min={0}
            placeholder="不限"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            aria-label="VP 預算上限"
          />
        </div>
        <label className="vp-unknown-toggle">
          <input
            type="checkbox"
            checked={showUnknownOnly}
            onChange={(e) => setShowUnknownOnly(e.target.checked)}
          />
          {' '}僅顯示「資料待確認」
        </label>
      </div>

      {isLoading && <div className="empty">載入 VP 資料中…</div>}

      {!isLoading && (
        <>
          <div className="vp-summary">
            共 {filtered.length} 隻
            {budgetNum !== null && ` · 預算 ${budgetNum.toLocaleString()} VP`}
            {filtered.some((e) => e.vpCost !== null) && ` · 合計 ${totalDisplayed.toLocaleString()} VP`}
          </div>

          <div className="vp-table-wrap">
            <table className="vp-table">
              <thead>
                <tr>
                  <th>
                    <button type="button" className="vp-sort-btn" onClick={() => toggleSort('id')}>
                      編號{sortIcon('id')}
                    </button>
                  </th>
                  <th>
                    <button type="button" className="vp-sort-btn" onClick={() => toggleSort('name')}>
                      名稱{sortIcon('name')}
                    </button>
                  </th>
                  <th>
                    <button type="button" className="vp-sort-btn" onClick={() => toggleSort('vpCost')}>
                      VP{sortIcon('vpCost')}
                    </button>
                  </th>
                  <th>方式</th>
                  <th>備註</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.speciesId} className={e.vpCost === null ? 'vp-row--unknown' : ''}>
                    <td className="vp-cell-id">
                      <Link to={`/pokemon/${e.speciesId}`} className="vp-species-link">
                        #{String(e.speciesId).padStart(4, '0')}
                      </Link>
                    </td>
                    <td className="vp-cell-name">
                      <Link to={`/pokemon/${e.speciesId}`} className="vp-species-link">
                        {e.nameZhHant}
                      </Link>
                      <span className="vp-name-en">{e.nameEn}</span>
                    </td>
                    <td className="vp-cell-cost">
                      {e.vpCost === null ? (
                        <span className="vp-unknown">資料待確認</span>
                      ) : (
                        e.vpCost.toLocaleString()
                      )}
                    </td>
                    <td className="vp-cell-method">{e.method}</td>
                    <td className="vp-cell-notes">{e.notes}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="vp-empty">找不到符合條件的寶可夢</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

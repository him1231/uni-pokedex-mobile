import { getChampionsFormsForSpecies, getChampionsMegasForSpecies } from '@/data/championsAvailability'

interface FormTab {
  slug: string
  label: string
  isMega: boolean
}

function labelFromSlug(slug: string): string {
  if (slug.endsWith('-mega-x')) return 'Mega X'
  if (slug.endsWith('-mega-y')) return 'Mega Y'
  if (slug.endsWith('-mega')) return 'Mega'
  if (slug.endsWith('-alola')) return '阿羅拉'
  if (slug.endsWith('-galar')) return '伽勒爾'
  if (slug.endsWith('-hisui')) return '洗翠'
  if (slug.endsWith('-paldea-combat')) return '帕底亞格鬥'
  if (slug.endsWith('-paldea-blaze')) return '帕底亞火焰'
  if (slug.endsWith('-paldea-aqua')) return '帕底亞水流'
  if (slug.endsWith('-paldea')) return '帕底亞'
  // fallback: capitalize last segment
  const parts = slug.split('-')
  return parts[parts.length - 1].charAt(0).toUpperCase() + parts[parts.length - 1].slice(1)
}

interface FormTabStripProps {
  speciesId: number
  baseSlug: string
  activeSlug: string
  onSelectSlug: (slug: string) => void
}

export default function FormTabStrip({ speciesId, baseSlug, activeSlug, onSelectSlug }: FormTabStripProps) {
  const regionalForms = getChampionsFormsForSpecies(speciesId)
  const megaForms = getChampionsMegasForSpecies(speciesId)

  if (regionalForms.length === 0 && megaForms.length === 0) return null

  const tabs: FormTab[] = [
    { slug: baseSlug, label: '通常', isMega: false },
    ...regionalForms.map((slug) => ({ slug, label: labelFromSlug(slug), isMega: false })),
    ...megaForms.map((slug) => ({ slug, label: labelFromSlug(slug), isMega: true })),
  ]

  return (
    <div className="form-tab-strip" role="tablist" aria-label="形態選擇">
      {tabs.map((tab) => (
        <button
          key={tab.slug}
          role="tab"
          type="button"
          aria-selected={activeSlug === tab.slug}
          className={`form-tab${activeSlug === tab.slug ? ' form-tab--active' : ''}${tab.isMega ? ' form-tab--mega' : ''}`}
          onClick={() => onSelectSlug(tab.slug)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

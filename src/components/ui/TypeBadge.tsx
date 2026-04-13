interface TypeBadgeProps {
  slug: string
  nameZhHant?: string
  size?: 'sm' | 'md'
}

export default function TypeBadge({ slug, nameZhHant, size = 'md' }: TypeBadgeProps) {
  return (
    <span
      className={`type-pill type-${slug}${size === 'sm' ? ' type-pill--sm' : ''}`}
    >
      {nameZhHant ?? slug}
    </span>
  )
}

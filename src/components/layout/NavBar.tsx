import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/', label: '圖鑑', icon: '📖', end: true },
  { to: '/moves', label: '招式', icon: '⚡', end: false },
  { to: '/abilities', label: '特性', icon: '✨', end: false },
  { to: '/team', label: '隊伍', icon: '⚔️', end: false },
  { to: '/home-checker', label: 'HOME', icon: '🏠', end: false },
] as const

export default function NavBar() {
  return (
    <nav aria-label="主要導航" className="bottom-nav">
      {NAV_ITEMS.map(({ to, label, icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `bottom-nav__item${isActive ? ' is-active' : ''}`
          }
          aria-label={label}
        >
          <span className="bottom-nav__icon" aria-hidden="true">{icon}</span>
          <span className="bottom-nav__label">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

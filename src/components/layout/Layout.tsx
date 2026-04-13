import { Outlet } from 'react-router-dom'
import NavBar from './NavBar'
import '@/App.css'

export default function Layout() {
  return (
    <div className="app-root">
      <a href="#main-content" className="skip-link">跳至主要內容</a>
      <main id="main-content" className="main-content">
        <Outlet />
      </main>
      <NavBar />
    </div>
  )
}

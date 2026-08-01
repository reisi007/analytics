import { useEffect, useRef, useState } from 'react'
import { Navigate, NavLink, Outlet, Route, Routes, useNavigate } from 'react-router'
import { SiteFavicon } from './components/SiteFavicon'
import { SiteProvider, useSite } from './context/SiteContext'
import { ToastProvider } from './context/ToastContext'
import { getUser, isAuthenticated, logout } from './lib/auth'
import { EventsPage } from './pages/EventsPage'
import { LoginPage } from './pages/LoginPage'
import { OverviewPage } from './pages/OverviewPage'
import { RealtimePage } from './pages/RealtimePage'
import { SitesPage } from './pages/SitesPage'

export function ProtectedRoute() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}

function Brand() {
  const { site } = useSite()
  return (
    <div className="flex items-center gap-2 px-2">
      <picture>
        <source srcSet="/favicon.svg" type="image/svg+xml" />
        <img src="/favicon.ico" alt="Analytics Logo" className="h-8 w-8 rounded-box" />
      </picture>
      <span className="text-xl font-semibold">{site === '' ? 'Alle Sites' : site}</span>
    </div>
  )
}

function SiteSwitcher() {
  const { site, setSite, sites } = useSite()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const select = (value: string) => {
    setSite(value)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="dropdown dropdown-end">
      <button
        type="button"
        className="btn btn-sm btn-ghost gap-2"
        aria-label="Site auswählen"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <SiteFavicon site={site} className="h-5 w-5" />
        <span className="max-w-40 truncate">{site === '' ? 'Alle Sites' : site}</span>
      </button>
      {open && (
        <ul
          role="menu"
          className="menu dropdown-content z-30 max-h-96 w-64 overflow-y-auto rounded-box border border-base-300 bg-base-100 shadow-lg"
        >
          <li>
            <button type="button" role="menuitem" className="flex items-center gap-2" onClick={() => select('')}>
              <SiteFavicon site="" />
              <span className="truncate">Alle Sites</span>
            </button>
          </li>
          {sites.map((name) => (
            <li key={name}>
              <button
                type="button"
                role="menuitem"
                className={`flex items-center gap-2 ${site === name ? 'menu-active' : ''}`}
                onClick={() => select(name)}
              >
                <SiteFavicon site={name} />
                <span className="truncate">{name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function AuthControls() {
  const navigate = useNavigate()
  const user = getUser()

  if (!isAuthenticated()) {
    return (
      <NavLink to="/login" className="btn btn-ghost btn-sm">
        Anmelden
      </NavLink>
    )
  }

  return (
    <>
      {user?.email && <span className="text-sm text-base-content/70">{user.email}</span>}
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => {
          void logout().then(() => navigate('/login'))
        }}
      >
        Abmelden
      </button>
    </>
  )
}

function DashboardLayout() {
  return (
    <div className="min-h-screen bg-base-200">
      <div className="navbar bg-base-100 shadow-sm">
        <div className="flex-1">
          <Brand />
        </div>
        <div className="flex-none">
          <ul className="menu menu-horizontal px-1">
            <li>
              <NavLink
                to="/"
                end
                className={({ isActive }) => (isActive ? 'btn btn-ghost btn-active' : 'btn btn-ghost')}
              >
                Übersicht
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/realtime"
                className={({ isActive }) => (isActive ? 'btn btn-ghost btn-active' : 'btn btn-ghost')}
              >
                Echtzeit
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/events"
                className={({ isActive }) => (isActive ? 'btn btn-ghost btn-active' : 'btn btn-ghost')}
              >
                Events
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/sites"
                className={({ isActive }) => (isActive ? 'btn btn-ghost btn-active' : 'btn btn-ghost')}
              >
                Sites
              </NavLink>
            </li>
          </ul>
          <SiteSwitcher />
          <AuthControls />
        </div>
      </div>
      <main className="p-4">
        <Outlet />
      </main>
    </div>
  )
}

export function App() {
  return (
    <ToastProvider>
      <SiteProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route index element={<OverviewPage />} />
              <Route path="/realtime" element={<RealtimePage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/sites" element={<SitesPage />} />
            </Route>
          </Route>
        </Routes>
      </SiteProvider>
    </ToastProvider>
  )
}

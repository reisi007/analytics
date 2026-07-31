import { Navigate, NavLink, Outlet, Route, Routes, useNavigate } from 'react-router-dom'
import { SiteProvider, useSite } from './context/SiteContext'
import { getUser, isAuthenticated, logout } from './lib/auth'
import { EventsPage } from './pages/EventsPage'
import { LoginPage } from './pages/LoginPage'
import { OverviewPage } from './pages/OverviewPage'
import { RealtimePage } from './pages/RealtimePage'

export function ProtectedRoute() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}

function Brand() {
  const { site } = useSite()
  return <span className="px-2 text-xl font-semibold">{site === '' ? 'Alle Sites' : site}</span>
}

function SiteSwitcher() {
  const { site, setSite, sites } = useSite()
  return (
    <select
      value={site}
      onChange={(event) => setSite(event.target.value)}
      className="select select-sm select-bordered"
      aria-label="Site auswählen"
    >
      <option value="">Alle Sites</option>
      {sites.map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </select>
  )
}

function AuthControls() {
  const navigate = useNavigate()
  const user = getUser() as { email?: string } | null

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
    <SiteProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<OverviewPage />} />
            <Route path="/realtime" element={<RealtimePage />} />
            <Route path="/events" element={<EventsPage />} />
          </Route>
        </Route>
      </Routes>
    </SiteProvider>
  )
}

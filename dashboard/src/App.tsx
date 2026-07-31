import { NavLink, Outlet } from 'react-router-dom'
import { currentSite } from './lib/site'

export function App() {
  const site = currentSite()

  return (
    <div className="min-h-screen bg-base-200">
      <div className="navbar bg-base-100 shadow-sm">
        <div className="flex-1">
          <span className="px-2 text-xl font-semibold">{site}</span>
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
        </div>
      </div>
      <main className="p-4">
        <Outlet />
      </main>
    </div>
  )
}

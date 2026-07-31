import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { App } from './App'
import './index.css'
import { EventsPage } from './pages/EventsPage'
import { OverviewPage } from './pages/OverviewPage'
import { RealtimePage } from './pages/RealtimePage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<App />}>
          <Route index element={<OverviewPage />} />
          <Route path="/realtime" element={<RealtimePage />} />
          <Route path="/events" element={<EventsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)

import { useEffect, useState } from 'react'
import { ApiErrorAlert } from '../components/ApiErrorAlert'
import { useSite } from '../context/SiteContext'
import { useToast } from '../context/ToastContext'
import { createSite, deleteSite, fetchSitesAll, updateSite, type SiteRow } from '../lib/api'

const HOSTNAME_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/

function normalizeHostname(value: string): string | null {
  const cleaned = value.trim().toLowerCase().replace(/^https?:\/\//, '')
  if (cleaned.length === 0 || cleaned.length > 253) return null
  return HOSTNAME_PATTERN.test(cleaned) ? cleaned : null
}

function splitAliases(value: string): string[] {
  return value
    .split(',')
    .map((part) => normalizeHostname(part) ?? '')
    .filter((part) => part.length > 0)
}

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

function SiteForm({ onCreated }: { onCreated: () => void }) {
  const { refresh } = useSite()
  const toast = useToast()
  const [siteName, setSiteName] = useState('')
  const [aliases, setAliases] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    const site = siteName.trim()
    if (!site) {
      toast.error('Name erforderlich')
      return
    }
    const aliasesList = splitAliases(aliases)
    if (aliasesList.length === 0 && aliases.trim().length > 0) {
      toast.error('Alle Aliases sind ungültig')
      return
    }
    setSubmitting(true)
    try {
      await createSite({ site, aliases: aliasesList })
      toast.success('Site angelegt')
      setSiteName('')
      setAliases('')
      refresh()
      onCreated()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Fehler')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <h2 className="card-title text-base">Neue Site</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            type="text"
            value={siteName}
            onChange={(event) => setSiteName(event.target.value)}
            placeholder="z. B. Mein Blog"
            aria-label="Site-Name"
            className="input input-bordered w-full"
          />
          <input
            type="text"
            value={aliases}
            onChange={(event) => setAliases(event.target.value)}
            placeholder="Aliases (kommagetrennt)"
            aria-label="Aliases"
            className="input input-bordered w-full"
          />
        </div>
        <div>
          <button type="button" onClick={() => void submit()} disabled={submitting} className="btn btn-primary btn-sm">
            Site hinzufügen
          </button>
        </div>
      </div>
    </div>
  )
}

function EditModal({ row, onClose, onSaved }: { row: SiteRow | null; onClose: () => void; onSaved: () => void }) {
  const { refresh } = useSite()
  const toast = useToast()
  const [aliases, setAliases] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setAliases(row?.aliases.join(', ') ?? '')
  }, [row])

  const save = async () => {
    if (!row) return
    const aliasesList = splitAliases(aliases)
    if (aliasesList.length === 0 && aliases.trim().length > 0) {
      toast.error('Alle Aliases sind ungültig')
      return
    }
    setSubmitting(true)
    try {
      await updateSite(row.id, { aliases: aliasesList })
      toast.success('Site aktualisiert')
      refresh()
      onSaved()
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Fehler')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    row && (
      <dialog open className="modal modal-open" role="dialog" aria-modal="true">
        <div className="modal-box">
          <h2 className="text-lg font-semibold">Site bearbeiten</h2>
          <p className="mt-1 text-sm text-base-content/70">
            {row.site}
          </p>
          <label className="label" htmlFor="edit-aliases">
            <span className="label-text">Aliases (kommagetrennt)</span>
          </label>
          <input
            id="edit-aliases"
            type="text"
            value={aliases}
            onChange={(event) => setAliases(event.target.value)}
            className="input input-bordered w-full"
          />
          <div className="modal-action">
            <button type="button" className="btn btn-sm" onClick={onClose}>
              Abbrechen
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => void save()} disabled={submitting}>
              Speichern
            </button>
          </div>
        </div>
        <div className="modal-backdrop" onClick={onClose} />
      </dialog>
    )
  )
}

function DeleteModal({ row, onClose, onDeleted }: { row: SiteRow | null; onClose: () => void; onDeleted: () => void }) {
  const { refresh } = useSite()
  const toast = useToast()
  const [deleteData, setDeleteData] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setDeleteData(false)
  }, [row])

  const confirmDelete = async () => {
    if (!row) return
    setSubmitting(true)
    try {
      await deleteSite(row.id, deleteData)
      toast.success(deleteData ? 'Site und Daten gelöscht' : 'Site gelöscht')
      refresh()
      onDeleted()
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Fehler')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    row && (
      <dialog open className="modal modal-open" role="dialog" aria-modal="true">
        <div className="modal-box">
          <h2 className="text-lg font-semibold">Site löschen</h2>
          <p className="mt-1 text-sm">
            Site „{row.site}“ löschen? Ohne Datenlöschung bleibt der Eintrag aus dem Tracker entfernt, historische Daten
            bleiben erhalten.
          </p>
          <label className="label cursor-pointer justify-start gap-3">
            <input
              type="checkbox"
              checked={deleteData}
              onChange={(event) => setDeleteData(event.target.checked)}
              className="checkbox checkbox-error checkbox-sm"
            />
            <span className="label-text">Getrackte Daten mitlöschen (unwiderruflich)</span>
          </label>
          <div className="modal-action">
            <button type="button" className="btn btn-sm" onClick={onClose}>
              Abbrechen
            </button>
            <button
              type="button"
              className="btn btn-error btn-sm"
              onClick={() => void confirmDelete()}
              disabled={submitting}
            >
              Löschen
            </button>
          </div>
        </div>
        <div className="modal-backdrop" onClick={onClose} />
      </dialog>
    )
  )
}

export function SitesPage() {
  const [rows, setRows] = useState<SiteRow[]>([])
  const [error, setError] = useState<unknown>(null)
  const [editRow, setEditRow] = useState<SiteRow | null>(null)
  const [deleteRow, setDeleteRow] = useState<SiteRow | null>(null)
  const [reloadVersion, setReloadVersion] = useState(0)

  useEffect(() => {
    let cancelled = false
    setError(null)
    fetchSitesAll()
      .then((data) => {
        if (!cancelled) setRows(data)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err)
      })
    return () => {
      cancelled = true
    }
  }, [reloadVersion])

  const reload = () => setReloadVersion((version) => version + 1)

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Sites</h1>

      <SiteForm onCreated={reload} />

      {error != null && <ApiErrorAlert error={error} />}

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Site</th>
                  <th>Aliases</th>
                  <th>Erstellt</th>
                  <th>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="font-mono text-xs">{row.site}</td>
                    <td>
                      {row.aliases.length === 0 ? (
                        <span>–</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {row.aliases.map((alias) => (
                            <span key={alias} className="badge badge-ghost badge-sm font-mono">
                              {alias}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="text-xs">{formatDate(row.created_at)}</td>
                    <td>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          onClick={() => setEditRow(row)}
                        >
                          Bearbeiten
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          onClick={() => setDeleteRow(row)}
                        >
                          Löschen
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <EditModal row={editRow} onClose={() => setEditRow(null)} onSaved={reload} />
      <DeleteModal row={deleteRow} onClose={() => setDeleteRow(null)} onDeleted={reload} />
    </div>
  )
}

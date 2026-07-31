import { ApiError, type ApiErrorDetails } from '../lib/api'

interface ApiErrorAlertProps {
  error: unknown
}

function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

function formatLocation(details: ApiErrorDetails): string | null {
  if (details.file && details.line != null) return `${details.file}:${details.line}`
  if (details.file) return details.file
  return null
}

export function ApiErrorAlert({ error }: ApiErrorAlertProps) {
  if (!error) return null

  const apiError = isApiError(error) ? error : null
  const status = apiError?.status
  const details = apiError?.details
  const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
  const location = details ? formatLocation(details) : null
  const hasTrace = Array.isArray(details?.trace) && details.trace.length > 0

  return (
    <div role="alert" className="alert alert-error alert-vertical sm:alert-horizontal">
      <div className="w-full space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {status != null && <span className="badge badge-error badge-outline">{status}</span>}
          <span className="font-semibold">{message}</span>
        </div>
        {details && (
          <details className="collapse collapse-arrow">
            <summary className="collapse-title px-0 text-xs text-base-content/80">
              {details.exception ?? 'Details'}
              {location ? ` · ${location}` : ''}
            </summary>
            <div className="collapse-content px-0">
              <pre className="max-h-64 overflow-auto rounded-box bg-base-100 p-3 font-mono text-xs">
                {hasTrace ? JSON.stringify(details.trace, null, 2) : details.message}
              </pre>
            </div>
          </details>
        )}
      </div>
    </div>
  )
}

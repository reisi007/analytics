import { ApiError } from '../lib/api'

interface ApiErrorAlertProps {
  error: unknown
}

function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function ApiErrorAlert({ error }: ApiErrorAlertProps) {
  if (!error) return null

  const apiError = isApiError(error) ? error : null
  const status = apiError?.status
  const message = error instanceof Error ? error.message : 'Unbekannter Fehler'

  return (
    <div role="alert" className="alert alert-error alert-vertical sm:alert-horizontal">
      <div className="flex flex-wrap items-center gap-2">
        {status != null && <span className="badge badge-error badge-outline">{status}</span>}
        <span className="font-semibold">{message}</span>
      </div>
    </div>
  )
}

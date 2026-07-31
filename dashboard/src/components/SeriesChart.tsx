import type { SeriesPoint } from '../lib/api'

const HEIGHT_CLASSES = [
  'h-1',
  'h-2',
  'h-3',
  'h-4',
  'h-5',
  'h-6',
  'h-7',
  'h-8',
  'h-9',
  'h-10',
  'h-11',
  'h-12',
  'h-14',
  'h-16',
  'h-20',
  'h-24',
  'h-28',
  'h-32',
  'h-36',
  'h-40',
]

function heightClass(value: number, max: number): string {
  if (max <= 0) return 'h-1'
  const index = Math.min(HEIGHT_CLASSES.length - 1, Math.floor((value / max) * HEIGHT_CLASSES.length))
  return HEIGHT_CLASSES[index]
}

export function SeriesChart({ series }: { series: SeriesPoint[] }) {
  const max = Math.max(...series.map((point) => point.pageviews), 0)

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <h2 className="card-title">Seitenaufrufe pro Tag</h2>
        <div className="flex h-40 items-end gap-1">
          {series.map((point) => (
            <div
              key={point.date}
              title={`${point.date}: ${point.pageviews}`}
              className="flex min-w-0 flex-1 flex-col items-center gap-1"
            >
              <div className={`w-full rounded bg-primary ${heightClass(point.pageviews, max)}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

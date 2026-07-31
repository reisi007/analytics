export function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="stat">
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value.toLocaleString()}</div>
      </div>
    </div>
  )
}

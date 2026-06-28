import DashboardCard from './DashboardCard'

// Backwards-compatible wrapper that now delegates to the reusable
// DashboardCard component. Legacy call sites pass { label, value, delta, up }.
// New call sites can pass any DashboardCard prop directly.
export default function StatCard({ label, value, delta, up, ...rest }) {
  const legacyTrend =
    typeof delta === 'string'
      ? (Number(String(delta).replace(/[^0-9.\-]/g, '')) || 0) * (up ? 1 : -1)
      : undefined

  const numericValue =
    typeof value === 'string'
      ? Number(String(value).replace(/[^0-9.\-]/g, '')) || 0
      : value

  return (
    <DashboardCard
      title={label ?? rest.title}
      value={numericValue}
      trend={rest.trend ?? legacyTrend ?? 0}
      {...rest}
    />
  )
}
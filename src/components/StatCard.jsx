import { Card, CardContent } from '@/components/ui/card'

export default function StatCard({ label, value, delta, up }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
          {label}
        </p>
        <p className="text-2xl font-medium">{value}</p>
        <p className={`text-xs mt-1 ${up ? 'text-green-600' : 'text-red-500'}`}>
          {delta}
        </p>
      </CardContent>
    </Card>
  )
}
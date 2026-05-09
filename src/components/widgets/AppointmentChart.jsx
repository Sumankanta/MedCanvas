import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'

export default function AppointmentChart({ data }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Appointment Trends</CardTitle>
        <p className="text-xs text-muted-foreground">This week</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="confirmed" fill="#3b82f6" stackId="a" />
            <Bar dataKey="pending"   fill="#f59e0b" stackId="a" />
            <Bar dataKey="cancelled" fill="#ef4444" stackId="a" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
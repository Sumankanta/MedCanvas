import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const levelStyles = {
  critical: 'bg-red-50 text-red-600 border-red-200',
  warning:  'bg-yellow-50 text-yellow-600 border-yellow-200',
  info:     'bg-blue-50 text-blue-600 border-blue-200',
}

const badgeStyles = {
  critical: 'bg-red-100 text-red-600',
  warning:  'bg-yellow-100 text-yellow-600',
  info:     'bg-blue-100 text-blue-600',
}

export default function AlertsWidget({ alerts, appointments }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Alerts & Appointments</CardTitle>
        <p className="text-xs text-muted-foreground">Today</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">

        {/* Alerts */}
        {alerts.map((alert, i) => (
          <div key={i} className={`flex items-start gap-2 rounded-md border px-3 py-2 text-xs ${levelStyles[alert.level]}`}>
            <Badge className={`text-[10px] px-1.5 py-0 mt-0.5 ${badgeStyles[alert.level]}`}>
              {alert.level}
            </Badge>
            <div>
              <p>{alert.text}</p>
              <p className="opacity-60 mt-0.5">{alert.time}</p>
            </div>
          </div>
        ))}

        {/* Appointments Table */}
        <table className="w-full text-xs mt-2">
          <thead>
            <tr className="border-b">
              <th className="text-left py-1 font-medium text-muted-foreground">Patient</th>
              <th className="text-left py-1 font-medium text-muted-foreground">Doctor</th>
              <th className="text-left py-1 font-medium text-muted-foreground">Time</th>
              <th className="text-left py-1 font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="py-1.5">{a.patient}</td>
                <td className="py-1.5">{a.doctor}</td>
                <td className="py-1.5">{a.time}</td>
                <td className="py-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium
                    ${a.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      a.status === 'pending'   ? 'bg-yellow-100 text-yellow-700' :
                                                 'bg-red-100 text-red-600'}`}>
                    {a.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

      </CardContent>
    </Card>
  )
}
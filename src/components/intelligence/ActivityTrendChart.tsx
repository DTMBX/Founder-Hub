import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import type { ActivityBucket } from '@/lib/ecosystem-intelligence'

interface ActivityTrendChartProps {
  data: ActivityBucket[]
}

export default function ActivityTrendChart({ data }: ActivityTrendChartProps) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No activity data available.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
        <XAxis
          dataKey="month"
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
          axisLine={{ stroke: 'hsl(var(--border) / 0.4)' }}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
          axisLine={{ stroke: 'hsl(var(--border) / 0.4)' }}
        />
        <Tooltip
          contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
          itemStyle={{ color: 'hsl(var(--foreground))' }}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke="#34d399"
          strokeWidth={2}
          dot={{ r: 4, fill: '#34d399', strokeWidth: 0 }}
          activeDot={{ r: 6, fill: '#34d399', strokeWidth: 2, stroke: 'hsl(var(--background))' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface LanguageDistributionChartProps {
  data: Record<string, number>
}

export default function LanguageDistributionChart({ data }: LanguageDistributionChartProps) {
  const chartData = Object.entries(data)
    .map(([language, count]) => ({ language, count }))
    .sort((a, b) => b.count - a.count)

  if (chartData.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No language data available.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
        <XAxis
          dataKey="language"
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
          cursor={{ fill: 'hsl(var(--muted) / 0.2)' }}
        />
        <Bar dataKey="count" fill="#60a5fa" radius={[4, 4, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  )
}

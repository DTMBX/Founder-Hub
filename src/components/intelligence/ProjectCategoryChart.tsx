import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

const COLORS = ['#34d399', '#60a5fa', '#f59e0b', '#a78bfa', '#fb7185', '#2dd4bf']

interface ProjectCategoryChartProps {
  data: Record<string, number>
}

export default function ProjectCategoryChart({ data }: ProjectCategoryChartProps) {
  const chartData = Object.entries(data).map(([name, value]) => ({ name, value }))

  if (chartData.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No category data available.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
          nameKey="name"
          stroke="transparent"
        >
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
          itemStyle={{ color: 'hsl(var(--foreground))' }}
        />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          iconSize={8}
          formatter={(value: string) => <span className="text-xs text-muted-foreground">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

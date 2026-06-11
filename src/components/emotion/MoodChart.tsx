import { useEmotion } from '../../hooks/useEmotion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface MoodChartProps {
  days?: number
  compact?: boolean
}

export default function MoodChart({ days = 7, compact = false }: MoodChartProps) {
  const { report, loading } = useEmotion(days)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-sister-muted">加载中...</div>
      </div>
    )
  }

  if (!report || !report.dailyScores || report.dailyScores.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-3xl mb-2">📊</div>
        <p className="text-sm text-sister-muted">
          还没有足够的情绪数据
        </p>
        <p className="text-xs text-sister-muted mt-1">
          多和晓语聊聊天吧~
        </p>
      </div>
    )
  }

  const data = report.dailyScores.map((d) => ({
    ...d,
    dateLabel: d.date.slice(5), // MM-DD
  }))

  return (
    <div className={compact ? 'h-40' : 'h-56'}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0e0e8" />
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 11, fill: '#9b8a97' }}
            axisLine={{ stroke: '#f0d8e4' }}
            tickLine={false}
          />
          {!compact && (
            <YAxis
              domain={[-1, 1]}
              ticks={[-1, -0.5, 0, 0.5, 1]}
              tick={{ fontSize: 11, fill: '#9b8a97' }}
              axisLine={false}
              tickLine={false}
            />
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #f0d8e4',
              borderRadius: '12px',
              fontSize: '13px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            }}
            formatter={(value: number) => {
              const label = value >= 0.5 ? '😊 积极' : value >= 0 ? '🙂 中性' : value >= -0.5 ? '😔 低落' : '😢 悲伤'
              return [label, '情绪指数']
            }}
            labelFormatter={(label: string) => `日期: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#e8a0b4"
            strokeWidth={2.5}
            dot={{ fill: '#ec4899', r: 4, strokeWidth: 2, stroke: 'white' }}
            activeDot={{ fill: '#db2777', r: 6, strokeWidth: 3, stroke: 'white' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

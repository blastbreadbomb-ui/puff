import { useEmotion } from "../../hooks/useEmotion"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"

interface MoodChartProps {
  days?: number
  compact?: boolean
}

export default function MoodChart({ days = 7, compact = false }: MoodChartProps) {
  const { report, loading } = useEmotion(days)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-pink-200 border-t-pink-400 rounded-full animate-spin" />
          <span className="text-sm text-sister-muted">加载中...</span>
        </div>
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
    dateLabel: d.date.slice(5),
  }))

  const gradientId = "moodGradient"

  return (
    <div className={compact ? "h-40" : "h-56"}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: compact ? 0 : -20, bottom: 5 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ec4899" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#fce7f3" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5e0eb" vertical={false} />
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 11, fill: "#9b8a97" }}
            axisLine={{ stroke: "#f0d8e4" }}
            tickLine={false}
          />
          {!compact && (
            <YAxis
              domain={[-1, 1]}
              ticks={[-1, -0.5, 0, 0.5, 1]}
              tick={{ fontSize: 11, fill: "#9b8a97" }}
              axisLine={false}
              tickLine={false}
            />
          )}
          <ReferenceLine y={0} stroke="#e8d0da" strokeDasharray="4 4" />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #f0d8e4",
              borderRadius: "12px",
              fontSize: "13px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              padding: "8px 12px",
            }}
            formatter={(value: number) => {
              const label = value >= 0.5 ? "😊 积极" : value >= 0 ? "😐 中性" : value >= -0.5 ? "😞 低落" : "😢 悲伤"
              return [label, "情绪指数"]
            }}
            labelFormatter={(label: string) => `日期: ${label}`}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#ec4899"
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            dot={{ fill: "#ec4899", r: 3.5, strokeWidth: 2, stroke: "white" }}
            activeDot={{ fill: "#db2777", r: 6, strokeWidth: 3, stroke: "white" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

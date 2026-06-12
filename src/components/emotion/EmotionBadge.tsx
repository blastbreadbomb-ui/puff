interface EmotionBadgeProps {
  emotion: string
  intensity?: string
  size?: "sm" | "md"
}

const emotionColors: Record<string, string> = {
  "喜悦": "bg-amber-50 text-amber-700 border-amber-200",
  "开心": "bg-amber-50 text-amber-700 border-amber-200",
  "快乐": "bg-amber-50 text-amber-700 border-amber-200",
  "悲伤": "bg-blue-50 text-blue-700 border-blue-200",
  "难过": "bg-blue-50 text-blue-700 border-blue-200",
  "焦虑": "bg-orange-50 text-orange-700 border-orange-200",
  "抑郁": "bg-slate-50 text-slate-700 border-slate-200",
  "愤怒": "bg-red-50 text-red-700 border-red-200",
  "委屈": "bg-purple-50 text-purple-700 border-purple-200",
  "孤独": "bg-gray-50 text-gray-700 border-gray-200",
  "恐惧": "bg-violet-50 text-violet-700 border-violet-200",
  "内疚": "bg-rose-50 text-rose-700 border-rose-200",
  "疲惫": "bg-stone-50 text-stone-700 border-stone-200",
  "迷茫": "bg-teal-50 text-teal-700 border-teal-200",
  "感动": "bg-pink-50 text-pink-700 border-pink-200",
  "释然": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "压抑": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "期待": "bg-yellow-50 text-yellow-700 border-yellow-200",
}

const intensityLabels: Record<string, string> = {
  "mild": "轻度",
  "moderate": "中度",
  "intense": "强烈",
}

const emotionEmojis: Record<string, string> = {
  "喜悦": "😊",
  "开心": "😄",
  "快乐": "😁",
  "悲伤": "😢",
  "难过": "😞",
  "焦虑": "😰",
  "抑郁": "😔",
  "愤怒": "😠",
  "委屈": "🥺",
  "孤独": "🫂",
  "恐惧": "😨",
  "内疚": "😣",
  "疲惫": "😮‍💨",
  "迷茫": "😶",
  "感动": "🥲",
  "释然": "😌",
  "压抑": "😟",
  "期待": "🤩",
}

export default function EmotionBadge({ emotion, intensity, size = "md" }: EmotionBadgeProps) {
  const colorClasses = emotionColors[emotion] || "bg-gray-50 text-gray-700 border-gray-200"
  const sizeClasses = size === "sm" ? "text-[11px] px-2 py-0.5" : "text-xs px-2.5 py-1"
  const emoji = emotionEmojis[emotion]

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border ${colorClasses} ${sizeClasses} font-medium shadow-sm`}
      title={`情绪强度: ${intensity ? intensityLabels[intensity] : "未知"}`}
    >
      {emoji && <span className="text-xs leading-none">{emoji}</span>}
      {emotion}
      {intensity && size === "md" && (
        <span className="opacity-50 text-[10px]">
          · {intensityLabels[intensity]}
        </span>
      )}
    </span>
  )
}

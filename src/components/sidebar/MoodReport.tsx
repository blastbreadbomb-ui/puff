import { useState } from 'react'
import MoodChart from '../emotion/MoodChart'
import { useEmotion } from '../../hooks/useEmotion'

export default function MoodReport() {
  const [days] = useState(7)
  const { report, loading } = useEmotion(days)

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-sister-text mb-3">情绪趋势</h3>

      {/* Chart */}
      <div className="bg-white rounded-xl p-3 border border-pink-50 mb-4">
        <MoodChart days={days} compact />
      </div>

      {/* Summary */}
      {report && !loading && (
        <div className="space-y-3">
          <div className="bg-white rounded-xl p-3 border border-pink-50">
            <h4 className="text-xs font-medium text-sister-muted mb-1">主导情绪</h4>
            <p className="text-lg font-semibold text-sister-text">
              {report.dominantEmotion || '暂无'}
            </p>
          </div>

          {report.summary && (
            <div className="bg-white rounded-xl p-3 border border-pink-50">
              <h4 className="text-xs font-medium text-sister-muted mb-1">晓语的话</h4>
              <p className="text-sm text-sister-text leading-relaxed">
                {report.summary}
              </p>
            </div>
          )}

          {report.suggestion && (
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-3 border border-pink-100">
              <h4 className="text-xs font-medium text-pink-600 mb-1">💡 小建议</h4>
              <p className="text-sm text-sister-text leading-relaxed">
                {report.suggestion}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Emotional distribution */}
      {report?.emotionDistribution && Object.keys(report.emotionDistribution).length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-medium text-sister-muted mb-2">情绪分布</h4>
          <div className="space-y-1.5">
            {Object.entries(report.emotionDistribution)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([emotion, count]) => (
                <div key={emotion} className="flex items-center gap-2">
                  <span className="text-xs text-sister-text w-12 truncate">{emotion}</span>
                  <div className="flex-1 h-2 bg-pink-50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-pink-300 rounded-full transition-all"
                      style={{
                        width: `${Math.round((count / Math.max(...Object.values(report.emotionDistribution!))) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-sister-muted w-6 text-right">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

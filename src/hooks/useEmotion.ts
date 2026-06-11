import { useEffect, useState } from 'react'
import { getEmotionReport, getEmotionTrend } from '../services/api'
import type { MoodReport, EmotionRecord } from '../types'

export function useEmotion(days: number = 7) {
  const [report, setReport] = useState<MoodReport | null>(null)
  const [trend, setTrend] = useState<EmotionRecord[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [reportData, trendData] = await Promise.all([
          getEmotionReport(days),
          getEmotionTrend(days),
        ])
        setReport(reportData)
        setTrend(trendData)
      } catch (err) {
        console.error('Failed to fetch emotion data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [days])

  return { report, trend, loading }
}

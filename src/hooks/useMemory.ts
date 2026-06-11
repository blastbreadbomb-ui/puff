import { useEffect, useState, useCallback } from 'react'
import { getMemories, deleteMemory } from '../services/api'
import type { UserMemory } from '../types'

export function useMemory() {
  const [memories, setMemories] = useState<UserMemory[]>([])
  const [loading, setLoading] = useState(false)

  const fetchMemories = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getMemories()
      setMemories(data)
    } catch (err) {
      console.error('Failed to fetch memories:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const removeMemory = useCallback(async (id: string) => {
    try {
      await deleteMemory(id)
      setMemories((prev) => prev.filter((m) => m.id !== id))
    } catch (err) {
      console.error('Failed to delete memory:', err)
    }
  }, [])

  useEffect(() => {
    fetchMemories()
  }, [fetchMemories])

  return { memories, loading, removeMemory, refresh: fetchMemories }
}

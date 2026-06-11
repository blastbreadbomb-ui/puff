import type {
  ChatRequest,
  Conversation,
  MoodReport,
  UserMemory,
  EmotionRecord,
} from '../types'

const getApiUrl = (): string => {
  // Electron desktop app: backend runs as a separate local process
  if (typeof window !== 'undefined' && window.electronAPI) {
    return 'http://127.0.0.1:8899'
  }
  // Production: use build-time configured backend URL (e.g. Netlify → Render)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  // Dev: use relative paths — Vite proxy forwards /api/* → localhost:8899
  return ''
}

// ========== Chat API ==========
export async function sendMessage(
  request: ChatRequest,
  onEmotion?: (data: any) => void,
  onRisk?: (data: any) => void,
  onChunk?: (data: { content: string }) => void,
  onDone?: (data: any) => void,
  onError?: (error: string) => void,
): Promise<void> {
  const apiUrl = getApiUrl()

  try {
    const response = await fetch(`${apiUrl}/api/chat/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Response body is not readable')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      let currentEvent = ''
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim()
        } else if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          if (!data) continue

          try {
            const parsed = JSON.parse(data)
            switch (currentEvent) {
              case 'emotion':
                onEmotion?.(parsed)
                break
              case 'risk':
                onRisk?.(parsed)
                break
              case 'chunk':
                onChunk?.(parsed)
                break
              case 'done':
                onDone?.(parsed)
                break
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    onError?.(message)
  }
}

// ========== Conversations API ==========
export async function getConversations(): Promise<Conversation[]> {
  const apiUrl = getApiUrl()
  const response = await fetch(`${apiUrl}/api/chat/conversations`)
  if (!response.ok) throw new Error('Failed to fetch conversations')
  return response.json()
}

export async function getConversation(id: string): Promise<{
  conversation: Conversation
  messages: any[]
}> {
  const apiUrl = getApiUrl()
  const response = await fetch(`${apiUrl}/api/chat/conversations/${id}`)
  if (!response.ok) throw new Error('Failed to fetch conversation')
  return response.json()
}

export async function deleteConversation(id: string): Promise<void> {
  const apiUrl = getApiUrl()
  const response = await fetch(`${apiUrl}/api/chat/conversations/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) throw new Error('Failed to delete conversation')
}

// ========== Emotion API ==========
export async function getEmotionReport(days: number = 7): Promise<MoodReport> {
  const apiUrl = getApiUrl()
  const response = await fetch(`${apiUrl}/api/emotion/report?days=${days}`)
  if (!response.ok) throw new Error('Failed to fetch emotion report')
  return response.json()
}

export async function getEmotionTrend(days: number = 30): Promise<EmotionRecord[]> {
  const apiUrl = getApiUrl()
  const response = await fetch(`${apiUrl}/api/emotion/trend?days=${days}`)
  if (!response.ok) throw new Error('Failed to fetch emotion trend')
  return response.json()
}

// ========== Memory API ==========
export async function getMemories(): Promise<UserMemory[]> {
  const apiUrl = getApiUrl()
  const response = await fetch(`${apiUrl}/api/memory`)
  if (!response.ok) throw new Error('Failed to fetch memories')
  return response.json()
}

export async function deleteMemory(id: string): Promise<void> {
  const apiUrl = getApiUrl()
  const response = await fetch(`${apiUrl}/api/memory/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) throw new Error('Failed to delete memory')
}

// ========== Health API ==========
export async function checkHealth(): Promise<{ status: string; version: string }> {
  const apiUrl = getApiUrl()
  const response = await fetch(`${apiUrl}/api/health`)
  if (!response.ok) throw new Error('Backend not available')
  return response.json()
}

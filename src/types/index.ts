// ========== Message Types ==========
export interface Message {
  id: string
  conversationId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  emotionTag?: string
  emotionIntensity?: 'mild' | 'moderate' | 'intense'
  riskLevel?: 'low' | 'medium' | 'high'
  createdAt: string
}

// ========== Conversation Types ==========
export interface Conversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  isActive: boolean
  messageCount?: number
  lastMessage?: string
}

// ========== Emotion Types ==========
export interface EmotionInfo {
  emotion: string
  intensity: 'mild' | 'moderate' | 'intense'
  score: number
}

export interface EmotionRecord {
  id: string
  date: string
  hour: number
  dominantEmotion: string
  intensity: string
  score: number
  summary?: string
}

export interface MoodReport {
  period: string
  startDate: string
  endDate: string
  dominantEmotion: string
  emotionDistribution: Record<string, number>
  dailyScores: Array<{ date: string; score: number; dominantEmotion: string }>
  summary: string
  suggestion: string
}

// ========== Risk Types ==========
export interface RiskInfo {
  level: 'low' | 'medium' | 'high'
  action: 'none' | 'monitor' | 'intervene'
  triggerKeywords?: string[]
  message?: string
}

// ========== Memory Types ==========
export interface UserMemory {
  id: string
  category: 'name' | 'preference' | 'experience' | 'sensitive_topic' | 'milestone'
  key: string
  value: string
  importance: number
  createdAt: string
  updatedAt: string
}

// ========== API Types ==========
export interface ChatRequest {
  conversationId: string | null
  message: string
  useMemory: boolean
}

export interface ChatResponse {
  conversationId: string
  messageId: string
  fullResponse: string
  emotionTag: string
  riskLevel: string
}

// ========== SSE Event Types ==========
export interface SSEEmotionEvent {
  emotion: string
  intensity: 'mild' | 'moderate' | 'intense'
  score: number
}

export interface SSERiskEvent {
  level: 'low' | 'medium' | 'high'
  action: 'none' | 'monitor' | 'intervene'
  message?: string
}

export interface SSEChunkEvent {
  content: string
}

export interface SSEDoneEvent {
  conversationId: string
  messageId: string
  emotionTag: string
  riskLevel: string
  fullResponse: string
}

// ========== Voice Call Types ==========
export type VoiceCallStatus = 'idle' | 'listening' | 'thinking' | 'speaking'

export interface VoiceCallState {
  status: VoiceCallStatus
  isSupported: boolean
  errorMessage: string | null
}

// WebSocket voice message types
export interface VoiceWSMessage {
  type: 'emotion' | 'risk' | 'text' | 'audio' | 'done' | 'interrupted'
  data: any
}

export interface VoiceAudioChunk {
  audio: string  // base64 encoded MP3
}

// Types for AI Sister Netlify Functions
// Mirrors the Python backend models

// ========== Database Types ==========
export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  emotionTag?: string;
  emotionIntensity?: "mild" | "moderate" | "intense";
  riskLevel?: "low" | "medium" | "high";
  createdAt: string;
}

export interface EmotionRecord {
  id: string;
  date: string;
  hour: number;
  dominantEmotion: string;
  intensity: "mild" | "moderate" | "intense";
  score: number;
  summary?: string;
  createdAt: string;
}

export interface UserMemory {
  id: string;
  category: "name" | "preference" | "experience" | "sensitive_topic" | "milestone";
  key: string;
  value: string;
  importance: number;
  sourceMsgId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SafetyLog {
  id: string;
  msgId?: string;
  riskLevel: "low" | "medium" | "high";
  triggerKeywords?: string;
  actionTaken: string;
  createdAt: string;
}

// ========== API Request Types ==========
export interface ChatRequest {
  conversationId: string | null;
  message: string;
  useMemory: boolean;
}

export interface UpdateTitleRequest {
  title: string;
}

// ========== API Response Types ==========
export interface HealthResponse {
  status: string;
  version: string;
  database: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  messageCount: number;
  lastMessage: string | null;
}

export interface ConversationDetail {
  conversation: ConversationSummary;
  messages: Message[];
}

export interface MoodReport {
  period: string;
  startDate: string;
  endDate: string;
  dominantEmotion: string;
  emotionDistribution: Record<string, number>;
  dailyScores: Array<{ date: string; score: number; dominantEmotion: string }>;
  summary: string;
  suggestion: string;
  averageScore: number;
  totalRecords: number;
}

// ========== SSE Event Types ==========
export interface SSEEvent {
  event: "emotion" | "risk" | "chunk" | "done";
  data: Record<string, unknown>;
}

// ========== Internal Types ==========
export interface EmotionResult {
  emotion: string;
  intensity: "mild" | "moderate" | "intense";
  score: number;
  analysis: string;
}

export interface RiskResult {
  level: "low" | "medium" | "high";
  action: "none" | "monitor" | "intervene";
  triggerKeywords: string[];
  message?: string;
}

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

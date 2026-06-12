import { create } from 'zustand'
import type { Message, Conversation, EmotionInfo, RiskInfo, VoiceCallStatus } from '../types'

interface ChatState {
  // API
  apiUrl: string
  setApiUrl: (url: string) => void

  // Conversations
  conversations: Conversation[]
  activeConversationId: string | null
  setActiveConversation: (id: string | null) => void
  addConversation: (conv: Conversation) => void
  setConversations: (convs: Conversation[]) => void

  // Messages
  messages: Message[]
  isLoading: boolean
  streamingContent: string
  addMessage: (msg: Message) => void
  appendStreamContent: (content: string) => void
  commitStreamedMessage: (msg: Message) => void
  clearStreaming: () => void
  setIsLoading: (loading: boolean) => void

  // Emotion
  currentEmotion: EmotionInfo | null
  setCurrentEmotion: (emotion: EmotionInfo | null) => void

  // Risk
  currentRisk: RiskInfo | null
  setCurrentRisk: (risk: RiskInfo | null) => void
  showRiskAlert: boolean
  setShowRiskAlert: (show: boolean) => void

  voiceStatus: VoiceCallStatus
  setVoiceStatus: (status: VoiceCallStatus) => void
  isVoiceSupported: boolean
  setVoiceSupported: (supported: boolean) => void
}

export const useChatStore = create<ChatState>((set) => ({
  // API
  apiUrl: '',
  setApiUrl: (url) => set({ apiUrl: url }),

  // Conversations
  conversations: [],
  activeConversationId: null,
  setActiveConversation: (id) => set({ activeConversationId: id }),
  addConversation: (conv) =>
    set((state) => ({ conversations: [conv, ...state.conversations] })),
  setConversations: (convs) => set({ conversations: convs }),

  // Messages
  messages: [],
  isLoading: false,
  streamingContent: '',
  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),
  appendStreamContent: (content) =>
    set((state) => ({ streamingContent: state.streamingContent + content })),
  commitStreamedMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, msg],
      streamingContent: '',
      isLoading: false,
    })),
  clearStreaming: () => set({ streamingContent: '', isLoading: false }),
  setIsLoading: (loading) => set({ isLoading: loading }),

  // Emotion
  currentEmotion: null,
  setCurrentEmotion: (emotion) => set({ currentEmotion: emotion }),

  // Risk
  currentRisk: null,
  setCurrentRisk: (risk) => set({ currentRisk: risk }),
  showRiskAlert: false,
  setShowRiskAlert: (show) => set({ showRiskAlert: show }),

  voiceStatus: 'idle',
  setVoiceStatus: (status) => set({ voiceStatus: status }),
  isVoiceSupported: false,
  setVoiceSupported: (supported) => set({ isVoiceSupported: supported }),
}))

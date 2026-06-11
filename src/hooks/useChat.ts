import { useCallback } from 'react'
import { useChatStore } from '../store/chatStore'
import { sendMessage } from '../services/api'
import type { Message } from '../types'

let messageIdCounter = 0
function generateId(): string {
  messageIdCounter++
  return `msg_${Date.now()}_${messageIdCounter}`
}

export function useChat() {
  const store = useChatStore()

  const send = useCallback(async (content: string) => {
    if (!content.trim() || store.isLoading) return

    // Add user message immediately
    const userMessage: Message = {
      id: generateId(),
      conversationId: store.activeConversationId || '',
      role: 'user',
      content: content.trim(),
      createdAt: new Date().toISOString(),
    }

    store.addMessage(userMessage)
    store.setIsLoading(true)
    store.setCurrentEmotion(null)
    store.setCurrentRisk(null)
    store.setShowRiskAlert(false)

    try {
      await sendMessage(
        {
          conversationId: store.activeConversationId,
          message: content.trim(),
          useMemory: true,
        },
        // onEmotion
        (data) => {
          store.setCurrentEmotion(data)
          // Update the user message with emotion info
          if (data.emotion) {
            const msgs = useChatStore.getState().messages
            const lastUserMsg = [...msgs].reverse().find(m => m.role === 'user')
            if (lastUserMsg) {
              lastUserMsg.emotionTag = data.emotion
              lastUserMsg.emotionIntensity = data.intensity
            }
          }
        },
        // onRisk
        (data) => {
          store.setCurrentRisk(data)
          if (data.level === 'high' || data.action === 'intervene') {
            store.setShowRiskAlert(true)
          }
        },
        // onChunk
        (data) => {
          store.appendStreamContent(data.content)
        },
        // onDone
        (data) => {
          const assistantMessage: Message = {
            id: data.messageId || generateId(),
            conversationId: data.conversationId,
            role: 'assistant',
            content: data.fullResponse,
            emotionTag: data.emotionTag,
            riskLevel: data.riskLevel,
            createdAt: new Date().toISOString(),
          }
          store.commitStreamedMessage(assistantMessage)

          // Update active conversation ID if new
          if (!store.activeConversationId && data.conversationId) {
            store.setActiveConversation(data.conversationId)
          }
        },
        // onError
        (error) => {
          console.error('Chat error:', error)
          store.clearStreaming()
          // Add error message
          const errorMessage: Message = {
            id: generateId(),
            conversationId: store.activeConversationId || '',
            role: 'assistant',
            content: '抱歉呀，我这边网络好像有点问题呢...你稍等一下，我马上回来~',
            createdAt: new Date().toISOString(),
          }
          store.addMessage(errorMessage)
        },
      )
    } catch (err) {
      console.error('Send failed:', err)
      store.clearStreaming()
    }
  }, [store])

  const startNewChat = useCallback(() => {
    store.setActiveConversation(null)
    // Clear messages from store for new chat
    useChatStore.setState({ messages: [], streamingContent: '', currentEmotion: null, currentRisk: null, showRiskAlert: false })
  }, [store])

  return {
    send,
    startNewChat,
    isLoading: store.isLoading,
    streamingContent: store.streamingContent,
    messages: store.messages,
  }
}

import { useEffect, useRef } from 'react'
import { useChatStore } from '../../store/chatStore'
import { useChat } from '../../hooks/useChat'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import TypingIndicator from './TypingIndicator'
import EmotionBadge from '../emotion/EmotionBadge'
import RiskAlert from '../risk/RiskAlert'

export default function ChatContainer() {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages, streamingContent, isLoading, currentEmotion, currentRisk, showRiskAlert } = useChatStore()
  const { send, startNewChat } = useChat()
  const activeConversationId = useChatStore((s) => s.activeConversationId)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  return (
    <div className="flex flex-col h-full bg-sister-bg">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-pink-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-300 to-rose-400 flex items-center justify-center text-white text-lg shadow-md">
            🌸
          </div>
          <div>
            <h1 className="text-base font-medium text-sister-text">晓语</h1>
            <p className="text-xs text-sister-muted">你的知心大姐姐 · 一直在线</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {currentEmotion && (
            <EmotionBadge
              emotion={currentEmotion.emotion}
              intensity={currentEmotion.intensity}
            />
          )}
          <button
            onClick={startNewChat}
            className="px-3 py-1.5 text-sm text-sister-muted hover:text-sister-text hover:bg-pink-50 rounded-lg transition-colors"
          >
            新对话
          </button>
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-6xl mb-6">🌸</div>
            <h2 className="text-xl font-medium text-sister-text mb-2">
              嗨，我是晓语~
            </h2>
            <p className="text-sister-muted max-w-sm leading-relaxed">
              我在这里听你说说心里话。无论开心还是难过，
              我都会温柔地陪着你，不评判，不说教。
              <br />
              <span className="text-sm mt-2 inline-block">
                想和我聊聊什么呀？
              </span>
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {/* Streaming message */}
        {streamingContent && (
          <ChatMessage
            message={{
              id: 'streaming',
              conversationId: activeConversationId || '',
              role: 'assistant',
              content: streamingContent,
              createdAt: new Date().toISOString(),
            }}
            isStreaming
          />
        )}

        {/* Typing indicator */}
        {isLoading && !streamingContent && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <ChatInput onSend={send} isLoading={isLoading} />

      {/* Risk alert overlay */}
      {showRiskAlert && currentRisk && (
        <RiskAlert risk={currentRisk} />
      )}
    </div>
  )
}

import { useEffect, useRef, useState, useCallback } from "react"
import { useChatStore } from "../../store/chatStore"
import { useChat } from "../../hooks/useChat"
import ChatMessage from "./ChatMessage"
import ChatInput from "./ChatInput"
import TypingIndicator from "./TypingIndicator"
import EmotionBadge from "../emotion/EmotionBadge"
import RiskAlert from "../risk/RiskAlert"
import VoiceCallOverlay from "../voice/VoiceCallOverlay"
import { ChevronDown } from "lucide-react"
import type { Message } from "../../types"

const SUGGESTED_PROMPTS = [
  { emoji: "💭", text: "今天心情有点复杂，想和你聊聊" },
  { emoji: "😊", text: "今天发生了一件开心的事！" },
  { emoji: "😔", text: "最近总觉得提不起劲..." },
  { emoji: "🌟", text: "想和你分享一下我的小目标" },
]

export default function ChatContainer() {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const { messages, streamingContent, isLoading, currentEmotion, currentRisk, showRiskAlert } = useChatStore()
  const { send } = useChat()
  const activeConversationId = useChatStore((s) => s.activeConversationId)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const voiceStatus = useChatStore((s) => s.voiceStatus)
  const setVoiceStatus = useChatStore((s) => s.setVoiceStatus)
  const isVoiceActive = voiceStatus !== 'idle'

  const toggleVoice = useCallback(() => {
    if (isVoiceActive) {
      setVoiceStatus('idle')
    } else {
      setVoiceStatus('listening')
    }
  }, [isVoiceActive, setVoiceStatus])

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" })
  }, [])

  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current
    if (!el) return
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setShowScrollBtn(distFromBottom > 200)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent, scrollToBottom])

  return (
    <div className="flex flex-col h-full bg-sister-bg relative">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-pink-100/60 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-300 to-rose-400 flex items-center justify-center text-white text-lg shadow-md ring-2 ring-pink-100">
            🌸
          </div>
          <div>
            <h1 className="text-base font-semibold text-sister-text">晓语</h1>
            <p className="text-xs text-sister-muted">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
              在线 · 你的知心大姐姐
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {currentEmotion && (
            <EmotionBadge
              emotion={currentEmotion.emotion}
              intensity={currentEmotion.intensity}
            />
          )}
        </div>
      </header>

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth"
      >
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="relative mb-6">
              <div className="text-7xl animate-bounce">🌸</div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-white" />
            </div>
            <h2 className="text-xl font-semibold text-sister-text mb-2">
              嗨，我是晓语~
            </h2>
            <p className="text-sister-muted max-w-sm leading-relaxed mb-8">
              我在这里听你说说心里话。无论开心还是难过，
              我都会温柔地陪着你，不评判，不说教。
            </p>

            {/* Suggested prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-md w-full">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt.text}
                  onClick={() => send(prompt.text)}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-white/80 border border-pink-100 hover:border-pink-300 hover:bg-pink-50/50 hover:shadow-sm text-left transition-all duration-200 group"
                >
                  <span className="text-lg group-hover:scale-110 transition-transform">{prompt.emoji}</span>
                  <span className="text-sm text-sister-text leading-relaxed">{prompt.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Date-separated messages */}
        {messages.length > 0 && renderMessages(messages)}

        {/* Streaming message */}
        {streamingContent && (
          <ChatMessage
            message={{
              id: "streaming",
              conversationId: activeConversationId || "",
              role: "assistant",
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

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute bottom-24 right-6 w-10 h-10 rounded-full bg-white shadow-lg border border-pink-100 flex items-center justify-center text-pink-500 hover:bg-pink-50 hover:shadow-xl transition-all animate-fade-in z-10"
        >
          <ChevronDown size={20} />
        </button>
      )}

      {/* Input area */}
      <ChatInput onSend={send} isLoading={isLoading} onVoiceClick={toggleVoice} isVoiceActive={isVoiceActive} />

      {/* Risk alert overlay */}
      {showRiskAlert && currentRisk && (
        <RiskAlert risk={currentRisk} />
      )}

      {/* Voice call overlay */}
      {isVoiceActive && <VoiceCallOverlay />}
    </div>
  )
}

function renderMessages(messages: Message[]) {
  const elements: React.ReactNode[] = []
  let lastDate = ""

  messages.forEach((msg) => {
    const msgDate = formatMessageDate(msg.createdAt)
    if (msgDate !== lastDate) {
      lastDate = msgDate
      elements.push(
        <div key={`date-${msg.createdAt}`} className="flex items-center justify-center my-4">
          <span className="px-3 py-1 bg-white/70 backdrop-blur-sm rounded-full text-xs text-sister-muted border border-pink-50 shadow-sm">
            {msgDate}
          </span>
        </div>
      )
    }
    elements.push(<ChatMessage key={msg.id} message={msg} />)
  })

  return elements
}

function formatMessageDate(isoString: string): string {
  try {
    const date = new Date(isoString)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const diffDays = Math.floor((today.getTime() - msgDay.getTime()) / 86400000)

    if (diffDays === 0) return "今天"
    if (diffDays === 1) return "昨天"
    if (diffDays < 7) return `${diffDays}天前`
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const day = date.getDate().toString().padStart(2, "0")
    if (year === now.getFullYear()) return `${month}月${day}日`
    return `${year}年${month}月${day}日`
  } catch {
    return ""
  }
}


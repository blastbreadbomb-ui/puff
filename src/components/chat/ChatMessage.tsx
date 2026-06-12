import type { Message } from "../../types"
import EmotionBadge from "../emotion/EmotionBadge"

interface ChatMessageProps {
  message: Message
  isStreaming?: boolean
}

export default function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === "user"
  const isSystem = message.role === "system"

  if (isSystem) return null

  return (
    <div
      className={`flex gap-3 mb-5 message-enter ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0 shadow-sm ${
          isUser
            ? "bg-gradient-to-br from-purple-300 to-violet-400 text-white ring-2 ring-purple-100"
            : "bg-gradient-to-br from-pink-300 to-rose-400 text-white ring-2 ring-pink-100"
        }`}
      >
        {isUser ? "我" : "🌸"}
      </div>

      {/* Message bubble */}
      <div className={`flex flex-col max-w-[75%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
            isUser
              ? "bg-gradient-to-br from-purple-50 to-violet-50 text-sister-text rounded-tr-md border border-purple-100/50"
              : "bg-white text-sister-text rounded-tl-md border border-pink-100/50"
          } ${isStreaming ? "streaming-cursor" : ""}`}
        >
          {message.content}
          {isStreaming && (
            <span className="inline-block w-0.5 h-4 bg-pink-400 ml-0.5 animate-pulse align-text-bottom rounded-full" />
          )}
        </div>

        {/* Emotion tag for user messages */}
        {isUser && message.emotionTag && (
          <div className="mt-1.5">
            <EmotionBadge
              emotion={message.emotionTag}
              intensity={message.emotionIntensity}
              size="sm"
            />
          </div>
        )}

        {/* Time */}
        <span className="text-xs text-sister-muted mt-1 px-1 opacity-70">
          {formatTime(message.createdAt)}
        </span>
      </div>
    </div>
  )
}

function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString)
    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")
    return `${hours}:${minutes}`
  } catch {
    return ""
  }
}

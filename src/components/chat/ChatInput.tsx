import { useState, useRef, useEffect } from "react"
import { Send, Mic } from "lucide-react"

interface ChatInputProps {
  onSend: (content: string) => void
  isLoading: boolean
  onVoiceClick?: () => void
  isVoiceActive?: boolean
}

export default function ChatInput({ onSend, isLoading, onVoiceClick, isVoiceActive }: ChatInputProps) {
  const [input, setInput] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px"
    }
  }, [input])

  const handleSend = () => {
    if (!input.trim() || isLoading) return
    onSend(input.trim())
    setInput("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const charCount = input.length

  return (
    <div className="px-4 pb-4 pt-2">
      <div className={`flex items-end gap-2 bg-white rounded-2xl px-4 py-3 shadow-sm border transition-all duration-200 ${
        isFocused
          ? "border-pink-300 shadow-md shadow-pink-100/50"
          : "border-pink-100 hover:border-pink-200"
      }`}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="和晓语说说心里话..."
          rows={1}
          className="flex-1 resize-none outline-none text-sm text-sister-text placeholder-sister-muted bg-transparent max-h-[120px] leading-relaxed"
          disabled={isLoading}
        />
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Voice call button */}
          <button
            onClick={onVoiceClick}
            type="button"
            className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
              isVoiceActive
                ? "bg-pink-400 text-white shadow-md"
                : "bg-gray-100 text-gray-500 hover:bg-pink-100 hover:text-pink-500"
            }`}
            title={isVoiceActive ? "关闭语音" : "语音通话"}
          >
            <Mic size={16} />
          </button>
          {charCount > 0 && (
            <span className={`text-xs transition-colors ${charCount > 2000 ? "text-red-400" : "text-sister-muted"}`}>
              {charCount}
            </span>
          )}
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
              input.trim() && !isLoading
                ? "bg-pink-400 text-white hover:bg-pink-500 shadow-md hover:shadow-lg active:scale-90"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-400 rounded-full animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </div>
      <p className="text-xs text-sister-muted text-center mt-2 select-none">
        按 Enter 发送，Shift + Enter 换行 · 晓语会认真听你说的每一句话
      </p>
    </div>
  )
}

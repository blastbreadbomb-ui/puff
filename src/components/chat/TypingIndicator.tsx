export default function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-6 message-enter">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-300 to-rose-400 flex items-center justify-center text-white text-sm flex-shrink-0 shadow-sm">
        🌸
      </div>

      {/* Typing bubble */}
      <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-sister-bubble">
        <div className="flex items-center gap-1">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      </div>
    </div>
  )
}

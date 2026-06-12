export default function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-5 message-enter">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-300 to-rose-400 flex items-center justify-center text-white text-sm flex-shrink-0 shadow-sm ring-2 ring-pink-100">
        🌸
      </div>
      <div className="px-4 py-3.5 rounded-2xl rounded-tl-md bg-white border border-pink-100/50 shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      </div>
    </div>
  )
}

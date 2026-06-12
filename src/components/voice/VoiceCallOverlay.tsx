import { useEffect, useRef } from 'react'
import { Mic, MicOff, PhoneOff } from 'lucide-react'
import { useVoiceCall } from '../../hooks/useVoiceCall'

export default function VoiceCallOverlay() {
  const { status, startListening, interrupt, stopVoiceCall } = useVoiceCall()
  const isActive = status !== 'idle'

  // Auto-start listening when voice mode activates
  const hasStartedRef = useRef(false)
  useEffect(() => {
    if (status === 'listening' && !hasStartedRef.current) {
      hasStartedRef.current = true
      startListening()
    }
    if (status === 'idle') {
      hasStartedRef.current = false
    }
  }, [status, startListening])



  if (!isActive) return null

  const isListening = status === 'listening'
  const isThinking = status === 'thinking'
  const isSpeaking = status === 'speaking'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sister-bg/95 backdrop-blur-sm">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-pink-100/40 via-white/30 to-rose-100/40" />

      <div className="relative flex flex-col items-center gap-8 z-10">
        {/* Status text */}
        <div className="text-center">
          <p className="text-sister-muted text-sm mb-1">
            {isListening && '我在听...'}
            {isThinking && '让我想想...'}
            {isSpeaking && '晓语正在说话...'}
          </p>
        </div>

        {/* Animated avatar circle */}
        <div className="relative">
          {/* Outer ripple */}
          {isListening && (
            <>
              <div className="absolute inset-0 rounded-full bg-pink-300/30 animate-ping" style={{
                width: '140px',
                height: '140px',
                top: '-10px',
                left: '-10px',
              }} />
              <div className="absolute inset-0 rounded-full bg-pink-300/20 animate-ping animation-delay-500" style={{
                width: '140px',
                height: '140px',
                top: '-10px',
                left: '-10px',
              }} />
            </>
          )}

          {/* Main circle */}
          <div className={`
            w-32 h-32 rounded-full flex items-center justify-center text-4xl
            transition-all duration-500 shadow-2xl
            ${isListening ? 'bg-gradient-to-br from-pink-300 to-rose-400 scale-110' : ''}
            ${isThinking ? 'bg-gradient-to-br from-purple-300 to-pink-400 animate-pulse' : ''}
            ${isSpeaking ? 'bg-gradient-to-br from-pink-300 to-rose-400' : ''}
            ${!isActive ? 'bg-gradient-to-br from-pink-200 to-rose-300' : ''}
          `}>
            <span className={isListening ? 'animate-bounce' : isThinking ? 'animate-spin' : ''}>
              {isListening ? '🎤' : isThinking ? '💭' : isSpeaking ? '🌸' : '🌸'}
            </span>
          </div>

          {/* Speaking wave bars */}
          {isSpeaking && (
            <div className="flex items-center justify-center gap-1 mt-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-1 bg-pink-400 rounded-full animate-wave"
                  style={{
                    height: `${12 + Math.random() * 20}px`,
                    animationDelay: `${i * 0.15}s`,
                    animationDuration: '0.8s',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Control buttons */}
        <div className="flex items-center gap-6 mt-4">
          {/* Interrupt / Talk button */}
          {isSpeaking && (
            <button
              onClick={interrupt}
              className="w-14 h-14 rounded-full bg-white border-2 border-pink-300 flex items-center justify-center
                text-pink-500 hover:bg-pink-50 hover:border-pink-400 shadow-lg hover:shadow-xl
                transition-all duration-200 active:scale-95"
              title="打断晓语 (点击说话)"
            >
              <Mic size={24} />
            </button>
          )}

          {/* Mute / Start listening toggle */}
          {isListening && (
            <button
              onClick={stopVoiceCall}
              className="w-12 h-12 rounded-full bg-white/80 border border-gray-200 flex items-center justify-center
                text-gray-400 hover:text-gray-600 hover:border-gray-300 shadow-md
                transition-all duration-200 active:scale-95"
              title="静音"
            >
              <MicOff size={20} />
            </button>
          )}

          {/* End call button */}
          <button
            onClick={stopVoiceCall}
            className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center
              text-white hover:bg-red-600 shadow-lg hover:shadow-xl
              transition-all duration-200 active:scale-95"
            title="结束通话"
          >
            <PhoneOff size={24} />
          </button>

          {/* Start listening button (when idle) */}
          {false && status === 'idle' && (
            <button
              onClick={startListening}
              className="w-14 h-14 rounded-full bg-pink-500 flex items-center justify-center
                text-white hover:bg-pink-600 shadow-lg hover:shadow-xl
                transition-all duration-200 active:scale-95"
              title="开始说话"
            >
              <Mic size={24} />
            </button>
          )}
        </div>

        {/* Transcript hint */}
        {isListening && (
          <p className="text-xs text-sister-muted animate-pulse">
            正在听取你的声音...
          </p>
        )}
      </div>
    </div>
  )
}

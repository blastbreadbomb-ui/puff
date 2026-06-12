import { useCallback, useRef, useEffect } from 'react'
import { useChatStore } from '../store/chatStore'

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

const SILENCE_TIMEOUT_MS = 1500

function getBackendWsUrl(): string {
  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    return 'ws://127.0.0.1:8899'
  }
  return (import.meta as any).env?.VITE_API_BASE_URL
    ? (import.meta as any).env.VITE_API_BASE_URL.replace('http', 'ws')
    : `ws://${location.host}`
}

export function useVoiceCall() {
  const store = useChatStore()
  const wsRef = useRef<WebSocket | null>(null)
  const recognitionRef = useRef<any>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const isInterruptingRef = useRef(false)
  const transcriptRef = useRef('')

  const status = store.voiceStatus
  const isSupported = store.isVoiceSupported

  // Check STT support on mount
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    store.setVoiceSupported(!!SR)
  }, [])

  // Stop all audio playback
  const stopAudio = useCallback(() => {
    if (currentSourceRef.current) {
      try { currentSourceRef.current.stop() } catch {}
      currentSourceRef.current = null
    }
  }, [])

  // Play base64 MP3 audio chunk
  const playAudioChunk = useCallback(async (base64Audio: string) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext()
      }
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') await ctx.resume()

      const binaryStr = atob(base64Audio)
      const bytes = new Uint8Array(binaryStr.length)
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i)
      }

      const audioBuffer = await ctx.decodeAudioData(bytes.buffer)
      const source = ctx.createBufferSource()
      source.buffer = audioBuffer
      source.connect(ctx.destination)
      currentSourceRef.current = source

      return new Promise<void>((resolve) => {
        source.onended = () => {
          if (currentSourceRef.current === source) currentSourceRef.current = null
          resolve()
        }
        source.start(0)
      })
    } catch {}
  }, [])

  // Send text to backend via WebSocket
  const sendText = useCallback((text: string) => {
    if (!text.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    store.setVoiceStatus('thinking')
    store.setIsLoading(true)
    wsRef.current.send(JSON.stringify({ type: 'message', text: text.trim() }))
  }, [store])

  // Handle WebSocket messages
  const handleWSMessage = useCallback(async (event: MessageEvent) => {
    try {
      const msg = JSON.parse(event.data)

      if (isInterruptingRef.current && msg.type !== 'interrupted') return

      switch (msg.type) {
        case 'emotion':
          store.setCurrentEmotion(msg.data)
          break
        case 'risk':
          store.setCurrentRisk(msg.data)
          if (msg.data?.level === 'high') store.setShowRiskAlert(true)
          break
        case 'text':
          store.appendStreamContent(msg.data.content)
          break
        case 'audio':
          if (!isInterruptingRef.current) await playAudioChunk(msg.data.audio)
          break
        case 'done': {
          store.setVoiceStatus('idle')
          const fullContent = useChatStore.getState().streamingContent
          if (fullContent) {
            store.commitStreamedMessage({
              id: msg.data.messageId || `voice_${Date.now()}`,
              conversationId: msg.data.conversationId,
              role: 'assistant',
              content: fullContent,
              emotionTag: msg.data.emotionTag,
              riskLevel: msg.data.riskLevel,
              createdAt: new Date().toISOString(),
            })
          } else {
            store.clearStreaming()
          }
          store.setCurrentEmotion(null)
          store.setCurrentRisk(null)
          if (!store.activeConversationId && msg.data.conversationId) {
            store.setActiveConversation(msg.data.conversationId)
          }
          break
        }
        case 'interrupted':
          isInterruptingRef.current = false
          store.clearStreaming()
          store.setVoiceStatus('idle')
          break
      }
    } catch {}
  }, [store, playAudioChunk])

  // Connect WebSocket
  const connectWS = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return wsRef.current

    return new Promise<WebSocket>((resolve, reject) => {
      const url = getBackendWsUrl()
      const ws = new WebSocket(`${url}/api/voice/call`)
      ws.onopen = () => {
        wsRef.current = ws
        ws.send(JSON.stringify({
          type: 'start',
          conversation_id: store.activeConversationId,
        }))
        resolve(ws)
      }
      ws.onmessage = handleWSMessage
      ws.onclose = () => { wsRef.current = null }
      ws.onerror = () => reject(new Error('WebSocket failed'))
    })
  }, [store.activeConversationId, handleWSMessage])

  // Interrupt current AI speech
  const interrupt = useCallback(() => {
    isInterruptingRef.current = true
    stopAudio()
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'interrupt' }))
    }
    recognitionRef.current?.stop()
    store.setVoiceStatus('listening')
    transcriptRef.current = ''
    setTimeout(() => {
      try { recognitionRef.current?.start() } catch {}
    }, 150)
  }, [stopAudio, store])

  // Start voice listening session
  const startListening = useCallback(async () => {
    if (!isSupported) return
    try {
      await connectWS()

      const SR = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SR) return

      if (!recognitionRef.current) {
        const recognition = new SR()
        recognition.lang = 'zh-CN'
        recognition.continuous = true
        recognition.interimResults = true
        recognition.maxAlternatives = 1

        recognition.onresult = (event: any) => {
          // Reset silence timer on any speech
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
          silenceTimerRef.current = setTimeout(() => {
            recognition.stop() // will trigger onend -> send
          }, SILENCE_TIMEOUT_MS)

          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              transcriptRef.current += event.results[i][0].transcript
            }
          }
        }

        recognition.onspeechend = () => {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
          silenceTimerRef.current = setTimeout(() => {
            recognition.stop()
          }, SILENCE_TIMEOUT_MS)
        }

        recognition.onerror = (event: any) => {
          if (event.error === 'no-speech' || event.error === 'aborted') return
          console.error('STT error:', event.error)
        }

        recognition.onend = () => {
          const text = transcriptRef.current.trim()
          transcriptRef.current = ''
          if (text && useChatStore.getState().voiceStatus === 'listening') {
            sendText(text)
            return
          }
          if (useChatStore.getState().voiceStatus === 'listening') {
            try { recognition.start() } catch {}
          }
        }

        recognitionRef.current = recognition
      }

      store.setVoiceStatus('listening')
      transcriptRef.current = ''
      recognitionRef.current.start()
    } catch (err) {
      console.error('Failed to start listening:', err)
      store.setVoiceStatus('idle')
    }
  }, [isSupported, connectWS, sendText, store])

  // Stop voice call entirely
  const stopVoiceCall = useCallback(() => {
    stopAudio()
    try { recognitionRef.current?.stop() } catch {}
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    store.setVoiceStatus('idle')
    isInterruptingRef.current = false
    transcriptRef.current = ''
    store.clearStreaming()
    store.setIsLoading(false)
  }, [stopAudio, store])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio()
      try { recognitionRef.current?.stop() } catch {}
      wsRef.current?.close()
    }
  }, [])

  return {
    status,
    isSupported,
    startListening,
    interrupt,
    stopVoiceCall,
  }
}

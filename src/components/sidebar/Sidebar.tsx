import { useState, useEffect } from 'react'
import { useChatStore } from '../../store/chatStore'
import { getConversations } from '../../services/api'
import ConversationList from './ConversationList'
import MoodReport from './MoodReport'
import { MessageCircle, BarChart3, Menu, X } from 'lucide-react'
import type { Conversation } from '../../types'

type Tab = 'chats' | 'report' | 'settings'

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState<Tab>('chats')
  const [collapsed, setCollapsed] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const activeId = useChatStore((s) => s.activeConversationId)
  const setActive = useChatStore((s) => s.setActiveConversation)

  const fetchConversations = async () => {
    try {
      const convs = await getConversations()
      setConversations(convs)
    } catch {
      // Backend not ready yet
    }
  }

  useEffect(() => {
    fetchConversations()
    const interval = setInterval(fetchConversations, 5000)
    return () => clearInterval(interval)
  }, [])

  if (collapsed) {
    return (
      <div className="w-14 bg-white/80 backdrop-blur-sm border-r border-pink-100 flex flex-col items-center py-4 gap-4">
        <button
          onClick={() => setCollapsed(false)}
          className="p-2 rounded-lg hover:bg-pink-50 text-sister-muted hover:text-sister-text transition-colors"
        >
          <Menu size={20} />
        </button>
      </div>
    )
  }

  return (
    <div className="w-72 bg-white/80 backdrop-blur-sm border-r border-pink-100 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-pink-50">
        <h2 className="text-sm font-semibold text-sister-text">AI 知心大姐姐</h2>
        <button
          onClick={() => setCollapsed(true)}
          className="p-1 rounded-lg hover:bg-pink-50 text-sister-muted transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-pink-50">
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${
            activeTab === 'chats'
              ? 'text-pink-600 border-b-2 border-pink-400'
              : 'text-sister-muted hover:text-sister-text'
          }`}
        >
          <MessageCircle size={14} />
          对话
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${
            activeTab === 'report'
              ? 'text-pink-600 border-b-2 border-pink-400'
              : 'text-sister-muted hover:text-sister-text'
          }`}
        >
          <BarChart3 size={14} />
          情绪
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'chats' && (
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            onSelect={(id) => setActive(id)}
            onRefresh={fetchConversations}
          />
        )}
        {activeTab === 'report' && <MoodReport />}
        {activeTab === 'settings' && (
          <div className="p-4">
            <p className="text-sm text-sister-muted">设置页面即将到来...</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-pink-50">
        <p className="text-xs text-sister-muted text-center">
          🌸 你的情绪，值得被温柔对待
        </p>
      </div>
    </div>
  )
}

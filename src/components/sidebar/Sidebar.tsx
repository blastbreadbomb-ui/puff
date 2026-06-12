import { useState, useEffect } from "react"
import { useChatStore } from "../../store/chatStore"
import { getConversations } from "../../services/api"
import ConversationList from "./ConversationList"
import MoodReport from "./MoodReport"
import { MessageCircle, BarChart3, Menu, X, RefreshCw } from "lucide-react"
import type { Conversation } from "../../types"

type Tab = "chats" | "report"

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState<Tab>("chats")
  const [collapsed, setCollapsed] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)
  const activeId = useChatStore((s) => s.activeConversationId)
  const setActive = useChatStore((s) => s.setActiveConversation)

  const fetchConversations = async () => {
    setLoading(true)
    try {
      const convs = await getConversations()
      setConversations(convs)
    } catch {
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchConversations()
    const interval = setInterval(fetchConversations, 5000)
    return () => clearInterval(interval)
  }, [])

  if (collapsed) {
    return (
      <aside className="w-14 bg-white/90 backdrop-blur-md border-r border-pink-100 flex flex-col items-center py-4 gap-1 transition-all duration-300 ease-in-out">
        <button
          onClick={() => setCollapsed(false)}
          className="p-2 rounded-lg hover:bg-pink-50 text-sister-muted hover:text-sister-text transition-colors"
          title="展开侧边栏"
        >
          <Menu size={20} />
        </button>

        <div className="flex-1 flex flex-col items-center gap-1 mt-2">
          <button
            onClick={() => { setCollapsed(false); setActiveTab("chats") }}
            className={`p-2.5 rounded-xl transition-all ${activeTab === "chats" ? "bg-pink-100 text-pink-600" : "text-sister-muted hover:bg-pink-50 hover:text-pink-500"}`}
            title="对话"
          >
            <MessageCircle size={18} />
          </button>
          <button
            onClick={() => { setCollapsed(false); setActiveTab("report") }}
            className={`p-2.5 rounded-xl transition-all ${activeTab === "report" ? "bg-pink-100 text-pink-600" : "text-sister-muted hover:bg-pink-50 hover:text-pink-500"}`}
            title="情绪报告"
          >
            <BarChart3 size={18} />
          </button>
        </div>

        <button
          onClick={fetchConversations}
          className="p-2 rounded-lg hover:bg-pink-50 text-sister-muted hover:text-sister-text transition-colors"
          title="刷新"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </aside>
    )
  }

  return (
    <aside className="w-72 bg-white/90 backdrop-blur-md border-r border-pink-100 flex flex-col h-full transition-all duration-300 ease-in-out">
      <div className="flex items-center justify-between px-4 py-4 border-b border-pink-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-300 to-rose-400 flex items-center justify-center text-white text-sm shadow-sm">🌸</div>
          <h2 className="text-sm font-semibold text-sister-text">晓语</h2>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="p-1.5 rounded-lg hover:bg-pink-50 text-sister-muted hover:text-sister-text transition-colors"
          title="收起侧边栏"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex border-b border-pink-50">
        <button
          onClick={() => setActiveTab("chats")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${
            activeTab === "chats"
              ? "text-pink-600 border-b-2 border-pink-400 bg-pink-50/50"
              : "text-sister-muted hover:text-sister-text"
          }`}
        >
          <MessageCircle size={14} />
          对话
        </button>
        <button
          onClick={() => setActiveTab("report")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${
            activeTab === "report"
              ? "text-pink-600 border-b-2 border-pink-400 bg-pink-50/50"
              : "text-sister-muted hover:text-sister-text"
          }`}
        >
          <BarChart3 size={14} />
          情绪
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === "chats" && (
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            onSelect={(id) => setActive(id)}
            onRefresh={fetchConversations}
            loading={loading}
          />
        )}
        {activeTab === "report" && <MoodReport />}
      </div>

      <div className="px-4 py-3 border-t border-pink-50 bg-gradient-to-t from-pink-50/30 to-transparent">
        <p className="text-xs text-sister-muted text-center">
          🌸 你的情绪，值得被温柔对待
        </p>
      </div>
    </aside>
  )
}

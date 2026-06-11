import type { Conversation } from '../../types'
import { MessageCircle, Trash2 } from 'lucide-react'
import { deleteConversation } from '../../services/api'

interface ConversationListProps {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onRefresh: () => void
}

export default function ConversationList({ conversations, activeId, onSelect, onRefresh }: ConversationListProps) {
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    try {
      await deleteConversation(id)
      onRefresh()
    } catch {
      console.error('Failed to delete conversation')
    }
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <MessageCircle size={32} className="text-sister-muted mb-3 opacity-50" />
        <p className="text-sm text-sister-muted">还没有对话记录</p>
        <p className="text-xs text-sister-muted mt-1">开始和晓语聊天吧~</p>
      </div>
    )
  }

  return (
    <div className="py-2">
      {conversations.map((conv) => (
        <div
          key={conv.id}
          onClick={() => onSelect(conv.id)}
          className={`group flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
            activeId === conv.id
              ? 'bg-pink-50 text-pink-700'
              : 'hover:bg-pink-50/50 text-sister-text'
          }`}
        >
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
            <MessageCircle size={14} className={activeId === conv.id ? 'text-pink-500' : 'text-pink-300'} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{conv.title}</p>
            <p className="text-xs text-sister-muted truncate">
              {conv.lastMessage || formatDate(conv.updatedAt)}
            </p>
          </div>
          <button
            onClick={(e) => handleDelete(e, conv.id)}
            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 text-sister-muted hover:text-red-500 transition-all"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}

function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins}分钟前`
    if (diffHours < 24) return `${diffHours}小时前`
    if (diffDays < 7) return `${diffDays}天前`

    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${month}-${day}`
  } catch {
    return ''
  }
}

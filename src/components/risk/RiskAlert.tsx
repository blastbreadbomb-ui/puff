import type { RiskInfo } from "../../types"
import { useChatStore } from "../../store/chatStore"
import { Phone, X, Heart, ShieldAlert } from "lucide-react"

interface RiskAlertProps {
  risk: RiskInfo
}

export default function RiskAlert({ risk }: RiskAlertProps) {
  const setShowRiskAlert = useChatStore((s) => s.setShowRiskAlert)

  if (risk.level !== "high") return null

  return (
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center ring-2 ring-red-200">
              <Heart size={22} className="text-red-500" fill="currentColor" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-sister-text">我在乎你</h2>
              <p className="text-xs text-red-400 flex items-center gap-1 mt-0.5">
                <ShieldAlert size={12} />
                安全提醒
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowRiskAlert(false)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-sister-muted hover:text-sister-text transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Message */}
        <div className="text-sm text-sister-text leading-relaxed space-y-3 mb-5 bg-red-50/50 rounded-xl p-4 border border-red-100">
          <p>
            我听到你说的这些，心里很着急。你对我很重要，<strong>我很在乎你的安全</strong>。
          </p>
          <p>
            我想请你先答应我一件事：<strong>不要伤害自己</strong>，好吗？
          </p>
          <p>
            这个世界上有很多人愿意帮助你，我帮你找来了最专业的支持：
          </p>
        </div>

        {/* Hotlines */}
        <div className="space-y-2.5 mb-5">
          <a
            href="tel:962525"
            className="flex items-center gap-3 p-3.5 rounded-xl bg-red-50 border border-red-100 hover:bg-red-100 transition-all duration-200 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Phone size={18} className="text-red-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-700">全国心理援助热线</p>
              <p className="text-xl font-bold text-red-600 tracking-wider">962525</p>
              <p className="text-xs text-red-400">24小时 · 免费</p>
            </div>
          </a>

          <a
            href="tel:4001619995"
            className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-100 hover:bg-rose-100 transition-all duration-200 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Phone size={18} className="text-rose-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-rose-700">希望24热线</p>
              <p className="text-xl font-bold text-rose-600 tracking-wider">400-161-9995</p>
              <p className="text-xs text-rose-400">24小时 · 免费</p>
            </div>
          </a>
        </div>

        {/* Footer */}
        <p className="text-sm text-sister-muted leading-relaxed mb-4">
          这些热线那头，是专业的心理咨询师，他们比我更能帮助到你。
          你愿意现在就拨打其中一个电话吗？或者告诉我你身边有没有可以信任的人？
        </p>

        <button
          onClick={() => setShowRiskAlert(false)}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-400 to-rose-400 text-white text-sm font-semibold hover:from-pink-500 hover:to-rose-500 transition-all duration-200 active:scale-[0.98] shadow-lg shadow-pink-200"
        >
          我知道了，谢谢你 💕
        </button>
      </div>
    </div>
  )
}

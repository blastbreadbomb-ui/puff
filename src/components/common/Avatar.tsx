interface AvatarProps {
  type: 'user' | 'assistant'
  size?: 'sm' | 'md' | 'lg'
}

export default function Avatar({ type, size = 'md' }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
        type === 'user'
          ? 'bg-gradient-to-br from-purple-300 to-violet-400 text-white'
          : 'bg-gradient-to-br from-pink-300 to-rose-400 text-white'
      }`}
    >
      {type === 'user' ? '我' : '🌸'}
    </div>
  )
}

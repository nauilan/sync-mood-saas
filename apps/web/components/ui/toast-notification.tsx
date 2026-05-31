'use client'
import { useEffect } from 'react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

interface ToastNotificationProps {
  message: string
  type?: ToastType
  onClose: () => void
  duration?: number
}

export function ToastNotification({ message, type = 'success', onClose, duration = 3000 }: ToastNotificationProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  const icons = { success: CheckCircle, error: AlertCircle, info: Info }
  const colors = {
    success: 'border-emerald-500/20 text-emerald-400',
    error: 'border-rose-500/20 text-rose-400',
    info: 'border-violet-500/20 text-violet-400',
  }
  const Icon = icons[type]

  return (
    <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-4 py-3 rounded-xl bg-[#12111e] border ${colors[type]} shadow-xl max-w-xs animate-in fade-in slide-in-from-bottom-4 duration-300`}>
      <Icon className="w-4 h-4 shrink-0" />
      <p className="text-sm text-white/80 flex-1">{message}</p>
      <button onClick={onClose} className="text-white/25 hover:text-white/50 transition-colors">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

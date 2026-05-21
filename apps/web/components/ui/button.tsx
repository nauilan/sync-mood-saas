'use client'

import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import React from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'emerald'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

const variantMap: Record<ButtonVariant, string> = {
  primary: [
    'bg-gradient-to-r from-violet-600 to-cyan-500',
    'hover:from-violet-500 hover:to-cyan-400',
    'text-white font-semibold',
    'shadow-lg shadow-violet-900/30',
    'hover:shadow-violet-500/25',
  ].join(' '),
  secondary: [
    'bg-white/5 hover:bg-white/8',
    'text-white/75 hover:text-white/90',
    'border border-white/[0.08] hover:border-white/[0.15]',
    'hover:shadow-[0_0_12px_rgb(139_92_246_/_0.1)]',
  ].join(' '),
  ghost: 'hover:bg-white/5 text-white/50 hover:text-white/80',
  danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/30',
  emerald: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30',
}

const sizeMap: Record<ButtonSize, string> = {
  sm: 'h-7 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
  lg: 'h-10 px-5 text-sm',
  icon: 'h-8 w-8',
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold',
        'transition-all duration-200 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0a0e1a]',
        'disabled:pointer-events-none disabled:opacity-40',
        'active:scale-[0.97]',
        variantMap[variant],
        sizeMap[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  )
)
Button.displayName = 'Button'

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, currency = 'BRL') {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value)
}

export function formatDate(date: string | Date, format: 'short' | 'long' | 'month' = 'short') {
  const d = typeof date === 'string' ? new Date(date) : date
  if (format === 'month') return d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
  if (format === 'long') return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatPercent(value: number, decimals = 1) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
}
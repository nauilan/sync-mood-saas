'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Search, Music, Users, FileText, Shield, DollarSign, BarChart3, Settings, X } from 'lucide-react'

const PAGES = [
  { href: '/master/dashboard', label: 'Dashboard Global', group: 'Início', icon: BarChart3 },
  { href: '/master/cadastros', label: 'Cadastros — Titulares', group: 'M1', icon: Users },
  { href: '/master/contratos', label: 'Contratos', group: 'M2', icon: FileText },
  { href: '/master/obras', label: 'Obras', group: 'M3', icon: Music },
  { href: '/master/autorizacoes', label: 'Autorizações', group: 'M4', icon: Shield },
  { href: '/master/cwr', label: 'Importacao CWR', group: 'M3', icon: Music },
  { href: '/master/recebimentos', label: 'Recebimentos', group: 'M6', icon: DollarSign },
  { href: '/master/conciliacao', label: 'Conciliação', group: 'M7', icon: BarChart3 },
  { href: '/master/distribuicao', label: 'Distribuição', group: 'M8', icon: DollarSign },
  { href: '/master/cc-obra', label: 'Conta Corrente Obras', group: 'M9', icon: BarChart3 },
  { href: '/master/prestacao-contas', label: 'Prestação de Contas', group: 'M10', icon: FileText },
  { href: '/master/financeiro-m11', label: 'Financeiro', group: 'M11', icon: DollarSign },
  { href: '/master/relatorios', label: 'Relatórios & BI', group: 'M12-13', icon: BarChart3 },
  { href: '/master/relatorios/bi-estrategico', label: 'BI Estratégico', group: 'M13', icon: BarChart3 },
  { href: '/master/relatorios/auditoria', label: 'Auditoria — Relatórios', group: 'M13', icon: Shield },
  { href: '/master/config', label: 'Configurações', group: 'M14', icon: Settings },
  { href: '/master/config/usuarios', label: 'Configurações — Usuários', group: 'M14', icon: Users },
  { href: '/master/config/perfis', label: 'Configurações — Perfis', group: 'M14', icon: Shield },
  { href: '/master/config/integracoes', label: 'Configurações — Integrações', group: 'M14', icon: Settings },
  { href: '/portal/dashboard', label: 'Portal do Autor', group: 'Portal', icon: Music },
]

interface SearchModalProps {
  open: boolean
  onClose: () => void
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
    }
  }, [open])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        // Toggled externally
      }
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!open) return null

  const results = query.trim()
    ? PAGES.filter(p =>
        p.label.toLowerCase().includes(query.toLowerCase()) ||
        p.group.toLowerCase().includes(query.toLowerCase())
      )
    : PAGES.slice(0, 8)

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-[#12111e] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
          <Search className="w-4 h-4 text-white/30 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white/80 placeholder:text-white/25 outline-none"
            placeholder="Buscar página ou módulo..."
          />
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/[0.06] text-white/25 hover:text-white/50 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        {/* Results */}
        <div className="max-h-72 overflow-y-auto py-2">
          {results.length === 0 ? (
            <p className="px-4 py-4 text-sm text-white/30 text-center">Nenhum resultado encontrado.</p>
          ) : results.map(p => {
            const Icon = p.icon
            return (
              <Link key={p.href} href={p.href} onClick={onClose}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] transition-colors group">
                <div className="w-7 h-7 rounded-lg bg-white/[0.05] flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-white/30 group-hover:text-violet-400 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/70 group-hover:text-white/90 transition-colors truncate">{p.label}</p>
                  <p className="text-xs text-white/25">{p.group}</p>
                </div>
              </Link>
            )
          })}
        </div>
        <div className="px-4 py-2 border-t border-white/[0.06]">
          <p className="text-[10px] text-white/15">Pressione ESC para fechar · Cmd+K para abrir</p>
        </div>
      </div>
    </div>
  )
}

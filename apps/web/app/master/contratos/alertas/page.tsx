'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { ShieldAlert, Bell, ChevronRight, Building2, User, Calendar } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import {
  TIPO_CONTRATO_V2_LABELS, TIPO_CONTRATO_V2_COLORS,
} from '@/lib/types-contratos-v2'
import { authFetch } from '@/lib/supabase/client'

function formatDate(d?: string | null) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
}

export default function AlertasExclusividadePage() {
  const [contratos, setContratos] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    authFetch('/api/contratos?per_page=200')
      .then(r => r.json())
      .then(json => { if (json.data) setContratos(json.data) })
      .catch(() => {})
      .finally(() => setCarregando(false))
  }, [])

  const vencendo90d = useMemo(() => {
    const hoje = new Date()
    const limite = new Date()
    limite.setDate(hoje.getDate() + 90)
    return contratos.filter((c: any) => {
      if (!c.vigencia_fim) return false
      const fim = new Date(c.vigencia_fim + 'T00:00:00')
      return fim >= hoje && fim <= limite
    })
  }, [contratos])

  if (carregando) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Alertas de Exclusividade"
          description="Contratos com vencimento em ate 90 dias"
        />
        <div className="text-center py-24">
          <p className="text-white/30 text-sm">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alertas de Exclusividade"
        description="Contratos com exclusividade autoral vencendo em ate 90 dias"
      />

      {vencendo90d.length === 0 ? (
        <div className="text-center py-24">
          <ShieldAlert className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <p className="text-white/30 text-sm">Nenhum alerta de exclusividade ativo no momento.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <Bell className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-300">
              {vencendo90d.length} contrato(s) requerem atencao. Verifique e tome as acoes necessarias antes do vencimento.
            </p>
          </div>

          {vencendo90d.map(c => (
            <Link key={c.id} href={`/master/contratos/${c.id}`}>
              <div className="group bg-[#0d1526] border border-amber-500/15 hover:border-amber-500/30 rounded-xl px-5 py-4 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-white/90">{c.numero}</span>
                      {c.tipo && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TIPO_CONTRATO_V2_COLORS[c.tipo as keyof typeof TIPO_CONTRATO_V2_COLORS] ?? 'bg-white/5 text-white/40'}`}>
                          {TIPO_CONTRATO_V2_LABELS[c.tipo as keyof typeof TIPO_CONTRATO_V2_LABELS] ?? c.tipo}
                        </span>
                      )}
                      <span className="text-xs bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full font-medium">
                        Vencimento Proximo
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-white/40 flex-wrap">
                      {c.titular_principal && (
                        <span className="flex items-center gap-1">
                          {c.titular_tipo_pessoa === 'PJ' ? <Building2 className="w-3 h-3" /> : <User className="w-3 h-3" />}
                          {c.titular_principal}
                        </span>
                      )}
                      {c.vigencia_fim && (
                        <>
                          <span className="text-white/20">·</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Vence em {formatDate(c.vigencia_fim)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-amber-400 transition-colors flex-shrink-0" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="text-xs text-white/30">
        Alertas sao gerados para contratos com vencimento em ate 90 dias.
        <Link href="/master/contratos" className="ml-1 text-violet-400 hover:text-violet-300">
          Ver todos os contratos
        </Link>
      </div>
    </div>
  )
}

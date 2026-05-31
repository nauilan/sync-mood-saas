'use client'

import Link from 'next/link'
import { ShieldAlert, Bell, ChevronRight, Building2, User, Calendar } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import {
  TIPO_CONTRATO_V2_LABELS, TIPO_CONTRATO_V2_COLORS,
  STATUS_CONTRATO_V2_LABELS, STATUS_CONTRATO_V2_COLORS,
} from '@/lib/types-contratos-v2'
import { MOCK_CONTRATOS_V2, ALERTAS_EXCLUSIVIDADE } from '@/lib/mock-contratos-v2'

function formatDate(d?: string | null) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
}

export default function AlertasExclusividadePage() {
  const vencendo90d = MOCK_CONTRATOS_V2.filter(c => c.status === 'vencendo' || c._dias_para_vencer != null)

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
              {vencendo90d.length} contrato(s) de exclusividade requerem atencao. Verifique e tome as acoes necessarias antes do vencimento.
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
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TIPO_CONTRATO_V2_COLORS[c.tipo]}`}>
                        {TIPO_CONTRATO_V2_LABELS[c.tipo]}
                      </span>
                      <span className="text-xs bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full font-medium">
                        Exclusividade Ativa
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-white/40 flex-wrap">
                      <span className="flex items-center gap-1">
                        {c.titular_tipo_pessoa === 'PJ' ? <Building2 className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        {c.titular_principal}
                      </span>
                      <span className="text-white/20">·</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Vence em {formatDate(c.vigencia_fim)}
                      </span>
                      {c._dias_para_vencer != null && (
                        <>
                          <span className="text-white/20">·</span>
                          <span className="text-amber-400 font-semibold">
                            {c._dias_para_vencer} dias restantes
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
        Alertas sao gerados automaticamente para contratos com exclusividade autoral com vencimento em ate 90 dias.
        <Link href="/master/contratos" className="ml-1 text-violet-400 hover:text-violet-300">
          Ver todos os contratos
        </Link>
      </div>
    </div>
  )
}

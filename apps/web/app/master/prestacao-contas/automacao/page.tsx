'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Settings, Mail, MessageCircle, Globe, Zap, Check, Clock } from 'lucide-react'
import { MOCK_REGRAS_AUTOMACAO } from '@/lib/mock-prestacao'
import { CANAL_ENVIO_LABELS, type CanalEnvio } from '@/lib/types-prestacao'

export default function AutomacaoPrestacaoPage() {
  const [regras, setRegras] = useState(MOCK_REGRAS_AUTOMACAO)

  function toggleRegra(id: string) {
    setRegras(prev => prev.map(r => r.id === id ? { ...r, ativa: !r.ativa } : r))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automação de Prestações"
        description="Configure regras automáticas de geração e envio de demonstrativos."
      />

      <div className="space-y-4">
        {regras.map(regra => (
          <div key={regra.id} className={['bg-[#0d1526] border rounded-xl p-5 space-y-4', regra.ativa ? 'border-violet-500/20' : 'border-white/[0.06]'].join(' ')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={['w-8 h-8 rounded-lg flex items-center justify-center', regra.ativa ? 'bg-violet-500/15' : 'bg-white/[0.04]'].join(' ')}>
                  <Settings className={['w-4 h-4', regra.ativa ? 'text-violet-400' : 'text-white/30'].join(' ')} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/80">
                    {regra.trigger === 'fim_trimestre' ? 'Fim de Trimestre' : regra.trigger === 'fim_mes' ? 'Fim de Mês' : 'Manual'}
                  </p>
                  {regra.proximo_disparo && <p className="text-[10px] text-white/30 flex items-center gap-1"><Clock className="w-3 h-3" />Próximo disparo: {new Date(regra.proximo_disparo).toLocaleDateString('pt-BR')}</p>}
                </div>
              </div>
              <button
                onClick={() => toggleRegra(regra.id)}
                className={['relative w-10 h-5 rounded-full transition-colors', regra.ativa ? 'bg-violet-600' : 'bg-white/10'].join(' ')}
              >
                <span className={['absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', regra.ativa ? 'translate-x-5' : ''].join(' ')} />
              </button>
            </div>

            <div>
              <p className="text-[10px] text-white/40 mb-2">Canais</p>
              <div className="flex items-center gap-2">
                {(['email', 'whatsapp', 'portal'] as CanalEnvio[]).map(c => (
                  <span key={c} className={['flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border', regra.canais.includes(c) ? 'bg-violet-500/10 border-violet-500/20 text-violet-400' : 'bg-white/[0.02] border-white/[0.06] text-white/25'].join(' ')}>
                    {c === 'email' ? <Mail className="w-3 h-3" /> : c === 'whatsapp' ? <MessageCircle className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                    {CANAL_ENVIO_LABELS[c]}
                  </span>
                ))}
              </div>
            </div>

            {regra.template_email && (
              <div>
                <p className="text-[10px] text-white/40 mb-1">Template E-mail</p>
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
                  <p className="text-xs text-white/50 font-mono">{regra.template_email}</p>
                </div>
              </div>
            )}
            {regra.template_whatsapp && (
              <div>
                <p className="text-[10px] text-white/40 mb-1">Template WhatsApp</p>
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
                  <p className="text-xs text-white/50">{regra.template_whatsapp}</p>
                </div>
              </div>
            )}

            {regra.ultimo_disparo && (
              <p className="text-[10px] text-white/30">Último disparo: {new Date(regra.ultimo_disparo).toLocaleDateString('pt-BR')}</p>
            )}
          </div>
        ))}

        <button className="flex items-center gap-2 h-9 px-4 rounded-xl border border-dashed border-white/[0.12] text-xs text-white/30 hover:text-white/60 hover:border-white/25 transition-colors w-full justify-center">
          <Zap className="w-3.5 h-3.5" />
          Adicionar nova regra de automação
        </button>
      </div>
    </div>
  )
}

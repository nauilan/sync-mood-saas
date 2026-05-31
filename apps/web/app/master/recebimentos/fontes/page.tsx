'use client'

import { useState, useMemo } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import {
  Settings, ToggleLeft, ToggleRight, Globe, FileText, CheckCircle2, XCircle,
} from 'lucide-react'
import { MOCK_FONTES } from '@/lib/mock-recebimentos'
import type { TipoFonte, RecebimentoFonte } from '@/lib/types-recebimentos'

const TIPO_FONTE_LABELS: Record<TipoFonte, string> = {
  sociedade:      'Sociedade',
  dsp:            'DSP',
  cliente_direto: 'Cliente Direto',
  subeditora:     'Subeditora',
  outro:          'Outro',
}

const TIPO_FONTE_COLORS: Record<TipoFonte, string> = {
  sociedade:      'bg-violet-500/20 text-violet-300 border-violet-500/30',
  dsp:            'bg-sky-500/20 text-sky-300 border-sky-500/30',
  cliente_direto: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  subeditora:     'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  outro:          'bg-slate-500/20 text-slate-300 border-slate-500/30',
}

export default function FontesPage() {
  const [fontes, setFontes] = useState<RecebimentoFonte[]>(MOCK_FONTES)
  const [configModal, setConfigModal] = useState<string | null>(null)

  function toggleAtivo(codigo: string) {
    setFontes(prev => prev.map(f => f.codigo === codigo ? { ...f, ativo: !f.ativo } : f))
  }

  const kpis = useMemo(() => {
    const tiposSet = new Set(fontes.map(f => f.tipo))
    return {
      total:    fontes.length,
      ativos:   fontes.filter(f => f.ativo).length,
      inativos: fontes.filter(f => !f.ativo).length,
      tipos:    tiposSet.size,
    }
  }, [fontes])

  const configFonte = fontes.find(f => f.codigo === configModal)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fontes de Recebimento"
        description="Configure e ative/desative as fontes de royalties — sociedades, DSPs, subeditoras e clientes diretos"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',   value: kpis.total,    color: 'text-white/80',    icon: FileText },
          { label: 'Ativos',  value: kpis.ativos,   color: 'text-emerald-400', icon: CheckCircle2 },
          { label: 'Inativos',value: kpis.inativos, color: 'text-red-400',     icon: XCircle },
          { label: 'Tipos',   value: kpis.tipos,    color: 'text-violet-400',  icon: Globe },
        ].map(stat => (
          <div key={stat.label} className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-3 flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <stat.icon className={`w-3 h-3 ${stat.color}`} />
              <p className="text-[10px] text-white/35">{stat.label}</p>
            </div>
            <p className={`text-xl font-bold ${stat.color} leading-tight`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
          <p className="text-xs text-white/40">{fontes.length} fontes cadastradas</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-xs font-semibold text-white/30 px-5 py-3 w-36">Código</th>
                <th className="text-left text-xs font-semibold text-white/30 px-4 py-3">Nome</th>
                <th className="text-left text-xs font-semibold text-white/30 px-4 py-3 w-36">Tipo</th>
                <th className="text-center text-xs font-semibold text-white/30 px-4 py-3 w-24">Ativo</th>
                <th className="text-center text-xs font-semibold text-white/30 px-4 py-3 w-28">Configurações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {fontes.map(fonte => (
                <tr key={fonte.codigo} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-mono text-white/50">{fonte.codigo}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-white/80 font-medium">{fonte.nome}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${TIPO_FONTE_COLORS[fonte.tipo]}`}>
                      {TIPO_FONTE_LABELS[fonte.tipo]}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <button
                      onClick={() => toggleAtivo(fonte.codigo)}
                      className="flex items-center justify-center mx-auto transition-colors"
                      title={fonte.ativo ? 'Clique para desativar' : 'Clique para ativar'}
                    >
                      {fonte.ativo ? (
                        <ToggleRight className="w-6 h-6 text-emerald-400 hover:text-emerald-300" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-white/20 hover:text-white/40" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <button
                      onClick={() => setConfigModal(fonte.codigo)}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white/5 border border-white/[0.06] text-white/30 hover:text-violet-400 hover:bg-violet-500/10 hover:border-violet-500/30 transition-colors"
                      title="Configurações"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Config Modal */}
      {configModal && configFonte && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0d1526] border border-white/[0.06] rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/30">
                  <Settings className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Configurar Fonte</h2>
                  <p className="text-xs text-white/40">{configFonte.nome}</p>
                </div>
              </div>
              <button onClick={() => setConfigModal(null)} className="text-white/30 hover:text-white/70 transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/[0.04] rounded-lg">
                <div>
                  <p className="text-xs font-semibold text-white/70">Código</p>
                  <p className="text-xs font-mono text-white/40 mt-0.5">{configFonte.codigo}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${TIPO_FONTE_COLORS[configFonte.tipo]}`}>
                  {TIPO_FONTE_LABELS[configFonte.tipo]}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/[0.04] rounded-lg">
                <p className="text-xs text-white/60">Status</p>
                <button
                  onClick={() => { toggleAtivo(configFonte.codigo); setConfigModal(null) }}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                    configFonte.ativo
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30'
                      : 'bg-red-500/10 text-red-300 border-red-500/30 hover:bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-500/30'
                  }`}
                >
                  {configFonte.ativo ? <><ToggleRight className="w-3.5 h-3.5" /> Ativo — clique para desativar</> : <><ToggleLeft className="w-3.5 h-3.5" /> Inativo — clique para ativar</>}
                </button>
              </div>
              <p className="text-xs text-white/25 text-center pt-2">
                Configurações avançadas disponíveis em breve.
              </p>
            </div>
            <div className="flex justify-end px-6 pb-5">
              <button
                onClick={() => setConfigModal(null)}
                className="h-8 px-4 rounded-lg text-xs text-white/50 hover:text-white/80 transition-colors border border-white/[0.06] hover:border-white/20"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

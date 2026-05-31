'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, X, ChevronRight, CheckCheck, RotateCcw } from 'lucide-react'
import { executarReversaoAutomatica, type RegistroReversao } from '@/lib/motor-reversao-direitos'

interface ContratoVencendo {
  id: string
  codigo: string
  nome: string
  tipo: string
  data_termino: string
  dias_restantes: number
  ativo: boolean
  alerta_antecedencia_dias: number
}

function diasEntre(hoje: Date, dataTermino: string): number {
  const term = new Date(dataTermino + 'T12:00:00')
  return Math.ceil((term.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
}

function chaveHoje(): string {
  return `sync_alertas_lidos_${new Date().toISOString().split('T')[0]}`
}

export function AlertasVencimento() {
  const [contratos, setContratos] = useState<ContratoVencendo[]>([])
  const [reversoes, setReversoes] = useState<RegistroReversao[]>([])
  const [visivel, setVisivel] = useState(false)
  const [lido, setLido] = useState(false)

  useEffect(() => {
    const jaLidoHoje = localStorage.getItem(chaveHoje()) === '1'
    if (jaLidoHoje) return

    // 1. Executa reversão automática primeiro (dia subsequente ao término)
    const reversoesExecutadas = executarReversaoAutomatica()
    if (reversoesExecutadas.length > 0) setReversoes(reversoesExecutadas)

    // 2. Carrega alertas de vencimento próximo — lê ambas as chaves de contrato
    try {
      const keys = ['sync_contratos_tipo_v2', 'sync_contratos_v2']
      const hoje = new Date()
      const alertasTotal: ContratoVencendo[] = []

      for (const key of keys) {
        const raw = localStorage.getItem(key)
        if (!raw) continue
        const lista = JSON.parse(raw) as ContratoVencendo[]

        for (const c of lista) {
          if (!c.ativo || !c.data_termino) continue
          const dias = diasEntre(hoje, c.data_termino)

          // Exclusividade — alerta em 90, 30, 10 dias + diário
          const isExcl = c.tipo === 'exclusividade_autor_editora'
          const threshold = isExcl ? 90 : 10

          if (dias <= threshold) {
            alertasTotal.push({ ...c, dias_restantes: dias, alerta_antecedencia_dias: threshold })
          }
        }
      }

      const alertas = alertasTotal.sort((a, b) => a.dias_restantes - b.dias_restantes)

      if (alertas.length > 0 || reversoesExecutadas.length > 0) {
        setContratos(alertas)
        setVisivel(true)
      }
    } catch {
      if (reversoesExecutadas.length > 0) setVisivel(true)
    }
  }, [])

  function fechar() {
    setLido(true)
    setTimeout(() => {
      setVisivel(false)
      localStorage.setItem(chaveHoje(), '1')
    }, 300)
  }

  if (!visivel) return null

  const vencidos   = contratos.filter(c => c.dias_restantes < 0)
  const urgentes   = contratos.filter(c => c.dias_restantes >= 0 && c.dias_restantes <= 3)
  const proximos   = contratos.filter(c => c.dias_restantes > 3 && c.dias_restantes <= 10)

  const totalItens = reversoes.length + contratos.length

  return (
    <div className={`fixed inset-0 z-[9999] flex items-start justify-center pt-16 px-4 transition-all duration-300 ${lido ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      {/* Overlay escuro passivo */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={fechar} />

      {/* Banner */}
      <div className="relative w-full max-w-xl z-10 animate-in slide-in-from-top-4 duration-300">
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10"
          style={{ background: 'linear-gradient(135deg, #0f0d1a 0%, #130d20 100%)' }}>

          {/* Cabeçalho */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.07]"
            style={{ background: 'rgba(239,68,68,0.06)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <AlertTriangle className="w-4 h-4" style={{ color: '#f87171' }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">
                Atenção — {contratos.length} contrato{contratos.length !== 1 ? 's' : ''} requer{contratos.length === 1 ? '' : 'em'} atenção
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Alerta diário automático · {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <button onClick={fechar}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
              style={{ color: 'rgba(255,255,255,0.3)' }}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Lista de contratos */}
          <div className="max-h-72 overflow-y-auto divide-y divide-white/[0.04]">

            {/* Vencidos */}
            {vencidos.length > 0 && (
              <div>
                <div className="px-5 py-2" style={{ background: 'rgba(239,68,68,0.04)' }}>
                  <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#f87171' }}>
                    🔴 Vencidos — direitos retornaram ao cedente
                  </p>
                </div>
                {vencidos.map(c => (
                  <div key={c.id} className="flex items-start gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                      style={{ background: '#ef4444', boxShadow: '0 0 6px rgba(239,68,68,0.7)' }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>{c.codigo}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                          style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                          VENCIDO
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-white mt-0.5 truncate">{c.nome}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        Venceu em {new Date(c.data_termino + 'T12:00:00').toLocaleDateString('pt-BR')} · há {Math.abs(c.dias_restantes)} dia{Math.abs(c.dias_restantes) !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 mt-1" style={{ color: 'rgba(255,255,255,0.15)' }} />
                  </div>
                ))}
              </div>
            )}

            {/* Urgentes (0–3 dias) */}
            {urgentes.length > 0 && (
              <div>
                <div className="px-5 py-2" style={{ background: 'rgba(239,68,68,0.03)' }}>
                  <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#fb923c' }}>
                    🟠 Vence em até 3 dias — urgente
                  </p>
                </div>
                {urgentes.map(c => (
                  <div key={c.id} className="flex items-start gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                      style={{ background: '#f97316', boxShadow: '0 0 6px rgba(249,115,22,0.7)' }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>{c.codigo}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                          style={{ background: 'rgba(249,115,22,0.12)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.2)' }}>
                          {c.dias_restantes === 0 ? 'HOJE' : `${c.dias_restantes} DIA${c.dias_restantes !== 1 ? 'S' : ''}`}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-white mt-0.5 truncate">{c.nome}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        Vence em {new Date(c.data_termino + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 mt-1" style={{ color: 'rgba(255,255,255,0.15)' }} />
                  </div>
                ))}
              </div>
            )}

            {/* Próximos (4–10 dias) */}
            {proximos.length > 0 && (
              <div>
                <div className="px-5 py-2" style={{ background: 'rgba(245,158,11,0.03)' }}>
                  <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#fbbf24' }}>
                    🟡 Vence em até 10 dias
                  </p>
                </div>
                {proximos.map(c => (
                  <div key={c.id} className="flex items-start gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                      style={{ background: '#f59e0b', boxShadow: '0 0 6px rgba(245,158,11,0.6)' }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>{c.codigo}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                          style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}>
                          {c.dias_restantes} DIAS
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-white mt-0.5 truncate">{c.nome}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        Vence em {new Date(c.data_termino + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 mt-1" style={{ color: 'rgba(255,255,255,0.15)' }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rodapé */}
          <div className="px-5 py-3 border-t flex items-center justify-between"
            style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)' }}>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Este alerta aparece diariamente a cada novo acesso até a data de término.
            </p>
            <button onClick={fechar}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
              style={{ background: 'rgba(139,92,246,0.15)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.25)' }}>
              <CheckCheck className="w-3.5 h-3.5" />
              Li e entendi
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

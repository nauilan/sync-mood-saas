'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import {
  Download, Plus, Loader2, AlertTriangle, CheckCircle2,
  Clock, FileText, ChevronRight, RefreshCw,
} from 'lucide-react'
import { authFetch } from '@/lib/supabase/client'

const STATUS_EXP_LABELS: Record<string, string> = {
  rascunho:  'Rascunho',
  gerando:   'Gerando',
  gerado:    'Gerado',
  enviado:   'Enviado',
  confirmado:'Confirmado',
  erro:      'Erro',
}

const STATUS_EXP_COLORS: Record<string, string> = {
  rascunho:  'bg-slate-500/15 text-slate-400',
  gerando:   'bg-amber-500/15 text-amber-400',
  gerado:    'bg-sky-500/15 text-sky-400',
  enviado:   'bg-violet-500/15 text-violet-400',
  confirmado:'bg-emerald-500/15 text-emerald-400',
  erro:      'bg-rose-500/15 text-rose-400',
}

const DESTINO_LABELS: Record<string, string> = {
  cwr:        'CWR v2.2',
  socinpro:   'Socinpro',
  backoffice: 'BackOffice',
}

export default function ExportacoesPage() {
  const [exportacoes, setExportacoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  // Modal nova exportação
  const [showModal, setShowModal] = useState(false)
  const [destino, setDestino] = useState('cwr')
  const [formato, setFormato] = useState('txt')
  const [criando, setCriando] = useState(false)
  const [erroModal, setErroModal] = useState('')

  useEffect(() => { loadExportacoes() }, [])

  async function loadExportacoes() {
    setLoading(true)
    try {
      const res = await authFetch('/api/exportacoes')
      if (!res.ok) { setErro('Erro ao carregar exportações.'); return }
      const d = await res.json()
      setExportacoes(d.data ?? [])
    } catch {
      setErro('Falha na requisição.')
    } finally {
      setLoading(false)
    }
  }

  async function criarExportacao() {
    setErroModal('')
    setCriando(true)
    try {
      const res = await authFetch('/api/exportacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destino, formato, obra_ids: [] }),
      })
      const d = await res.json()
      if (!res.ok) { setErroModal(d.error ?? 'Erro ao criar exportação.'); return }
      setShowModal(false)
      loadExportacoes()
    } catch {
      setErroModal('Falha na requisição.')
    } finally {
      setCriando(false)
    }
  }

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Exportações"
        description="Geração e envio de lotes para CWR, Socinpro e BackOffice"
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Nova Exportação
          </button>
        }
      />

      {erro && (
        <div className="flex items-center gap-2 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {erro}
        </div>
      )}

      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold text-white">Lotes de Exportação</h2>
          <button onClick={loadExportacoes} className="text-xs text-white/30 hover:text-white/60 flex items-center gap-1 transition-colors">
            <RefreshCw className="w-3 h-3" /> Atualizar
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-white/30 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
          </div>
        ) : exportacoes.length === 0 ? (
          <div className="py-14 text-center">
            <FileText className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/30">Nenhuma exportação criada ainda.</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              Criar primeiro lote
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="text-left px-5 py-2.5 text-white/30 font-semibold">Código</th>
                  <th className="text-center px-4 py-2.5 text-white/30 font-semibold">Destino</th>
                  <th className="text-center px-4 py-2.5 text-white/30 font-semibold">Formato</th>
                  <th className="text-center px-4 py-2.5 text-white/30 font-semibold">Obras</th>
                  <th className="text-center px-4 py-2.5 text-white/30 font-semibold">Status</th>
                  <th className="text-right px-5 py-2.5 text-white/30 font-semibold">Data</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {exportacoes.map((e: any) => (
                  <tr key={e.id} className="hover:bg-white/[0.02] group">
                    <td className="px-5 py-3">
                      <a href={`/master/exportacoes/${e.id}`} className="font-mono text-violet-400 hover:text-violet-300 transition-colors">
                        {e.codigo ?? e.id.slice(0, 8)}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-sky-500/10 text-sky-300 px-1.5 py-0.5 rounded text-[11px] font-semibold uppercase">
                        {DESTINO_LABELS[e.destino] ?? e.destino}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-white/40 uppercase font-mono">{e.formato ?? '—'}</td>
                    <td className="px-4 py-3 text-center text-white/60 tabular-nums">{e.total_obras ?? 0}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_EXP_COLORS[e.status] ?? 'bg-white/5 text-white/40'}`}>
                        {STATUS_EXP_LABELS[e.status] ?? e.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-white/30 tabular-nums whitespace-nowrap">
                      {e.criado_em ? new Date(e.criado_em).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a href={`/master/exportacoes/${e.id}`} className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-white/60 transition-all">
                        <ChevronRight className="w-4 h-4" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Nova Exportação */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowModal(false)} />
          <div className="relative bg-[#0d1526] border border-white/[0.08] rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-sm font-semibold text-white mb-4">Nova Exportação</h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/50 block mb-1.5">Destino</label>
                <select
                  value={destino}
                  onChange={e => {
                    setDestino(e.target.value)
                    setFormato(e.target.value === 'cwr' ? 'txt' : e.target.value === 'socinpro' ? 'csv' : 'json')
                  }}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                >
                  <option value="cwr">CWR v2.2</option>
                  <option value="socinpro">Socinpro</option>
                  <option value="backoffice">BackOffice</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-white/50 block mb-1.5">Formato</label>
                <input
                  value={formato}
                  readOnly
                  className="w-full bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/40 cursor-not-allowed"
                />
              </div>

              <div className="bg-amber-500/[0.07] border border-amber-500/20 rounded-lg px-4 py-3 text-xs text-amber-300/70">
                O lote será criado em rascunho. Adicione obras e clique em <b>Gerar</b> para produzir o arquivo.
              </div>

              {erroModal && (
                <div className="flex items-start gap-2 px-3 py-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {erroModal}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={criarExportacao}
                disabled={criando}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                {criando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Criar Lote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

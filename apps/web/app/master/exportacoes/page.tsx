'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, Loader2, AlertTriangle, FileText, ChevronRight, RefreshCw } from 'lucide-react'

import { PageHeader } from '@/components/ui/page-header'
import { DEFAULT_CWR_VERSION } from '@/lib/cwr-versions'
import { authFetch } from '@/lib/supabase/client'

const STATUS_EXP_LABELS: Record<string, string> = {
  rascunho: 'Rascunho',
  gerando: 'Gerando',
  gerado: 'Gerado',
  enviado: 'Enviado',
  confirmado: 'Confirmado',
  erro: 'Erro',
}

const STATUS_EXP_COLORS: Record<string, string> = {
  rascunho: 'bg-slate-500/15 text-slate-400',
  gerando: 'bg-amber-500/15 text-amber-400',
  gerado: 'bg-sky-500/15 text-sky-400',
  enviado: 'bg-violet-500/15 text-violet-400',
  confirmado: 'bg-emerald-500/15 text-emerald-400',
  erro: 'bg-rose-500/15 text-rose-400',
}

const DESTINO_LABELS: Record<string, string> = {
  cwr: 'CWR',
  socinpro: 'Socinpro',
  backoffice: 'BackOffice',
}

export default function ExportacoesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const obraIdParam = searchParams.get('obra_id')?.trim() ?? ''

  const [exportacoes, setExportacoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [destino, setDestino] = useState('cwr')
  const [formato, setFormato] = useState('txt')
  const [cwrVersion, setCwrVersion] = useState<'2.1' | '2.2'>(DEFAULT_CWR_VERSION)
  const [criando, setCriando] = useState(false)
  const [erroModal, setErroModal] = useState('')

  useEffect(() => {
    loadExportacoes()
  }, [])

  async function loadExportacoes() {
    setLoading(true)
    setErro('')
    try {
      const endpoint = obraIdParam ? `/api/exportacoes?obra_id=${encodeURIComponent(obraIdParam)}` : '/api/exportacoes'
      const res = await authFetch(endpoint)
      if (!res.ok) {
        setErro('Erro ao carregar exportações.')
        return
      }
      const data = await res.json()
      setExportacoes(data.data ?? [])
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
        body: JSON.stringify({
          destino,
          formato,
          cwr_version: cwrVersion,
          obra_ids: obraIdParam ? [obraIdParam] : [],
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErroModal(data.error ?? 'Erro ao criar exportação.')
        return
      }
      setShowModal(false)
      const exportacaoId = typeof data?.data?.id === 'string' ? data.data.id.trim() : ''
      if (exportacaoId && exportacaoId !== 'undefined') {
        router.push(`/master/exportacoes/${exportacaoId}`)
        return
      }
      console.warn('Lote criado sem ID válido para redirecionamento.', data)
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
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet-500"
          >
            <Plus className="h-3.5 w-3.5" /> Nova Exportação
          </button>
        }
      />

      {erro && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {erro}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#0d1526]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
          <h2 className="text-sm font-semibold text-white">Lotes de Exportação</h2>
          <button onClick={loadExportacoes} className="flex items-center gap-1 text-xs text-white/30 transition-colors hover:text-white/60">
            <RefreshCw className="h-3 w-3" /> Atualizar
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-white/30">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
          </div>
        ) : exportacoes.length === 0 ? (
          <div className="py-14 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-white/10" />
            <p className="text-sm text-white/30">
              {obraIdParam ? 'Nenhuma exportação registrada para esta obra.' : 'Nenhuma exportação criada ainda.'}
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 text-xs text-violet-400 transition-colors hover:text-violet-300"
            >
              Criar primeiro lote
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="px-5 py-2.5 text-left font-semibold text-white/30">Código</th>
                  <th className="px-4 py-2.5 text-center font-semibold text-white/30">Destino</th>
                  <th className="px-4 py-2.5 text-center font-semibold text-white/30">Formato</th>
                  <th className="px-4 py-2.5 text-center font-semibold text-white/30">Versão</th>
                  <th className="px-4 py-2.5 text-center font-semibold text-white/30">Obras</th>
                  <th className="px-4 py-2.5 text-center font-semibold text-white/30">Status</th>
                  <th className="px-5 py-2.5 text-right font-semibold text-white/30">Data</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {exportacoes.map((item: any) => (
                  <tr key={item.id} className="group hover:bg-white/[0.02]">
                    <td className="px-5 py-3">
                      <a href={`/master/exportacoes/${item.id}`} className="font-mono text-violet-400 transition-colors hover:text-violet-300">
                        {item.codigo ?? item.id.slice(0, 8)}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-[11px] font-semibold uppercase text-sky-300">
                        {DESTINO_LABELS[item.destino] ?? item.destino}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono uppercase text-white/40">{item.formato ?? '—'}</td>
                    <td className="px-4 py-3 text-center font-mono text-white/50">{item.cwr_version ?? DEFAULT_CWR_VERSION}</td>
                    <td className="px-4 py-3 text-center tabular-nums text-white/60">{item.total_obras ?? 0}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_EXP_COLORS[item.status] ?? 'bg-white/5 text-white/40'}`}>
                        {STATUS_EXP_LABELS[item.status] ?? item.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-white/30">
                      {item.criado_em ? new Date(item.criado_em).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a href={`/master/exportacoes/${item.id}`} className="text-white/30 opacity-0 transition-all hover:text-white/60 group-hover:opacity-100">
                        <ChevronRight className="h-4 w-4" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md rounded-xl border border-white/[0.08] bg-[#0d1526] p-6 shadow-2xl">
            <h3 className="mb-4 text-sm font-semibold text-white">Nova Exportação</h3>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs text-white/50">Destino</label>
                <select
                  value={destino}
                  onChange={(event) => {
                    const nextDestino = event.target.value
                    setDestino(nextDestino)
                    setFormato(nextDestino === 'cwr' ? 'txt' : nextDestino === 'socinpro' ? 'csv' : 'json')
                  }}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-violet-500/50 focus:outline-none"
                >
                  <option value="cwr">CWR</option>
                  <option value="socinpro">Socinpro</option>
                  <option value="backoffice">BackOffice</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-white/50">Formato</label>
                <input
                  value={formato}
                  readOnly
                  className="w-full cursor-not-allowed rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white/40"
                />
              </div>

              {destino === 'cwr' && (
                <div>
                  <label className="mb-1.5 block text-xs text-white/50">Versão CWR</label>
                  <select
                    value={cwrVersion}
                    onChange={(event) => setCwrVersion(event.target.value as '2.1' | '2.2')}
                    className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-violet-500/50 focus:outline-none"
                  >
                    <option value="2.1">2.1</option>
                    <option value="2.2">2.2</option>
                  </select>
                </div>
              )}

              <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.07] px-4 py-3 text-xs text-amber-300/70">
                {obraIdParam
                  ? 'O lote será criado já com a obra atual. Depois clique em Gerar para produzir o arquivo.'
                  : 'O lote será criado em rascunho. Adicione obras e clique em Gerar para produzir o arquivo.'}
              </div>

              {erroModal && (
                <div className="flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-300">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {erroModal}
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs text-white/40 transition-colors hover:text-white/70"
              >
                Cancelar
              </button>
              <button
                onClick={criarExportacao}
                disabled={criando}
                className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
              >
                {criando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Criar Lote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
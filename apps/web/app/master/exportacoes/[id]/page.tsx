'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import {
  Download, Loader2, AlertTriangle, CheckCircle2, XCircle,
  RefreshCw, Play, ChevronLeft, FileText, Music, Clock,
} from 'lucide-react'
import { authFetch } from '@/lib/supabase/client'

const STATUS_EXP_LABELS: Record<string, string> = {
  rascunho:   'Rascunho',
  gerando:    'Gerando',
  gerado:     'Gerado',
  enviado:    'Enviado',
  confirmado: 'Confirmado',
  erro:       'Erro',
}

const STATUS_EXP_COLORS: Record<string, string> = {
  rascunho:   'bg-slate-500/15 text-slate-400',
  gerando:    'bg-amber-500/15 text-amber-400',
  gerado:     'bg-sky-500/15 text-sky-400',
  enviado:    'bg-violet-500/15 text-violet-400',
  confirmado: 'bg-emerald-500/15 text-emerald-400',
  erro:       'bg-rose-500/15 text-rose-400',
}

const DESTINO_LABELS: Record<string, string> = {
  cwr:        'CWR v2.2',
  socinpro:   'Socinpro',
  backoffice: 'BackOffice',
}

export default function ExportacaoDetailPage() {
  const params = useParams<{ id: string }>()
  const exportacaoId = typeof params?.id === 'string' ? params.id : ''
  const [exp, setExp] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [gerando, setGerando] = useState(false)
  const [erroGerar, setErroGerar] = useState('')

  useEffect(() => {
    if (!exportacaoId) return
    loadExportacao()
  }, [exportacaoId])

  async function loadExportacao() {
    if (!exportacaoId) {
      setErro('Exportação não encontrada.')
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await authFetch(`/api/exportacoes/${exportacaoId}`)
      if (!res.ok) { setErro('Exportação não encontrada.'); return }
      const d = await res.json()
      // API retorna { exportacao, obras, logs, retorno } — achata para facilitar render
      const raw = d.data ?? {}
      const exp = raw.exportacao ?? raw
      setExp({
        ...exp,
        obras:   raw.obras   ?? [],
        logs:    (raw.logs ?? []).map((l: any) => ({
          ...l,
          mensagem:  l.mensagem ?? l.evento,
          nivel:     l.nivel ?? 'info',
          timestamp: l.timestamp ?? l.criado_em,
        })),
        retornos: raw.retorno ? [raw.retorno] : [],
      })
    } catch {
      setErro('Falha na requisição.')
    } finally {
      setLoading(false)
    }
  }

  async function gerarArquivo() {
    if (!exportacaoId) {
      setErroGerar('Exportação não encontrada.')
      return
    }
    setErroGerar('')
    setGerando(true)
    try {
      const res = await authFetch(`/api/exportacoes/${exportacaoId}/gerar`, { method: 'POST' })
      const d = await res.json()
      if (!res.ok) { setErroGerar(d.error ?? 'Erro ao gerar arquivo.'); return }
      await loadExportacao()
    } catch {
      setErroGerar('Falha na requisição.')
    } finally {
      setGerando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-white/30 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
      </div>
    )
  }

  if (erro || !exp) {
    return (
      <div className="space-y-4">
        <Link href="/master/exportacoes" className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" /> Exportações
        </Link>
        <div className="flex items-center gap-2 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {erro || 'Exportação não encontrada.'}
        </div>
      </div>
    )
  }

  const statusColor = STATUS_EXP_COLORS[exp.status] ?? 'bg-white/5 text-white/40'
  const podeGerar = ['rascunho', 'erro'].includes(exp.status)
  const temArquivo = exp.arquivo_url && exp.status !== 'rascunho'

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-2">
        <Link href="/master/exportacoes" className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" /> Exportações
        </Link>
      </div>

      <PageHeader
        title={exp.codigo ?? `Exportação ${exp.id.slice(0, 8)}`}
        description={`${DESTINO_LABELS[exp.destino] ?? exp.destino} — ${exp.formato?.toUpperCase() ?? '—'}`}
        actions={
          <div className="flex items-center gap-3">
            {temArquivo && (
              <a
                href={exp.arquivo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Baixar Arquivo
              </a>
            )}
            {podeGerar && (
              <button
                onClick={gerarArquivo}
                disabled={gerando}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
              >
                {gerando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                {gerando ? 'Gerando...' : 'Gerar Arquivo'}
              </button>
            )}
            {exp.status === 'erro' && !gerando && (
              <button
                onClick={gerarArquivo}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reenviar
              </button>
            )}
          </div>
        }
      />

      {erroGerar && (
        <div className="flex items-center gap-2 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {erroGerar}
        </div>
      )}

      {/* Status geral */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-[11px] text-white/30 mb-1">Status</p>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusColor}`}>
              {STATUS_EXP_LABELS[exp.status] ?? exp.status}
            </span>
          </div>
          <div>
            <p className="text-[11px] text-white/30 mb-1">Destino</p>
            <p className="text-sm font-semibold text-white">{DESTINO_LABELS[exp.destino] ?? exp.destino}</p>
          </div>
          <div>
            <p className="text-[11px] text-white/30 mb-1">Formato</p>
            <p className="text-sm font-mono text-white/70 uppercase">{exp.formato ?? '—'}</p>
          </div>
          <div>
            <p className="text-[11px] text-white/30 mb-1">Criado em</p>
            <p className="text-sm text-white/60 tabular-nums">
              {exp.criado_em ? new Date(exp.criado_em).toLocaleDateString('pt-BR') : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Obras incluídas */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Music className="w-4 h-4 text-white/40" /> Obras Incluídas
          </h3>
          <span className="text-xs text-white/30">{exp.obras?.length ?? 0} obra{(exp.obras?.length ?? 0) !== 1 ? 's' : ''}</span>
        </div>

        {!exp.obras || exp.obras.length === 0 ? (
          <div className="py-8 text-center text-xs text-white/30">Nenhuma obra vinculada a este lote.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="text-left px-5 py-2.5 text-white/30 font-semibold">Obra</th>
                  <th className="text-left px-4 py-2.5 text-white/30 font-semibold">Código</th>
                  <th className="text-center px-4 py-2.5 text-white/30 font-semibold">Status</th>
                  <th className="text-left px-4 py-2.5 text-white/30 font-semibold">Cód. Externo</th>
                  <th className="text-left px-4 py-2.5 text-white/30 font-semibold">Observação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {exp.obras.map((o: any) => (
                  <tr key={o.id} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-3">
                      <Link href={`/master/obras/${o.obra_id}`} className="text-violet-400 hover:text-violet-300 transition-colors font-medium">
                        {o.titulo ?? o.obra_id?.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-white/40">{o.codigo_obra ?? '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                        o.status_obra === 'aceita'     ? 'bg-emerald-500/10 text-emerald-400' :
                        o.status_obra === 'rejeitada'  ? 'bg-rose-500/10 text-rose-400' :
                        o.status_obra === 'divergente' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-white/5 text-white/40'
                      }`}>
                        {o.status_obra ?? 'incluída'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-white/40">{o.codigo_externo ?? '—'}</td>
                    <td className="px-4 py-3 text-white/40 max-w-[200px] truncate">{o.observacao ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Logs */}
      {exp.logs && exp.logs.length > 0 && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.06]">
            <Clock className="w-4 h-4 text-white/30" />
            <h3 className="text-sm font-semibold text-white">Log de Eventos</h3>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {exp.logs.map((log: any, i: number) => (
              <div key={i} className="flex items-start gap-3 px-5 py-3">
                {log.nivel === 'erro'
                  ? <XCircle className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />
                  : log.nivel === 'aviso'
                    ? <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                    : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/60 mt-0.5 shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/70">{log.mensagem}</p>
                  {log.detalhes && (
                    <p className="text-[11px] text-white/30 mt-0.5 font-mono truncate">{JSON.stringify(log.detalhes)}</p>
                  )}
                </div>
                <span className="text-[11px] text-white/20 tabular-nums whitespace-nowrap shrink-0">
                  {log.timestamp ? new Date(log.timestamp).toLocaleTimeString('pt-BR') : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Retornos */}
      {exp.retornos && exp.retornos.length > 0 && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.06]">
            <FileText className="w-4 h-4 text-white/30" />
            <h3 className="text-sm font-semibold text-white">Retornos Recebidos</h3>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {exp.retornos.map((r: any) => (
              <div key={r.id} className="px-5 py-3 flex items-start gap-4">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold mt-0.5 shrink-0 ${
                  r.status_retorno === 'aceito'    ? 'bg-emerald-500/15 text-emerald-400' :
                  r.status_retorno === 'rejeitado' ? 'bg-rose-500/15 text-rose-400' :
                  'bg-white/5 text-white/40'
                }`}>
                  {r.status_retorno ?? 'recebido'}
                </span>
                <div className="flex-1">
                  <p className="text-xs text-white/70">{r.mensagem ?? JSON.stringify(r.payload_retorno ?? {})}</p>
                </div>
                <span className="text-[11px] text-white/20 tabular-nums whitespace-nowrap">
                  {r.recebido_em ? new Date(r.recebido_em).toLocaleDateString('pt-BR') : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

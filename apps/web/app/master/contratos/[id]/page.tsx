'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FileText, ChevronLeft, Users, ShieldCheck, Music, Pen,
  TrendingDown, GitBranch, Clock, Info, Building2, User,
  CheckCircle2, AlertCircle, Download, Plus, RefreshCw,
  ThumbsUp, ThumbsDown, ArrowUpCircle, BadgeCheck,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import {
  TIPO_CONTRATO_V2_LABELS, TIPO_CONTRATO_V2_COLORS,
  STATUS_CONTRATO_V2_LABELS, STATUS_CONTRATO_V2_COLORS,
  CODIGO_DIREITO_LABELS, PAPEL_PARTE_LABELS, PROVEDOR_ASSINATURA_LABELS,
  type ContratoV2, type AssinanteD4Sign, type ObraJson,
} from '@/lib/types-contratos-v2'
import { authFetch } from '@/lib/supabase/client'
import { MODELOS_JURIDICOS_V2, renderTemplate } from '@/lib/modelos-juridicos-v2'

const TABS = [
  { id: 'resumo',     label: 'Resumo',    icon: Info },
  { id: 'partes',     label: 'Partes',    icon: Users },
  { id: 'direitos',   label: 'Direitos',  icon: ShieldCheck },
  { id: 'obras',      label: 'Obras & Links', icon: Music },
  { id: 'assinaturas',label: 'Assinaturas', icon: Pen },
  { id: 'recoupment', label: 'Recoupment', icon: TrendingDown },
  { id: 'aditivos',   label: 'Aditivos',  icon: GitBranch },
  { id: 'historico',  label: 'Historico', icon: Clock },
  { id: 'pdf',        label: 'PDF',       icon: FileText },
]

function formatDate(d?: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function ContratoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [tab, setTab] = useState('resumo')
  const [contrato, setContrato] = useState<ContratoV2 | null>(null)
  const [loading, setLoading] = useState(true)
  const [sendLoading, setSendLoading] = useState(false)
  const [sendResult, setSendResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [wfLoading, setWfLoading] = useState(false)
  const [wfResult, setWfResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncResult, setSyncResult] = useState<{ ok: boolean; message: string } | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    authFetch(`/api/contratos/${id}`)
      .then(r => r.json())
      .then(json => setContrato((json.contrato ?? null) as ContratoV2 | null))
      .catch(() => setContrato(null))
      .finally(() => setLoading(false))
  }, [id])

  // ── Enviar para assinatura D4Sign ────────────────────────────────────────
  async function handleEnviarAssinatura() {
    if (!id || sendLoading) return
    setSendLoading(true)
    setSendResult(null)
    try {
      const res = await authFetch(`/api/contratos/${id}/enviar-assinatura`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        setSendResult({ ok: false, message: json.error ?? 'Erro ao enviar para assinatura.' })
      } else {
        setSendResult({ ok: true, message: json.message ?? 'Enviado para assinatura com sucesso.' })
        // Recarregar contrato para mostrar novo status
        const updated = await authFetch(`/api/contratos/${id}`).then(r => r.json())
        setContrato((updated.contrato ?? null) as ContratoV2 | null)
      }
    } catch {
      setSendResult({ ok: false, message: 'Erro de conexão ao enviar para assinatura.' })
    } finally {
      setSendLoading(false)
    }
  }

  // ── Workflow aprovação administrada/admin ────────────────────────────────
  async function handleWorkflow(action: string, motivo?: string) {
    if (!id || wfLoading) return
    setWfLoading(true)
    setWfResult(null)
    try {
      const body: Record<string, string> = { action }
      if (motivo) body.motivo_rejeicao = motivo
      const res = await authFetch(`/api/contratos/${id}/aprovar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) {
        setWfResult({ ok: false, message: json.error ?? 'Erro na ação de aprovação.' })
      } else {
        setWfResult({ ok: true, message: json.message ?? 'Ação executada com sucesso.' })
        const updated = await authFetch(`/api/contratos/${id}`).then(r => r.json())
        setContrato((updated.contrato ?? null) as ContratoV2 | null)
      }
    } catch {
      setWfResult({ ok: false, message: 'Erro de conexão.' })
    } finally {
      setWfLoading(false)
    }
  }

  // ── Sincronizar status com D4Sign (fallback quando webhook não chegou) ──────
  async function handleSincronizar() {
    if (!id || syncLoading) return
    setSyncLoading(true)
    setSyncResult(null)
    try {
      const res = await authFetch(`/api/contratos/${id}/sincronizar`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        setSyncResult({ ok: false, message: json.error ?? 'Erro ao sincronizar.' })
      } else {
        setSyncResult({ ok: true, message: json.message ?? 'Sincronizado.' })
        if (json.sincronizado) {
          const updated = await authFetch(`/api/contratos/${id}`).then(r => r.json())
          setContrato((updated.contrato ?? null) as ContratoV2 | null)
        }
      }
    } catch {
      setSyncResult({ ok: false, message: 'Erro de conexão.' })
    } finally {
      setSyncLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-6 h-6 text-white/20 animate-spin" />
      </div>
    )
  }

  if (!contrato) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <FileText className="w-12 h-12 text-white/20" />
        <p className="text-white/40">Contrato nao encontrado</p>
        <Link href="/master/contratos" className="text-violet-400 hover:text-violet-300 text-sm">
          Voltar para Contratos
        </Link>
      </div>
    )
  }

  const modelo = MODELOS_JURIDICOS_V2.find(m => m.id === contrato.modelo_juridico_id)

  // ── Tab: Resumo ──────────────────────────────────────────────────────────
  const tabResumo = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-white/40 mb-1">Numero</p>
          <p className="text-base font-bold text-white/90">{contrato.numero}</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-white/40 mb-1">Tipo</p>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TIPO_CONTRATO_V2_COLORS[contrato.tipo as keyof typeof TIPO_CONTRATO_V2_COLORS] ?? 'bg-white/10 text-white/60'}`}>
            {TIPO_CONTRATO_V2_LABELS[contrato.tipo as keyof typeof TIPO_CONTRATO_V2_LABELS] ?? contrato.tipo}
          </span>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-white/40 mb-1">Status</p>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_CONTRATO_V2_COLORS[contrato.status]}`}>
            {STATUS_CONTRATO_V2_LABELS[contrato.status]}
          </span>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-white/40 mb-1">Editora</p>
          <p className="text-sm text-white/80">{contrato.editora_nome}</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-white/40 mb-1">Titular Principal</p>
          <p className="text-sm text-white/80 flex items-center gap-1.5">
            {contrato.titular_tipo_pessoa === 'PJ' ? <Building2 className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
            {contrato.titular_principal ?? '—'}
          </p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-white/40 mb-1">Territorio</p>
          <p className="text-sm text-white/80">{contrato.territorio_principal}</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-white/40 mb-1">Vigencia Inicio</p>
          <p className="text-sm text-white/80">{formatDate(contrato.vigencia_inicio)}</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-white/40 mb-1">Vigencia Fim</p>
          <p className="text-sm text-white/80">
            {contrato.prazo_indeterminado ? 'Indeterminado' : formatDate(contrato.vigencia_fim)}
          </p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-white/40 mb-1">Modelo Juridico</p>
          <p className="text-sm text-white/80">{modelo?.nome ?? '—'}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`bg-white/[0.03] border rounded-xl p-3 ${contrato.exclusividade ? 'border-rose-500/20' : 'border-white/[0.06]'}`}>
          <p className="text-xs text-white/40 mb-1">Exclusividade</p>
          <p className={`text-sm font-semibold ${contrato.exclusividade ? 'text-rose-400' : 'text-white/50'}`}>
            {contrato.exclusividade ? 'Sim' : 'Nao'}
          </p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
          <p className="text-xs text-white/40 mb-1">Clausula Reversao</p>
          <p className="text-sm font-semibold text-white/70">
            {contrato.clausula_reversao ? `Sim (${contrato.prazo_reversao_anos}a)` : 'Nao'}
          </p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
          <p className="text-xs text-white/40 mb-1">Obras Vinculadas</p>
          <p className="text-sm font-bold text-violet-400">{contrato._obras_count ?? 0}</p>
        </div>
        {(contrato._recoupment_aberto ?? 0) > 0 && (
          <div className="bg-rose-500/[0.05] border border-rose-500/15 rounded-xl p-3">
            <p className="text-xs text-rose-400/70 mb-1">Recoupment Aberto</p>
            <p className="text-sm font-bold text-rose-400">{formatCurrency(contrato._recoupment_aberto!)}</p>
          </div>
        )}
      </div>
      {contrato.observacoes && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-white/40 mb-2">Observacoes</p>
          <p className="text-sm text-white/70 leading-relaxed">{contrato.observacoes}</p>
        </div>
      )}
    </div>
  )

  // ── Tab: Partes ──────────────────────────────────────────────────────────
  const tabPartes = () => {
    const partes = contrato._partes ?? []
    const d4sign: AssinanteD4Sign[] = contrato.assinantes_d4sign ?? []

    if (partes.length === 0 && d4sign.length > 0) {
      // Rascunho: mostrar assinantes do JSONB
      const papelLabel: Record<string, string> = {
        cedente:            'Cedente (Autor)',
        responsavel_editora:'Responsável Editora',
        testemunha_1:       'Testemunha 1',
        testemunha_2:       'Testemunha 2',
      }
      return (
        <div className="space-y-3">
          <p className="text-xs text-amber-400/70 mb-1">Partes conforme rascunho — vínculos formais gerados após assinatura.</p>
          {d4sign.map((a, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-violet-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white/90">{a.nome || '—'}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs bg-white/[0.06] text-white/50 px-1.5 py-0.5 rounded">
                    {papelLabel[a.papel] ?? a.papel}
                  </span>
                  {a.cpf && <span className="text-xs text-white/40">CPF {a.cpf}</span>}
                  {a.email && <span className="text-xs text-white/30">{a.email}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {partes.map(p => (
          <div key={p.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 flex items-center gap-4">
            <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
              {p.tipo_pessoa === 'PJ' ? <Building2 className="w-4 h-4 text-violet-400" /> : <User className="w-4 h-4 text-violet-400" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white/90">{p.nome_titular}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs bg-white/[0.06] text-white/50 px-1.5 py-0.5 rounded">
                  {PAPEL_PARTE_LABELS[p.papel]}
                </span>
                <span className="text-xs text-white/40">{p.tipo_pessoa}</span>
                {p.irpf_incide && (
                  <span className="text-xs bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded">IRPF</span>
                )}
              </div>
            </div>
            {p.percentual != null && (
              <div className="text-right">
                <p className="text-lg font-bold text-violet-400">{p.percentual}%</p>
              </div>
            )}
          </div>
        ))}
        {partes.length > 0 && (
          <div className="text-xs text-white/40 px-1">
            Soma: {partes.reduce((s, p) => s + (p.percentual ?? 0), 0)}%
            {partes.reduce((s, p) => s + (p.percentual ?? 0), 0) !== 100 && (
              <span className="text-amber-400 ml-1">(deve somar 100%)</span>
            )}
          </div>
        )}
      </div>
    )
  }

  // ── Tab: Direitos ────────────────────────────────────────────────────────
  const tabDireitos = () => {
    const dirs = contrato._direitos ?? []
    const br = dirs.filter(d => d.codigo.startsWith('BR_'))
    const ext = dirs.filter(d => d.codigo.startsWith('EXT_'))
    return (
      <div className="space-y-5">
        {br.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-violet-400 mb-3">Brasil (BR) — {br.filter(d => d.ativo).length} ativos</p>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
              {br.map((d, i) => (
                <div key={d.id} className={`flex items-center gap-4 px-4 py-3 ${i < br.length - 1 ? 'border-b border-white/[0.04]' : ''} ${!d.ativo ? 'opacity-40' : ''}`}>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${d.ativo ? 'bg-violet-400' : 'bg-white/20'}`} />
                  <span className="text-xs text-white/70 flex-1">{CODIGO_DIREITO_LABELS[d.codigo as keyof typeof CODIGO_DIREITO_LABELS]}</span>
                  <div className="flex flex-col items-end">
                    <span className="text-[11px] font-semibold text-violet-300">{d.pct_titular != null ? `${d.pct_titular}%` : '—'} autor</span>
                    <span className="text-[11px] text-violet-400/70">{d.pct_editora != null ? `${d.pct_editora}%` : '—'} editora</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {ext.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-sky-400 mb-3">Exterior (EXT) — {ext.filter(d => d.ativo).length} ativos</p>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
              {ext.map((d, i) => (
                <div key={d.id} className={`flex items-center gap-4 px-4 py-3 ${i < ext.length - 1 ? 'border-b border-white/[0.04]' : ''} ${!d.ativo ? 'opacity-40' : ''}`}>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${d.ativo ? 'bg-sky-400' : 'bg-white/20'}`} />
                  <span className="text-xs text-white/70 flex-1">{CODIGO_DIREITO_LABELS[d.codigo as keyof typeof CODIGO_DIREITO_LABELS]}</span>
                  <div className="flex flex-col items-end">
                    <span className="text-[11px] font-semibold text-sky-300">{d.pct_titular != null ? `${d.pct_titular}%` : '—'} autor</span>
                    <span className="text-[11px] text-sky-400/70">{d.pct_editora != null ? `${d.pct_editora}%` : '—'} editora</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <p className="text-xs text-white/30">Formato: % Titular / % Editora por direito</p>
      </div>
    )
  }

  // ── Tab: Obras & Links ───────────────────────────────────────────────────
  const tabObras = () => {
    const obras = contrato._obras ?? []
    const obrasJson: ObraJson[] = contrato.obras_json ?? []

    // Mapeia papel do autor → código de função (CWR / cadastro)
    function papelToTipo(papel: string): string {
      const map: Record<string, string> = {
        compositor:           'CA',
        letrista:             'CA',
        compositor_letrista:  'CA',
        arranjador:           'AR',
        adaptador:            'AD',
        autor:                'CA',
      }
      return map[(papel ?? '').toLowerCase()] ?? 'CA'
    }

    // Primeiro nome como pseudônimo de fallback
    function primNome(nome: string): string {
      return (nome?.split(' ')[0] ?? nome).toLowerCase()
    }

    // Linhas de participantes para uma obra no formato de cadastro
    function buildLinks(o: ObraJson, linkNum: number, c: NonNullable<typeof contrato>) {
      const editoraNome   = c.editora_nome ?? '—'
      const editoraRazao  = c.editora_razao_social ?? editoraNome
      const editoraPct    = typeof (c as { percentual_editora?: number }).percentual_editora === 'number'
        ? (c as { percentual_editora?: number }).percentual_editora!
        : 100 - (o.pct_autor ?? 0)

      const rows = [
        // ── Cedente (autor)
        {
          link: linkNum,
          nomeCompleto: (c.titular_principal ?? 'Cedente'),
          pseudo:       c.titular_pseudonimo ?? primNome(c.titular_principal ?? 'Cedente'),
          tipo:         papelToTipo(o.papel_autor),
          doc:          c.titular_tipo_pessoa === 'PJ' ? 'CNPJ' : 'CPF',
          pct:          o.pct_autor ?? 0,
          cor:          'violet' as const,
          controlado:   true,
        },
        // ── Editora
        {
          link: linkNum,
          nomeCompleto: editoraRazao,
          pseudo:       editoraNome,
          tipo:         'E',
          doc:          'CNPJ',
          pct:          editoraPct,
          cor:          'emerald' as const,
          controlado:   true,
        },
        // ── Co-autores
        ...(o.co_autores ?? []).map(co => ({
          link:         linkNum,
          nomeCompleto: co.nome,
          pseudo:       primNome(co.nome),
          tipo:         papelToTipo(co.papel),
          doc:          'CPF',
          pct:          co.pct ?? 0,
          cor:          'sky' as const,
          controlado:   false,
        })),
      ]
      return rows
    }

    if (obras.length === 0 && obrasJson.length > 0) {
      if (!contrato) return null
      const c = contrato
      return (
        <div className="space-y-4">
          <p className="text-xs text-amber-400/70">Obras conforme rascunho — links formais gerados após assinatura.</p>

          {obrasJson.map((o, obraIdx) => {
            const rows = buildLinks(o, obraIdx + 1, c)
            return (
              <div key={obraIdx} className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
                {/* Cabeçalho da obra */}
                <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                  <p className="text-sm font-semibold text-white/90">{o.titulo}</p>
                  <div className="flex items-center gap-2">
                    {o.titulo_alternativo && (
                      <span className="text-xs text-white/30">Alt: {o.titulo_alternativo}</span>
                    )}
                  </div>
                </div>

                {/* Cabeçalho da tabela */}
                <div className="grid grid-cols-[56px_1fr_140px_52px_52px_52px] gap-x-3 px-4 py-1.5 border-b border-white/[0.04] bg-white/[0.02]">
                  {['Link', 'Nome Completo', 'Pseudônimo / Nome Fantasia', 'Tipo', 'Doc', '%'].map((h, i) => (
                    <span key={i} className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">{h}</span>
                  ))}
                </div>

                {/* Linhas de participantes */}
                <div className="divide-y divide-white/[0.03]">
                  {rows.map((row, ri) => {
                    const tipoColor = row.tipo === 'E'
                      ? 'text-emerald-400'
                      : row.cor === 'sky' ? 'text-sky-400' : 'text-violet-400'
                    return (
                      <div
                        key={ri}
                        className="grid grid-cols-[56px_1fr_140px_52px_52px_52px] gap-x-3 items-center px-4 py-2.5 text-xs hover:bg-white/[0.02] transition-colors"
                      >
                        {/* Link N */}
                        <span className="text-white/30 font-mono text-[11px]">Link {row.link}</span>

                        {/* Nome completo */}
                        <span className="text-white/80 truncate">
                          {row.nomeCompleto.toLowerCase()}
                        </span>

                        {/* Pseudônimo */}
                        <span className="text-white/50 truncate text-[11px]">
                          {row.pseudo.toLowerCase()}
                        </span>

                        {/* Tipo (CA / E / AR) */}
                        <span className={`font-mono font-bold text-[11px] ${tipoColor}`}>
                          {row.tipo}
                        </span>

                        {/* Doc (CPF / CNPJ) */}
                        <span className="text-white/35 text-[10px] font-mono uppercase">
                          {row.doc}
                        </span>

                        {/* Percentual */}
                        <div className="flex items-center gap-1">
                          <span className={`font-semibold tabular-nums ${tipoColor}`}>
                            {row.pct}%
                          </span>
                          {!row.controlado && (
                            <span className="text-[9px] text-white/25 font-medium">(nc)</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )
    }

    // ── Links formais (após assinatura / obras reais vinculadas)
    return (
      <div className="space-y-3">
        {obras.map(o => (
          <div key={o.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-white/90">{o.titulo_obra}</p>
                <p className="text-xs text-white/40 mt-0.5">{o.codigo_obra}</p>
              </div>
              <span className="text-xs text-violet-400 font-semibold">{o.percentual_autor}% autor</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-white/40">
              <span>Inicio: {formatDate(o.vigencia_inicio)}</span>
              <span>Fim: {formatDate(o.vigencia_fim)}</span>
              {o.iswc && <span>ISWC: {o.iswc}</span>}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ── Tab: Assinaturas ─────────────────────────────────────────────────────
  const tabAssinaturas = () => {
    const assinaturas = contrato._assinaturas ?? []
    const d4sign: AssinanteD4Sign[] = contrato.assinantes_d4sign ?? []
    const provedor     = contrato.provedor_assinatura ?? 'd4sign'
    const d4signStatus = contrato.d4sign_status
    const d4signUuid   = contrato.d4sign_uuid

    const papelLabel: Record<string, string> = {
      cedente:            'Cedente (Autor)',
      responsavel_editora:'Responsável Editora',
      testemunha_1:       'Testemunha 1',
      testemunha_2:       'Testemunha 2',
    }

    const statusD4SignLabel: Record<string, { label: string; color: string }> = {
      processando:            { label: 'Processando', color: 'text-blue-400' },
      aguardando_signatarios: { label: 'Aguardando Signatários', color: 'text-amber-400' },
      aguardando_assinaturas: { label: 'Aguardando Assinaturas', color: 'text-amber-400' },
      finalizado:             { label: 'Finalizado — Todos Assinaram', color: 'text-emerald-400' },
      arquivado:              { label: 'Arquivado', color: 'text-white/40' },
      cancelado:              { label: 'Cancelado', color: 'text-rose-400' },
    }

    const d4Info = d4signStatus ? statusD4SignLabel[d4signStatus] : null

    return (
      <div className="space-y-4">
        {/* Status D4Sign se já enviado */}
        {d4signUuid && (
          <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-white/40 mb-1">Documento D4Sign</p>
                <p className={`text-sm font-semibold ${d4Info?.color ?? 'text-white/60'}`}>
                  {d4Info?.label ?? d4signStatus}
                </p>
                <p className="text-[10px] font-mono text-white/25 mt-1 break-all">{d4signUuid}</p>
              </div>
              <span className="text-xs bg-slate-500/15 text-slate-400 px-2 py-0.5 rounded-full shrink-0">
                {provedor.toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {/* Feedback do envio */}
        {sendResult && (
          <div className={`rounded-xl p-3 text-sm ${sendResult.ok ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>
            {sendResult.message}
          </div>
        )}

        {/* Lista de assinantes */}
        {d4sign.length > 0 && (
          <div className="space-y-2">
            {!d4signUuid && (
              <p className="text-xs text-amber-400/70 mb-2">
                Assinantes definidos — contrato aguarda envio para assinatura.
              </p>
            )}
            {d4sign.map((a, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white/90">{a.nome || '—'}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-white/40">
                    <span>{papelLabel[a.papel] ?? a.papel}</span>
                    {a.cpf   && <><span>·</span><span>CPF {a.cpf}</span></>}
                    {a.email && <><span>·</span><span>{a.email}</span></>}
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-semibold ${d4signStatus === 'finalizado' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {d4signStatus === 'finalizado'
                    ? <><CheckCircle2 className="w-4 h-4" /> Assinado</>
                    : <><AlertCircle className="w-4 h-4" /> {d4signUuid ? 'Aguardando' : 'Pendente'}</>
                  }
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Assinaturas formais do banco (_assinaturas) */}
        {assinaturas.length > 0 && d4sign.length === 0 && (
          <div className="space-y-2">
            {assinaturas.map(a => {
              const statusColor = a.status === 'assinado' ? 'text-emerald-400' :
                a.status === 'pendente' ? 'text-amber-400' :
                a.status === 'recusado' ? 'text-rose-400' : 'text-white/40'
              return (
                <div key={a.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white/90">{a.nome_parte}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-white/40">
                      <span>{PAPEL_PARTE_LABELS[a.tipo_parte]}</span>
                      <span>·</span>
                      <span>{PROVEDOR_ASSINATURA_LABELS[a.provedor]}</span>
                      {a.data_assinatura && <span>· Ass: {formatDate(a.data_assinatura)}</span>}
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs font-semibold ${statusColor}`}>
                    {a.status === 'assinado' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {d4sign.length === 0 && assinaturas.length === 0 && (
          <div className="text-center py-12 text-white/30 text-sm">
            Nenhum assinante definido para este contrato.
          </div>
        )}
      </div>
    )
  }

  // ── Tab: Recoupment ──────────────────────────────────────────────────────
  const tabRecoupment = () => (
    <div className="space-y-3">
      {(contrato._recoupment ?? []).length === 0 ? (
        <div className="text-center py-12 text-white/30 text-sm">Nenhum recoupment registrado.</div>
      ) : (
        (contrato._recoupment ?? []).map(r => (
          <div key={r.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-white/90">{r.descricao}</p>
                <p className="text-xs text-white/40 mt-0.5">{r.nome_titular} · {formatDate(r.data_adiantamento)}</p>
              </div>
              {r.quitado ? (
                <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">Quitado</span>
              ) : (
                <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full">Aberto</span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-white/40 mb-1">Adiantado</p>
                <p className="text-sm font-bold text-white/80">{formatCurrency(r.valor_adiantamento)}</p>
              </div>
              <div>
                <p className="text-xs text-white/40 mb-1">Abatido</p>
                <p className="text-sm font-bold text-emerald-400">{formatCurrency(r.valor_abatido)}</p>
              </div>
              <div>
                <p className="text-xs text-white/40 mb-1">Saldo</p>
                <p className={`text-sm font-bold ${r.saldo_aberto > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {formatCurrency(r.saldo_aberto)}
                </p>
              </div>
            </div>
            {r.valor_adiantamento > 0 && (
              <div className="mt-3">
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (r.valor_abatido / r.valor_adiantamento) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-white/30 mt-1">
                  {((r.valor_abatido / r.valor_adiantamento) * 100).toFixed(1)}% abatido
                </p>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )

  // ── Tab: Aditivos ────────────────────────────────────────────────────────
  const tabAditivos = () => (
    <div className="space-y-3">
      {(contrato._aditivos ?? []).length === 0 ? (
        <div className="text-center py-12 text-white/30 text-sm">Nenhum aditivo registrado.</div>
      ) : (
        (contrato._aditivos ?? []).map(a => (
          <div key={a.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-white/90">{a.numero_aditivo}</p>
                <p className="text-xs text-white/60 mt-0.5">{a.descricao}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_CONTRATO_V2_COLORS[a.status]}`}>
                {STATUS_CONTRATO_V2_LABELS[a.status]}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-white/40">
              <span>Criado: {formatDate(a.data_criacao)}</span>
              {a.assinado_em && <span>Assinado: {formatDate(a.assinado_em)}</span>}
            </div>
          </div>
        ))
      )}
    </div>
  )

  // ── Tab: Historico ───────────────────────────────────────────────────────
  const tabHistorico = () => {
    const historico = contrato._historico ?? []
    if (historico.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-white/30 gap-2">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m4-2a8 8 0 11-16 0 8 8 0 0116 0z" /></svg>
          <p className="text-sm">Nenhuma alteração registrada ainda.</p>
          <p className="text-xs text-white/20 text-center max-w-sm mt-1">
            O histórico mostrará criações, edições, envios para assinatura, adições de aditivos e outras alterações no contrato.
          </p>
          <div className="mt-4 space-y-1 text-xs text-white/25 text-center">
            <p>Criado em: {formatDate(contrato.created_at)}</p>
            {contrato.vigencia_inicio && <p>Vigência: {formatDate(contrato.vigencia_inicio)}{contrato.vigencia_fim ? ` → ${formatDate(contrato.vigencia_fim)}` : ' (indeterminado)'}</p>}
            <p>Status atual: {STATUS_CONTRATO_V2_LABELS[contrato.status as keyof typeof STATUS_CONTRATO_V2_LABELS] ?? contrato.status}</p>
          </div>
        </div>
      )
    }
    return (
      <div className="space-y-2">
        {historico.map(h => (
          <div key={h.id} className="flex items-start gap-3 py-3 border-b border-white/[0.04] last:border-0">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-white/80">{h.descricao}</p>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-white/30">
                {h.usuario_nome && <span>{h.usuario_nome}</span>}
                <span>·</span>
                <span>{formatDate(h.created_at)}</span>
              </div>
            </div>
            <span className="text-xs bg-white/[0.06] text-white/40 px-1.5 py-0.5 rounded">{h.tipo_evento}</span>
          </div>
        ))}
      </div>
    )
  }

  // ── Tab: PDF ─────────────────────────────────────────────────────────────
  const tabPDF = () => {
    const templateText = modelo?.template_texto ?? ''
    const rendered = renderTemplate(templateText, {
      titular_nome: contrato.titular_principal ?? 'TITULAR',
      cpf: '000.000.000-00',
      cnpj: '00.000.000/0001-00',
      rg: '00.000.000-0',
      endereco_completo: 'Rua Exemplo, 123, Cidade, Estado',
      editora_nome: contrato.editora_nome,
      editora_cnpj: '00.000.000/0001-00',
      obra_titulo: contrato._obras?.[0]?.titulo_obra ?? 'OBRAS VINCULADAS',
      obra_codigo: contrato._obras?.[0]?.codigo_obra ?? '—',
      vigencia_inicio: contrato.vigencia_inicio,
      vigencia_fim: contrato.vigencia_fim ?? 'indeterminado',
      percentual_titular: String(contrato._direitos?.[0]?.pct_titular ?? 75),
      percentual_editora: String(contrato._direitos?.[0]?.pct_editora ?? 25),
      territorio: contrato.territorio_principal,
      moeda: 'BRL',
      comissao: '20',
      administradora_nome: '—',
      cessionario_nome: contrato._partes?.find(p => p.papel === 'cessionario')?.nome_titular ?? '—',
      obras_lista: (contrato._obras ?? []).map(o => o.titulo_obra).join(', '),
      data_assinatura: new Date().toLocaleDateString('pt-BR'),
    })
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/60">Pre-visualizacao do contrato baseado no modelo: <strong className="text-white/80">{modelo?.nome ?? '—'}</strong></p>
          <button className="flex items-center gap-1.5 h-8 px-3 text-xs bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/20 text-violet-300 rounded-lg transition-colors">
            <Download className="w-3.5 h-3.5" /> Exportar PDF
          </button>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
          <pre className="text-xs text-white/60 whitespace-pre-wrap leading-relaxed font-mono">
            {rendered || 'Modelo nao disponivel para este tipo de contrato.'}
          </pre>
        </div>
      </div>
    )
  }

  const tabContent: Record<string, () => React.ReactElement | null> = {
    resumo: tabResumo,
    partes: tabPartes,
    direitos: tabDireitos,
    obras: tabObras,
    assinaturas: tabAssinaturas,
    recoupment: tabRecoupment,
    aditivos: tabAditivos,
    historico: tabHistorico,
    pdf: tabPDF,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/master/contratos')}
          className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Contratos
        </button>
      </div>

      <PageHeader
        title={contrato.numero}
        description={`${TIPO_CONTRATO_V2_LABELS[contrato.tipo as keyof typeof TIPO_CONTRATO_V2_LABELS] ?? contrato.tipo} · ${((contrato as unknown) as Record<string, unknown>).editora_nome as string ?? '—'}`}
        actions={
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_CONTRATO_V2_COLORS[contrato.status] ?? 'bg-slate-500/15 text-slate-400'}`}>
              {STATUS_CONTRATO_V2_LABELS[contrato.status] ?? contrato.status}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TIPO_CONTRATO_V2_COLORS[contrato.tipo as keyof typeof TIPO_CONTRATO_V2_COLORS] ?? 'bg-white/10 text-white/60'}`}>
              {TIPO_CONTRATO_V2_LABELS[contrato.tipo as keyof typeof TIPO_CONTRATO_V2_LABELS] ?? contrato.tipo}
            </span>
          </div>
        }
      />

      {/* Barra de ações para rascunho */}
      {/* Banner: Aguardando Assinatura — botão de sincronização manual com D4Sign */}
      {contrato.status === 'aguardando_assinatura' && (
        <div className="bg-amber-500/[0.07] border border-amber-500/20 rounded-xl px-5 py-4 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-300">Aguardando Assinatura Digital</p>
              <p className="text-xs text-amber-400/60 mt-0.5">
                O contrato foi enviado para o D4Sign. Após todos assinarem, clique em
                &quot;Verificar Assinatura&quot; para sincronizar o status.
              </p>
            </div>
            <button
              onClick={handleSincronizar}
              disabled={syncLoading}
              className="flex items-center gap-1.5 h-8 px-3 text-xs bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {syncLoading
                ? <><span className="w-3.5 h-3.5 border-2 border-amber-300/40 border-t-amber-300 rounded-full animate-spin" /> Verificando...</>
                : <><RefreshCw className="w-3.5 h-3.5" /> Verificar Assinatura</>
              }
            </button>
          </div>
          {syncResult && (
            <p className={`text-xs px-3 py-2 rounded-lg ${syncResult.ok ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-400'}`}>
              {syncResult.message}
            </p>
          )}
        </div>
      )}

      {contrato.status === 'rascunho' && (
        <div className="bg-amber-500/[0.07] border border-amber-500/20 rounded-xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-300">Contrato em Rascunho</p>
            <p className="text-xs text-amber-400/60 mt-0.5">
              O contrato foi criado mas ainda não foi enviado para assinatura.
              {(contrato.assinantes_d4sign?.length ?? 0) > 0
                ? ` ${contrato.assinantes_d4sign!.length} assinantes definidos.`
                : ' Defina os assinantes antes de enviar.'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => router.push(`/master/contratos/novo/obras?edit=${contrato.id}`)}
              className="flex items-center gap-1.5 h-8 px-3 text-xs bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/20 text-violet-300 rounded-lg transition-colors"
            >
              <Pen className="w-3.5 h-3.5" /> Editar Rascunho
            </button>
            <button
              onClick={handleEnviarAssinatura}
              disabled={sendLoading || contrato.status !== 'rascunho'}
              title={
                contrato.status !== 'rascunho'
                  ? `Contrato já está em status: ${contrato.status}`
                  : 'Enviar contrato para assinatura digital via D4Sign'
              }
              className="flex items-center gap-1.5 h-8 px-3 text-xs bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendLoading
                ? <><span className="w-3.5 h-3.5 border-2 border-amber-300/40 border-t-amber-300 rounded-full animate-spin" /> Enviando...</>
                : <><CheckCircle2 className="w-3.5 h-3.5" /> Enviar para Assinatura</>
              }
            </button>
          </div>
        </div>
      )}

      {/* Workflow: Contrato Assinado — fluxo direto (Admin) ou fluxo administrada */}
      {contrato.status === 'assinado' && (
        <div className="bg-sky-500/[0.07] border border-sky-500/20 rounded-xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-sky-300">Contrato Assinado</p>
            <p className="text-xs text-sky-400/60 mt-0.5">
              O contrato foi assinado. Admin pode validar diretamente (fluxo Top Show Music) ou a editora administrada pode validar internamente antes de solicitar aprovação.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleWorkflow('validar')}
              disabled={wfLoading}
              className="flex items-center gap-1.5 h-8 px-3 text-xs bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/30 text-teal-300 rounded-lg transition-colors disabled:opacity-50"
            >
              <BadgeCheck className="w-3.5 h-3.5" /> Validar Contrato
            </button>
            <button
              onClick={() => handleWorkflow('validar_administrada')}
              disabled={wfLoading}
              className="flex items-center gap-1.5 h-8 px-3 text-xs bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 text-sky-300 rounded-lg transition-colors disabled:opacity-50"
            >
              <BadgeCheck className="w-3.5 h-3.5" /> Validar (Administrada)
            </button>
          </div>
        </div>
      )}

      {/* Workflow: Validado (fluxo direto TSM) — libera Iniciar Cadastro */}
      {contrato.status === 'validado' && (
        <div className="bg-teal-500/[0.07] border border-teal-500/20 rounded-xl px-5 py-4">
          <p className="text-sm font-semibold text-teal-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Contrato Validado
          </p>
          <p className="text-xs text-teal-400/60 mt-0.5">
            Contrato validado. As obras mencionadas podem agora ser cadastradas no catálogo.
          </p>
          <Link
            href={`/master/obras/nova?contrato_id=${contrato.id}`}
            className="mt-3 inline-flex items-center gap-1.5 h-8 px-3 text-xs bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/20 text-teal-300 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Iniciar Cadastro da Obra
          </Link>
        </div>
      )}

      {/* Workflow: Validado pela administrada — pode solicitar aprovação admin */}
      {contrato.status === 'validado_administrada' && (
        <div className="bg-indigo-500/[0.07] border border-indigo-500/20 rounded-xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-indigo-300">Validado pela Administrada</p>
            <p className="text-xs text-indigo-400/60 mt-0.5">Contrato validado internamente. Solicite a aprovação do administrador (Top Show Music) para que a obra entre no catálogo oficial.</p>
          </div>
          <button
            onClick={() => handleWorkflow('solicitar_admin')}
            disabled={wfLoading}
            className="flex items-center gap-1.5 h-8 px-3 text-xs bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 rounded-lg transition-colors disabled:opacity-50"
          >
            <ArrowUpCircle className="w-3.5 h-3.5" /> Solicitar Aprovação Admin
          </button>
        </div>
      )}

      {/* Workflow: Aguardando validação do admin */}
      {contrato.status === 'aguardando_validacao_admin' && (
        <div className="bg-amber-500/[0.07] border border-amber-500/20 rounded-xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-300">Aguardando Aprovação do Administrador</p>
            <p className="text-xs text-amber-400/60 mt-0.5">O contrato aguarda revisão e aprovação do administrador (Top Show Music). Após aprovação, a obra entra no catálogo ativo.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleWorkflow('aprovar_admin')}
              disabled={wfLoading}
              className="flex items-center gap-1.5 h-8 px-3 text-xs bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 rounded-lg transition-colors disabled:opacity-50"
            >
              <ThumbsUp className="w-3.5 h-3.5" /> Aprovar
            </button>
            <button
              onClick={() => {
                const motivo = prompt('Motivo da rejeição (obrigatório):')
                if (motivo) handleWorkflow('rejeitar_admin', motivo)
              }}
              disabled={wfLoading}
              className="flex items-center gap-1.5 h-8 px-3 text-xs bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 rounded-lg transition-colors disabled:opacity-50"
            >
              <ThumbsDown className="w-3.5 h-3.5" /> Rejeitar
            </button>
          </div>
        </div>
      )}

      {/* Workflow: Aprovado pelo admin */}
      {contrato.status === 'aprovado_admin' && (
        <div className="bg-emerald-500/[0.07] border border-emerald-500/20 rounded-xl px-5 py-4">
          <p className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Aprovado pelo Administrador
          </p>
          <p className="text-xs text-emerald-400/60 mt-0.5">
            Contrato aprovado. As obras mencionadas podem agora ser cadastradas no catálogo oficial.
          </p>
          <Link
            href={`/master/obras/nova?contrato_id=${contrato.id}`}
            className="mt-3 inline-flex items-center gap-1.5 h-8 px-3 text-xs bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/20 text-emerald-300 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Iniciar Cadastro da Obra
          </Link>
        </div>
      )}

      {/* Workflow: Rejeitado pelo admin */}
      {contrato.status === 'rejeitado_admin' && (
        <div className="bg-rose-500/[0.07] border border-rose-500/20 rounded-xl px-5 py-4">
          <p className="text-sm font-semibold text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Rejeitado pelo Administrador
          </p>
          <p className="text-xs text-rose-400/60 mt-0.5">O contrato foi rejeitado. Revise os dados e edite o rascunho para reenviar.</p>
          <button
            onClick={() => router.push(`/master/contratos/novo/obras?edit=${contrato.id}`)}
            className="mt-3 flex items-center gap-1.5 h-8 px-3 text-xs bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/20 text-violet-300 rounded-lg transition-colors"
          >
            <Pen className="w-3.5 h-3.5" /> Editar e Reenviar
          </button>
        </div>
      )}

      {/* Feedback workflow */}
      {wfResult && (
        <div className={`px-4 py-3 rounded-xl border text-sm ${wfResult.ok ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-300'}`}>
          {wfResult.message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto bg-[#0d1526] border border-white/[0.06] rounded-xl p-1">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={[
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0',
                tab === t.id
                  ? 'bg-violet-600 text-white'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]',
              ].join(' ')}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5">
        {tabContent[tab]?.() ?? null}
      </div>
    </div>
  )
}

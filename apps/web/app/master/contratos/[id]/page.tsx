'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FileText, ChevronLeft, Users, ShieldCheck, Music, Pen,
  TrendingDown, GitBranch, Clock, Info, Building2, User,
  CheckCircle2, AlertCircle, Download, Plus, RefreshCw,
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

  useEffect(() => {
    if (!id) return
    setLoading(true)
    authFetch(`/api/contratos/${id}`)
      .then(r => r.json())
      .then(json => setContrato((json.contrato ?? null) as ContratoV2 | null))
      .catch(() => setContrato(null))
      .finally(() => setLoading(false))
  }, [id])

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

    if (obras.length === 0 && obrasJson.length > 0) {
      return (
        <div className="space-y-3">
          <p className="text-xs text-amber-400/70 mb-1">Obras conforme rascunho — links formais gerados após assinatura.</p>
          {obrasJson.map((o, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-white/90">{o.titulo}</p>
                  {o.titulo_alternativo && <p className="text-xs text-white/40 mt-0.5">Alt: {o.titulo_alternativo}</p>}
                  {o.subtitulo && <p className="text-xs text-white/30 mt-0.5">Sub: {o.subtitulo}</p>}
                </div>
                <span className="text-xs bg-violet-500/20 text-violet-300 font-semibold px-2 py-0.5 rounded-full">{o.pct_autor}% autor cedido</span>
              </div>

              {/* Editora */}
              {contrato.editora_nome && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Editora</span>
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">
                    {contrato.editora_nome} — Controladora
                  </span>
                </div>
              )}

              {/* Autores */}
              <div>
                <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1.5 block">Autores</span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-xs bg-violet-500/10 text-violet-400 border border-violet-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
                    {contrato.titular_principal ?? 'Cedente'}: {o.pct_autor}% ({o.papel_autor}) — Controlado
                  </span>
                  {(o.co_autores ?? []).map((c, ci) => (
                    <span key={ci} className="text-xs bg-sky-500/10 text-sky-400 border border-sky-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-sky-500/50 rounded-full" />
                      {c.nome}: {c.pct ?? 0}% — Sem controle
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    }

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
    const provedor = contrato.provedor_assinatura ?? 'd4sign'

    const papelLabel: Record<string, string> = {
      cedente:            'Cedente (Autor)',
      responsavel_editora:'Responsável Editora',
      testemunha_1:       'Testemunha 1',
      testemunha_2:       'Testemunha 2',
    }

    if (assinaturas.length === 0 && d4sign.length > 0) {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-amber-400/70">Assinantes definidos no rascunho — contrato aguarda envio para assinatura.</p>
            <span className="text-xs bg-slate-500/15 text-slate-400 px-2 py-0.5 rounded-full">
              {provedor.toUpperCase()}
            </span>
          </div>
          {d4sign.map((a, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-semibold text-white/90">{a.nome || '—'}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-white/40">
                  <span>{papelLabel[a.papel] ?? a.papel}</span>
                  {a.cpf && <><span>·</span><span>CPF {a.cpf}</span></>}
                  {a.email && <><span>·</span><span>{a.email}</span></>}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                <AlertCircle className="w-4 h-4" />
                Pendente
              </div>
            </div>
          ))}
        </div>
      )
    }

    return (
      <div className="space-y-3">
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

  const tabContent: Record<string, () => React.ReactElement> = {
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
              disabled
              title="Integração D4Sign em implantação"
              className="flex items-center gap-1.5 h-8 px-3 text-xs bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Enviar para Assinatura
            </button>
          </div>
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

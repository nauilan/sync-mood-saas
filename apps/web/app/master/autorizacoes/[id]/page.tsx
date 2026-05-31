'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import {
  Shield, Music, FileText, DollarSign, Clock, Edit,
  CheckCircle2, ExternalLink, Lock, AlertCircle,
  Download, Upload, PenLine, RefreshCw, Bell, X, Check
} from 'lucide-react'
import { getAutorizacaoById } from '@/lib/mock-autorizacoes'
import {
  TIPO_AUTORIZACAO_LABELS, TIPO_AUTORIZACAO_COLORS,
  STATUS_AUTORIZACAO_LABELS, STATUS_AUTORIZACAO_COLORS,
  MODELO_NEGOCIO_LABELS, MODELO_NEGOCIO_COLORS, MODELO_NEGOCIO_DOCUMENTO_NOME,
  TIPO_USO_LABELS,
  diasRestantesExclusividade, exclusividadeEmAlerta, exclusividadeVigente,
} from '@/lib/types-autorizacoes'
import type { ExclusividadeRenovacao } from '@/lib/types-autorizacoes'

const TABS = [
  { id: 'resumo', label: 'Resumo', icon: Shield },
  { id: 'obras', label: 'Obras e Links', icon: Music },
  { id: 'docs', label: 'Documentos', icon: FileText },
  { id: 'cobranca', label: 'Cobranca', icon: DollarSign },
  { id: 'historico', label: 'Historico', icon: Clock },
]

function formatBRL(value?: number | null) {
  if (!value && value !== 0) return 'sem valor'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(value)
}

function formatDate(d?: string | null) {
  if (!d) return 'sem data'
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
}

export default function AutorizacaoDetailPage({ params }: { params: { id: string } }) {
  const [autorizacao, setAutorizacao] = useState(getAutorizacaoById(params.id))
  const [activeTab, setActiveTab] = useState('resumo')
  const [showRenovacao, setShowRenovacao] = useState(false)
  const [renovMeses, setRenovMeses] = useState(12)
  const [renovObs, setRenovObs] = useState('')
  const [showUpload, setShowUpload] = useState(false)

  if (!autorizacao) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-white/40">
        <Shield className="w-10 h-10" />
        <p className="text-sm">Autorizacao nao encontrada</p>
        <Link href="/master/autorizacoes" className="text-xs text-violet-400 hover:text-violet-300">
          Voltar para Autorizacoes
        </Link>
      </div>
    )
  }

  const modeloNegocio = autorizacao.modelo_negocio
  const exclAtiva = autorizacao.exclusividade && !!autorizacao.exclusividade_data_fim
  const exclVigente2 = exclAtiva ? exclusividadeVigente(autorizacao.exclusividade_data_fim!) : false
  const exclAlerta2  = exclAtiva ? exclusividadeEmAlerta(autorizacao.exclusividade_data_fim!) : false
  const exclDias2    = exclAtiva ? diasRestantesExclusividade(autorizacao.exclusividade_data_fim!) : null
  const exclVencida  = exclAtiva && !exclVigente2
  const docEsperado  = modeloNegocio ? MODELO_NEGOCIO_DOCUMENTO_NOME[modeloNegocio] : null

  function handleRenovar() {
    if (!autorizacao?.exclusividade_data_fim) return
    const d = new Date(autorizacao.exclusividade_data_fim)
    d.setMonth(d.getMonth() + renovMeses)
    const novaDataFim = d.toISOString().slice(0, 10)
    const renov: ExclusividadeRenovacao = {
      id: 'renov-' + Date.now(),
      data_renovacao: new Date().toISOString().slice(0, 10),
      periodo_meses: renovMeses,
      data_fim_nova: novaDataFim,
      observacoes: renovObs || undefined,
    }
    setAutorizacao(prev => prev ? {
      ...prev,
      exclusividade_data_fim: novaDataFim,
      exclusividade_renovacoes: [...(prev.exclusividade_renovacoes ?? []), renov],
    } : prev)
    setShowRenovacao(false)
    setRenovObs('')
    setRenovMeses(12)
  }

  const inputCls = 'w-full h-9 bg-white/5 border border-white/[0.08] rounded-lg px-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/50'

  return (
    <div className="space-y-5">
      <PageHeader
        title={autorizacao.numero_autorizacao}
        description={TIPO_AUTORIZACAO_LABELS[autorizacao.tipo] + ' · ' + autorizacao.territorio + (modeloNegocio ? ' · ' + MODELO_NEGOCIO_LABELS[modeloNegocio] : '')}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/master/autorizacoes" className="h-8 px-3 rounded-lg bg-white/5 border border-white/[0.06] text-xs text-white/60 hover:text-white/80 transition-colors flex items-center">
              Voltar
            </Link>
            <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs text-white font-semibold transition-colors">
              <Edit className="w-3.5 h-3.5" /> Editar
            </button>
          </div>
        }
      />

      {exclAlerta2 && exclDias2 !== null && exclDias2 >= 0 && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <Bell className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-400">Exclusividade vence em {exclDias2} {exclDias2 !== 1 ? 'dias' : 'dia'}</p>
            <p className="text-xs text-amber-400/70 mt-0.5">Data de termino: {formatDate(autorizacao.exclusividade_data_fim)}. Considere renovar antes do vencimento.</p>
          </div>
          <button onClick={() => setShowRenovacao(true)} className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-xs text-black font-bold shrink-0 transition-colors">
            <RefreshCw className="w-3 h-3" /> Renovar
          </button>
        </div>
      )}

      {exclVencida && (
        <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/30 rounded-xl p-4">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-rose-400">Exclusividade vencida</p>
            <p className="text-xs text-rose-400/70 mt-0.5">Venceu em {formatDate(autorizacao.exclusividade_data_fim)}. Novas autorizacoes desta obra ja estao liberadas.</p>
          </div>
          <button onClick={() => setShowRenovacao(true)} className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs text-white font-bold shrink-0 transition-colors">
            <RefreshCw className="w-3 h-3" /> Renovar
          </button>
        </div>
      )}

      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4 flex flex-wrap items-center gap-2.5">
        <span className={'text-xs font-semibold px-2.5 py-1 rounded-full ' + TIPO_AUTORIZACAO_COLORS[autorizacao.tipo]}>{TIPO_AUTORIZACAO_LABELS[autorizacao.tipo]}</span>
        <span className={'text-xs font-semibold px-2.5 py-1 rounded-full ' + STATUS_AUTORIZACAO_COLORS[autorizacao.status]}>{STATUS_AUTORIZACAO_LABELS[autorizacao.status]}</span>
        {modeloNegocio && <span className={'text-xs font-semibold px-2.5 py-1 rounded-full ' + MODELO_NEGOCIO_COLORS[modeloNegocio]}>{MODELO_NEGOCIO_LABELS[modeloNegocio]}</span>}
        {exclVigente2 && (
          <span className={'flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ' + (exclAlerta2 ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-500/15 text-amber-400')}>
            <Lock className="w-3 h-3" />
            {'Exclusivo ' + (exclAlerta2 ? (exclDias2 + 'd restantes') : (autorizacao.exclusividade_periodo_meses + 'm'))}
          </span>
        )}
        <span className="text-xs text-white/30 pl-1">|</span>
        <span className="text-xs text-white/50">{autorizacao.territorio}</span>
        {autorizacao.valor_total != null && <><span className="text-xs text-white/30">|</span><span className="text-sm font-bold text-emerald-400">{formatBRL(autorizacao.valor_total)}</span></>}
      </div>

      <div className="flex items-center gap-0.5 border-b border-white/[0.06] overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={'flex items-center gap-1.5 h-9 px-4 text-xs font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ' + (activeTab === tab.id ? 'border-violet-500 text-white' : 'border-transparent text-white/40 hover:text-white/70')}>
            <tab.icon className="w-3.5 h-3.5" />{tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'resumo' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white">Dados Gerais</h3>
            {[
              { label: 'Numero', value: autorizacao.numero_autorizacao },
              { label: 'Tipo', value: TIPO_AUTORIZACAO_LABELS[autorizacao.tipo] },
              { label: 'Status', value: STATUS_AUTORIZACAO_LABELS[autorizacao.status] },
              { label: 'Modelo Negocio', value: modeloNegocio ? MODELO_NEGOCIO_LABELS[modeloNegocio] : 'nao definido' },
              { label: 'Documento', value: docEsperado ?? 'nao definido' },
              { label: 'Solicitante', value: autorizacao.solicitante_nome ?? 'nao informado' },
              { label: 'Licenciado', value: autorizacao.licenciado_nome ?? 'nao informado' },
              { label: 'Territorio', value: autorizacao.territorio },
            ].map(f => (
              <div key={f.label} className="flex items-start justify-between gap-4">
                <span className="text-xs text-white/35 shrink-0">{f.label}</span>
                <span className="text-xs text-white/70 font-medium text-right">{f.value}</span>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-white">Datas e Valores</h3>
              {[
                { label: 'Solicitacao', value: formatDate(autorizacao.data_solicitacao) },
                { label: 'Emissao', value: formatDate(autorizacao.data_emissao) },
                { label: 'Vigencia', value: autorizacao.data_inicio ? formatDate(autorizacao.data_inicio) + ' ate ' + (formatDate(autorizacao.data_fim) ?? 'indeterminado') : 'nao definida' },
                { label: 'Valor Total', value: formatBRL(autorizacao.valor_total) },
                { label: 'Moeda', value: autorizacao.moeda },
              ].map(f => (
                <div key={f.label} className="flex items-center justify-between">
                  <span className="text-xs text-white/35">{f.label}</span>
                  <span className="text-xs text-white/70 font-medium">{f.value}</span>
                </div>
              ))}
            </div>
            {autorizacao.exclusividade && (
              <div className={'rounded-xl border p-4 space-y-3 ' + (exclAlerta2 ? 'bg-amber-500/10 border-amber-500/30' : exclVencida ? 'bg-rose-500/10 border-rose-500/30' : 'bg-[#0d1526] border-white/[0.06]')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className={'w-4 h-4 ' + (exclVencida ? 'text-rose-400' : 'text-amber-400')} />
                    <h3 className="text-sm font-semibold text-white">Exclusividade</h3>
                  </div>
                  <button onClick={() => setShowRenovacao(true)} className="flex items-center gap-1 h-6 px-2 rounded-md bg-white/5 hover:bg-amber-500/20 text-white/40 hover:text-amber-300 text-[10px] transition-colors">
                    <RefreshCw className="w-3 h-3" /> Renovar
                  </button>
                </div>
                {[
                  { label: 'Prazo', value: autorizacao.exclusividade_periodo_meses + ' meses' },
                  { label: 'Vencimento', value: formatDate(autorizacao.exclusividade_data_fim) },
                  { label: 'Situacao', value: exclVencida ? 'Vencida' : exclAlerta2 ? 'Alerta ' + exclDias2 + ' dias' : exclVigente2 ? 'Vigente ' + exclDias2 + ' dias' : 'Nao vigente', special: true },
                ].map(f => (
                  <div key={f.label} className="flex items-center justify-between">
                    <span className="text-xs text-white/35">{f.label}</span>
                    <span className={'text-xs font-medium ' + (f.special ? (exclVencida ? 'text-rose-400' : exclAlerta2 ? 'text-amber-400' : 'text-emerald-400') : 'text-white/70')}>{f.value}</span>
                  </div>
                ))}
                {(autorizacao.exclusividade_renovacoes?.length ?? 0) > 0 && (
                  <div className="border-t border-white/[0.06] pt-3 space-y-1">
                    <p className="text-[10px] text-white/30">Renovacoes ({autorizacao.exclusividade_renovacoes!.length})</p>
                    {autorizacao.exclusividade_renovacoes!.map(r => (
                      <div key={r.id} className="flex items-center gap-2 text-[10px] text-white/50">
                        <RefreshCw className="w-2.5 h-2.5 text-white/30" />
                        <span>{formatDate(r.data_renovacao)}</span>
                        <span>+{r.periodo_meses}m ate {formatDate(r.data_fim_nova)}</span>
                        {r.observacoes && <span className="text-white/30">· {r.observacoes}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          {autorizacao.observacoes && (
            <div className="lg:col-span-2 bg-[#0d1526] border border-white/[0.06] rounded-xl p-5">
              <h3 className="text-xs font-semibold text-white/50 mb-2">Observacoes</h3>
              <p className="text-sm text-white/60 leading-relaxed">{autorizacao.observacoes}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'obras' && (
        <div className="space-y-4">
          {(autorizacao._obras ?? []).map(ao => (
            <div key={ao.id} className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-violet-400" />
                  <span className="text-sm font-semibold text-white">{ao.obra_titulo}</span>
                  <span className="text-xs font-mono text-white/30">{ao.obra_codigo}</span>
                </div>
                <Link href={'/master/obras/' + ao.obra_id} className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300">
                  Ver obra <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: '% Controlado', value: ao.percentual_controlado.toFixed(2) + '%', cls: 'bg-violet-500/10 border-violet-500/20 text-violet-400' },
                  { label: '% Autorizado', value: ao.percentual_autorizado.toFixed(2) + '%', cls: ao.percentual_autorizado <= ao.percentual_controlado ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400' },
                  { label: 'Tipo de Uso', value: ao.tipo_uso ? TIPO_USO_LABELS[ao.tipo_uso] : 'nao informado', cls: 'bg-white/5 border-white/[0.06] text-white/70' },
                  { label: 'Tempo', value: ao.tempo_utilizacao ?? 'integral', cls: 'bg-white/5 border-white/[0.06] text-white/60' },
                ].map(c => (
                  <div key={c.label} className={'text-center rounded-lg p-3 border ' + c.cls.split(' ').slice(0,2).join(' ')}>
                    <p className="text-[10px] text-white/40 mb-1">{c.label}</p>
                    <p className={'text-sm font-bold ' + c.cls.split(' ')[2]}>{c.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'docs' && (
        <div className="space-y-4">
          {autorizacao.status_assinatura && (
            <div className={'flex items-center gap-3 p-4 rounded-xl border ' + (autorizacao.status_assinatura === 'assinado' ? 'bg-emerald-500/10 border-emerald-500/20' : autorizacao.status_assinatura === 'enviado' ? 'bg-sky-500/10 border-sky-500/20' : 'bg-amber-500/10 border-amber-500/20')}>
              {autorizacao.status_assinatura === 'assinado' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : autorizacao.status_assinatura === 'enviado' ? <PenLine className="w-4 h-4 text-sky-400 shrink-0" /> : <Clock className="w-4 h-4 text-amber-400 shrink-0" />}
              <div>
                <p className={'text-xs font-semibold ' + (autorizacao.status_assinatura === 'assinado' ? 'text-emerald-400' : autorizacao.status_assinatura === 'enviado' ? 'text-sky-400' : 'text-amber-400')}>
                  {'Assinatura: ' + (autorizacao.status_assinatura === 'assinado' ? 'Concluida' : autorizacao.status_assinatura === 'enviado' ? 'Aguardando' : 'Pendente')}
                </p>
                {autorizacao.token_assinatura && <p className="text-[10px] text-white/40 font-mono mt-0.5">Token: {autorizacao.token_assinatura}</p>}
              </div>
            </div>
          )}
          {docEsperado && (
            <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                <FileText className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-semibold text-white">Documento Principal</h3>
                {modeloNegocio && <span className={'text-[10px] font-semibold px-1.5 py-0.5 rounded-full ' + MODELO_NEGOCIO_COLORS[modeloNegocio]}>{MODELO_NEGOCIO_LABELS[modeloNegocio]}</span>}
              </div>
              <div className="p-5">
                <p className="text-sm font-semibold text-white mb-1">{docEsperado}</p>
                <p className="text-xs text-white/40 mb-4">Deve ser gerado em PDF, assinado por token digital e arquivado no sistema.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                  {[
                    { step: 1, icon: Download, label: 'Baixar PDF', desc: 'Gera o PDF para revisao', done: !!autorizacao.pdf_url },
                    { step: 2, icon: PenLine, label: 'Assinar por Token', desc: 'Assina com token digital', done: autorizacao.status_assinatura === 'assinado' },
                    { step: 3, icon: Upload, label: 'Upload Assinado', desc: 'Upload do PDF assinado', done: !!autorizacao.pdf_assinado_url },
                  ].map(s => (
                    <div key={s.step} className={'rounded-xl border p-3 space-y-2 ' + (s.done ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/[0.03] border-white/[0.06]')}>
                      <div className="flex items-center gap-2">
                        <div className={'w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ' + (s.done ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/40')}>
                          {s.done ? <Check className="w-3 h-3" /> : s.step}
                        </div>
                        <span className={'text-xs font-semibold ' + (s.done ? 'text-emerald-400' : 'text-white/60')}>{s.label}</span>
                      </div>
                      <p className="text-[10px] text-white/35">{s.desc}</p>
                      {!s.done && (
                        <button onClick={() => { if (s.step === 3) setShowUpload(true) }}
                          className="w-full h-7 rounded-lg bg-violet-600/50 hover:bg-violet-600 text-[10px] text-white font-semibold transition-colors flex items-center justify-center gap-1">
                          <s.icon className="w-3 h-3" /> {s.label}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {autorizacao.pdf_assinado_url && (
                  <a href={autorizacao.pdf_assinado_url} className="flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 transition-colors w-fit">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Baixar PDF Assinado <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}
          {(autorizacao._documentos?.length ?? 0) > 0 && (
            <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-white/[0.06]">
                <h3 className="text-sm font-semibold text-white">Todos os Documentos ({autorizacao._documentos?.length})</h3>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {autorizacao._documentos?.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-white/30" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-white/70 font-medium capitalize">{doc.tipo.replace(/_/g, ' ')}</p>
                          {doc.assinado && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">Assinado</span>}
                        </div>
                        {doc.token_assinatura && <p className="text-[10px] font-mono text-white/30">Token: {doc.token_assinatura}</p>}
                        {doc.data_assinatura && <p className="text-[10px] text-white/30">{formatDate(doc.data_assinatura)} · {doc.assinado_por}</p>}
                      </div>
                    </div>
                    <a href={doc.url} className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300">Baixar <ExternalLink className="w-3 h-3" /></a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'cobranca' && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Status de Cobranca</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Valor Total', value: formatBRL(autorizacao.valor_total), color: 'text-white/70' },
              { label: 'Faturado', value: ['faturado','pago'].includes(autorizacao.status) ? formatBRL(autorizacao.valor_total) : 'nao faturado', color: 'text-amber-400' },
              { label: 'Pago', value: autorizacao.status === 'pago' ? formatBRL(autorizacao.valor_total) : 'nao pago', color: 'text-emerald-400' },
              { label: 'Pendente', value: autorizacao.status === 'pago' ? 'quitado' : formatBRL(autorizacao.valor_total), color: 'text-rose-400' },
            ].map(f => (
              <div key={f.label} className="bg-white/5 rounded-xl p-4 text-center border border-white/[0.06]">
                <p className="text-xs text-white/35 mb-1">{f.label}</p>
                <p className={'text-base font-bold ' + f.color}>{f.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'historico' && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Historico</h3>
          <div className="space-y-3">
            {([
              { data: autorizacao.created_at.slice(0,10), acao: 'Autorizacao criada', cor: 'bg-violet-500' },
              ...(autorizacao.data_emissao ? [{ data: autorizacao.data_emissao, acao: 'Emissao gerada — PDF disponivel', cor: 'bg-sky-500' }] : []),
              ...(autorizacao.status_assinatura === 'assinado' ? [{ data: autorizacao.updated_at.slice(0,10), acao: 'Documento assinado digitalmente', cor: 'bg-emerald-500' }] : []),
              ...(autorizacao.status === 'pago' ? [{ data: autorizacao.updated_at.slice(0,10), acao: 'Pagamento confirmado', cor: 'bg-emerald-600' }] : []),
              ...(autorizacao.exclusividade_renovacoes?.map(r => ({ data: r.data_renovacao, acao: 'Exclusividade renovada por ' + r.periodo_meses + ' meses — nova data: ' + formatDate(r.data_fim_nova), cor: 'bg-amber-500' })) ?? []),
            ] as {data:string,acao:string,cor:string}[]).sort((a,b) => b.data.localeCompare(a.data)).map((h,i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03]">
                <div className={'w-2 h-2 rounded-full ' + h.cor + ' shrink-0'} />
                <span className="text-xs text-white/40 w-24 shrink-0">{formatDate(h.data)}</span>
                <span className="text-sm text-white/60">{h.acao}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showRenovacao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0d1526] border border-white/[0.08] rounded-2xl w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold text-white">Renovar Exclusividade</h2>
              </div>
              <button onClick={() => setShowRenovacao(false)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-400">
                <p className="font-semibold mb-0.5">Exclusividade atual:</p>
                <p>{'Vence em ' + formatDate(autorizacao.exclusividade_data_fim) + (exclDias2 !== null ? ' (' + (exclDias2 >= 0 ? exclDias2 + ' dias restantes' : 'ja vencida') + ')' : '')}</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/50">Prorrogar por quantos meses?</label>
                <div className="flex items-center gap-2">
                  <input type="number" value={renovMeses} onChange={e => setRenovMeses(parseInt(e.target.value) || 12)} min={1} max={120}
                    className="w-24 h-9 bg-white/5 border border-white/[0.08] rounded-lg px-3 text-sm text-white focus:outline-none" />
                  <span className="text-xs text-white/50">meses</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/50">Observacoes</label>
                <input type="text" value={renovObs} onChange={e => setRenovObs(e.target.value)} placeholder="Motivo da renovacao..." className={inputCls} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 pb-5">
              <button onClick={() => setShowRenovacao(false)} className="h-8 px-4 rounded-lg bg-white/5 border border-white/[0.06] text-xs text-white/60 hover:text-white/80 transition-colors">Cancelar</button>
              <button onClick={handleRenovar} className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-xs text-black font-bold transition-colors">
                <RefreshCw className="w-3.5 h-3.5" /> Confirmar Renovacao
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0d1526] border border-white/[0.08] rounded-2xl w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-violet-400" />
                <h2 className="text-sm font-semibold text-white">Upload do Documento Assinado</h2>
              </div>
              <button onClick={() => setShowUpload(false)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-xs text-white/50">Faca o upload do PDF assinado digitalmente. O arquivo sera vinculado a esta autorizacao e o status atualizado para Assinado.</p>
              <div className="border-2 border-dashed border-white/[0.1] rounded-xl p-8 text-center space-y-2 hover:border-violet-500/40 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-white/20 mx-auto" />
                <p className="text-xs text-white/40">Arraste o arquivo aqui ou clique para selecionar</p>
                <p className="text-[10px] text-white/25">PDF - maximo 20MB</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 pb-5">
              <button onClick={() => setShowUpload(false)} className="h-8 px-4 rounded-lg bg-white/5 border border-white/[0.06] text-xs text-white/60 hover:text-white/80 transition-colors">Cancelar</button>
              <button onClick={() => setShowUpload(false)} className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs text-white font-semibold transition-colors">
                <Upload className="w-3.5 h-3.5" /> Enviar Documento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft, FileText, Users, Music, Shield, AlignLeft, Activity,
  CheckCircle2, Clock, XCircle, Printer, Download, AlertOctagon,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import type { ContratoRow, AssinaturaContrato, ContratoObra, EventoAuditoria, StatusAssinatura } from '@/lib/types-contratos'
import {
  STATUS_CONTRATO_LABELS, STATUS_CONTRATO_COLORS,
  TIPO_CONTRATO_LABELS, TIPO_CONTRATO_COLORS,
  STATUS_ASSINATURA_LABELS, STATUS_ASSINATURA_COLORS,
  DIREITO_LABELS,
} from '@/lib/types-contratos'
import type { DireitoCedido } from '@/lib/types-contratos'

// ─── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_CONTRATOS: Record<string, ContratoRow> = {
  c1: {
    id: 'c1', tenant_id: 't1', numero: 'TSM-2024-001', tipo: 'cessao', status: 'em_vigor',
    vigencia_inicio: '2024-01-10', vigencia_fim: '2026-01-10', renovacao_automatica: true,
    clausulas_extras: 'O cedente autoriza o uso em plataformas de streaming sem remuneracao adicional pelo periodo inicial de 12 meses.',
    observacoes: 'Contrato principal do catalogo Nauilan 2024.',
    created_at: '2024-01-10T10:00:00Z', updated_at: '2024-01-10T10:00:00Z',
    titular_principal: 'Nauilan Barbosa Silva', _obras_count: 8, _assinaturas_pendentes: 0,
  },
  c3: {
    id: 'c3', tenant_id: 't1', numero: 'TSM-2024-032', tipo: 'edicao', status: 'aguardando_assinatura',
    vigencia_inicio: '2024-05-20', vigencia_fim: '2027-05-20', renovacao_automatica: true,
    created_at: '2024-05-20T10:00:00Z', updated_at: '2024-05-20T10:00:00Z',
    titular_principal: 'Marcelo Costa Ferreira', _obras_count: 5, _assinaturas_pendentes: 2,
  },
}

const MOCK_ASSINATURAS: Record<string, AssinaturaContrato[]> = {
  c1: [
    { id: 'a1', contrato_id: 'c1', parte_id: 'p1', nome_parte: 'Nauilan Barbosa Silva', tipo_parte: 'cedente', status: 'assinado', data_assinatura: '2024-01-10T14:32:00Z', ip_origem: '187.32.x.x', hash_documento: 'sha256:ab12cd34ef56' },
    { id: 'a2', contrato_id: 'c1', parte_id: 'p3', nome_parte: 'Edi Music Editora Ltda', tipo_parte: 'cessionario', status: 'assinado', data_assinatura: '2024-01-10T15:10:00Z', ip_origem: '200.45.x.x', hash_documento: 'sha256:ab12cd34ef56' },
  ],
  c3: [
    { id: 'a3', contrato_id: 'c3', parte_id: 'p4', nome_parte: 'Marcelo Costa Ferreira', tipo_parte: 'cedente', status: 'pendente' },
    { id: 'a4', contrato_id: 'c3', parte_id: 'p3', nome_parte: 'Edi Music Editora Ltda', tipo_parte: 'cessionario', status: 'pendente' },
  ],
}

const MOCK_OBRAS_VINC: Record<string, ContratoObra[]> = {
  c1: [
    { id: 'co1', contrato_id: 'c1', obra_id: 'o1', titulo_obra: 'Amo Noite e Dia', codigo_obra: 'OBR-001', percentual: 50, vigencia_inicio: '2024-01-10', vigencia_fim: '2026-01-10', direitos_cedidos: ['exec_publica', 'fonomecanico', 'sincronizacao'] },
    { id: 'co2', contrato_id: 'c1', obra_id: 'o2', titulo_obra: 'Deixa eu Te Amar', codigo_obra: 'OBR-006', percentual: 37.5, vigencia_inicio: '2024-01-10', vigencia_fim: '2026-01-10', direitos_cedidos: ['exec_publica', 'fonomecanico'] },
    { id: 'co3', contrato_id: 'c1', obra_id: 'o3', titulo_obra: 'Sol da Manha', codigo_obra: 'OBR-003', percentual: 100, vigencia_inicio: '2024-01-10', direitos_cedidos: ['todos'] },
  ],
  c3: [
    { id: 'co4', contrato_id: 'c3', obra_id: 'o4', titulo_obra: 'Tempo de Amar', codigo_obra: 'OBR-004', percentual: 50, direitos_cedidos: ['exec_publica'] },
  ],
}

const MOCK_AUDITORIA: Record<string, EventoAuditoria[]> = {
  c1: [
    { id: 'ev1', contrato_id: 'c1', tipo_evento: 'criacao', descricao: 'Contrato criado pelo usuario admin@syncmood.com.br', usuario: 'admin@syncmood.com.br', ip: '10.0.0.1', created_at: '2024-01-10T10:00:00Z' },
    { id: 'ev2', contrato_id: 'c1', tipo_evento: 'assinatura', descricao: 'Assinatura recebida de Nauilan Barbosa Silva (cedente)', usuario: 'nauilan@email.com', ip: '187.32.x.x', created_at: '2024-01-10T14:32:00Z' },
    { id: 'ev3', contrato_id: 'c1', tipo_evento: 'assinatura', descricao: 'Assinatura recebida de Edi Music Editora Ltda (cessionario)', usuario: 'contato@edimusic.com', ip: '200.45.x.x', created_at: '2024-01-10T15:10:00Z' },
    { id: 'ev4', contrato_id: 'c1', tipo_evento: 'status', descricao: 'Status alterado para Em Vigor', usuario: 'sistema', created_at: '2024-01-10T15:10:01Z' },
  ],
  c3: [
    { id: 'ev5', contrato_id: 'c3', tipo_evento: 'criacao', descricao: 'Contrato criado pelo usuario admin@syncmood.com.br', usuario: 'admin@syncmood.com.br', created_at: '2024-05-20T10:00:00Z' },
    { id: 'ev6', contrato_id: 'c3', tipo_evento: 'notificacao', descricao: 'Notificacao de assinatura enviada para as partes', usuario: 'sistema', created_at: '2024-05-20T10:01:00Z' },
  ],
}

const CLAUSULAS_PADRAO = `CONTRATO DE CESSAO DE DIREITOS AUTORAIS

Pelo presente instrumento particular, as partes abaixo qualificadas celebram o presente Contrato de Cessao de Direitos Autorais, que se regerá pelas seguintes clausulas e condicoes:

CLAUSULA PRIMEIRA - DO OBJETO
O CEDENTE cede ao CESSIONARIO, em carater exclusivo e definitivo, os direitos patrimoniais de autor sobre as obras musicais listadas no Anexo I deste instrumento, incluindo os direitos de execucao publica, reproducao fonomecanica e sincronizacao audiovisual.

CLAUSULA SEGUNDA - DA VIGENCIA
O presente contrato vigorara pelo prazo estabelecido no preambulo, podendo ser renovado por igual periodo mediante acordo expresso das partes.

CLAUSULA TERCEIRA - DA REMUNERACAO
O CESSIONARIO pagara ao CEDENTE royalties na forma e periodicidade estabelecidos no Anexo II, calculados sobre os valores efetivamente arrecadados pelas sociedades autorais competentes.

CLAUSULA QUARTA - DAS OBRIGACOES DO CESSIONARIO
a) Registrar as obras cedidas nas sociedades autorais competentes;
b) Prestar contas mensalmente ao CEDENTE;
c) Defender os direitos autorais cedidos contra quaisquer violacoes.

CLAUSULA QUINTA - DO FORO
As partes elegem o foro da comarca de Sao Paulo/SP para dirimir quaisquer controversias oriundas deste contrato.`

// ─── Helpers ───────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-white/[0.04] last:border-0">
      <span className="text-xs text-white/40 w-40 flex-shrink-0">{label}</span>
      <span className="text-sm text-white/80 text-right">{value || <span className="text-white/20">—</span>}</span>
    </div>
  )
}

function AssinaturaIcon({ status }: { status: StatusAssinatura }) {
  if (status === 'assinado') return <CheckCircle2 className="w-4 h-4 text-emerald-400" />
  if (status === 'recusado') return <XCircle className="w-4 h-4 text-rose-400" />
  return <Clock className="w-4 h-4 text-amber-400" />
}

function formatDt(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleString('pt-BR')
}

// ─── Page ──────────────────────────────────────────────────────────────────────

type Tab = 'informacoes' | 'obras' | 'assinaturas' | 'clausulas' | 'auditoria'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'informacoes', label: 'Informacoes', icon: <FileText className="w-4 h-4" /> },
  { id: 'obras',       label: 'Obras',       icon: <Music className="w-4 h-4" /> },
  { id: 'assinaturas', label: 'Assinaturas', icon: <Shield className="w-4 h-4" /> },
  { id: 'clausulas',   label: 'Clausulas',   icon: <AlignLeft className="w-4 h-4" /> },
  { id: 'auditoria',   label: 'Auditoria',   icon: <Activity className="w-4 h-4" /> },
]

export default function ContratoDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('informacoes')

  const contrato = MOCK_CONTRATOS[id] ?? MOCK_CONTRATOS['c1']
  const assinaturas = MOCK_ASSINATURAS[id] ?? []
  const obras = MOCK_OBRAS_VINC[id] ?? []
  const auditoria = MOCK_AUDITORIA[id] ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <button onClick={() => router.back()} className="mt-1 text-white/40 hover:text-white/70 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <PageHeader
            title={contrato.numero}
            description={TIPO_CONTRATO_LABELS[contrato.tipo] + ' · ' + contrato.titular_principal}
            actions={
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/5 border border-white/[0.08] text-xs text-white/60 hover:text-white/80 transition-colors">
                  <Printer className="w-3.5 h-3.5" /> Imprimir
                </button>
                <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/5 border border-white/[0.08] text-xs text-white/60 hover:text-white/80 transition-colors">
                  <Download className="w-3.5 h-3.5" /> PDF
                </button>
                {contrato.status === 'em_vigor' && (
                  <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-rose-600/20 border border-rose-500/30 text-xs text-rose-400 hover:bg-rose-600/30 transition-colors">
                    <AlertOctagon className="w-3.5 h-3.5" /> Revogar
                  </button>
                )}
              </div>
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-white/40 mb-1">Status</p>
          <span className={'text-xs font-semibold px-2 py-0.5 rounded-full ' + STATUS_CONTRATO_COLORS[contrato.status]}>
            {STATUS_CONTRATO_LABELS[contrato.status]}
          </span>
        </div>
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-white/40 mb-1">Tipo</p>
          <span className={'text-xs font-semibold px-2 py-0.5 rounded-full ' + TIPO_CONTRATO_COLORS[contrato.tipo]}>
            {TIPO_CONTRATO_LABELS[contrato.tipo]}
          </span>
        </div>
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-white/40 mb-1">Obras Vinculadas</p>
          <p className="text-xl font-bold text-violet-400">{contrato._obras_count}</p>
        </div>
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-white/40 mb-1">Assinaturas Pend.</p>
          <p className={'text-xl font-bold ' + (contrato._assinaturas_pendentes > 0 ? 'text-amber-400' : 'text-emerald-400')}>
            {contrato._assinaturas_pendentes}
          </p>
        </div>
      </div>

      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="flex border-b border-white/[0.06] overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ' + (tab === t.id ? 'text-violet-300 border-violet-500' : 'text-white/40 border-transparent hover:text-white/70')}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'informacoes' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Dados Gerais</h4>
                <InfoRow label="Numero" value={<span className="font-mono">{contrato.numero}</span>} />
                <InfoRow label="Tipo" value={TIPO_CONTRATO_LABELS[contrato.tipo]} />
                <InfoRow label="Status" value={STATUS_CONTRATO_LABELS[contrato.status]} />
                <InfoRow label="Inicio vigencia" value={contrato.vigencia_inicio} />
                <InfoRow label="Fim vigencia" value={contrato.vigencia_fim} />
                <InfoRow label="Renovacao auto." value={contrato.renovacao_automatica ? 'Sim' : 'Nao'} />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Partes</h4>
                <div className="space-y-2">
                  {(assinaturas.length > 0 ? assinaturas : [
                    { id: 'x', contrato_id: id, parte_id: 'p1', nome_parte: contrato.titular_principal, tipo_parte: 'cedente' as const, status: 'assinado' as const },
                    { id: 'y', contrato_id: id, parte_id: 'p3', nome_parte: 'Edi Music Editora Ltda', tipo_parte: 'cessionario' as const, status: 'assinado' as const },
                  ]).map(a => (
                    <div key={a.id} className="flex items-center justify-between bg-white/[0.02] rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-white/30" />
                        <div>
                          <p className="text-sm text-white/80">{a.nome_parte}</p>
                          <p className="text-xs text-white/40 capitalize">{a.tipo_parte}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {contrato.observacoes && (
                  <div className="mt-5">
                    <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Observacoes</h4>
                    <p className="text-sm text-white/60 bg-white/[0.02] rounded-lg p-3">{contrato.observacoes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'obras' && (
            <div className="space-y-3">
              {obras.length === 0 && (
                <p className="text-center text-white/30 text-sm py-8">Nenhuma obra vinculada a este contrato.</p>
              )}
              {obras.map(o => (
                <div key={o.id} className="bg-white/[0.02] rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4 text-violet-400" />
                      <div>
                        <p className="text-sm font-medium text-white/80">{o.titulo_obra}</p>
                        <p className="text-xs text-white/40 font-mono">{o.codigo_obra}</p>
                      </div>
                    </div>
                    <Link href={'/master/obras/' + o.obra_id} className="text-xs text-violet-400 hover:text-violet-300">Ver obra</Link>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div><span className="text-white/40 block">Percentual</span><span className="text-white/80 font-bold">{o.percentual}%</span></div>
                    <div><span className="text-white/40 block">Inicio</span><span className="text-white/80">{o.vigencia_inicio ?? '—'}</span></div>
                    <div><span className="text-white/40 block">Fim</span><span className="text-white/80">{o.vigencia_fim ?? '—'}</span></div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {o.direitos_cedidos.map(d => (
                      <span key={d} className="text-xs bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-full">
                        {DIREITO_LABELS[d as DireitoCedido]}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'assinaturas' && (
            <div className="space-y-3">
              {assinaturas.map(a => (
                <div key={a.id} className="flex items-center justify-between bg-white/[0.02] rounded-lg px-4 py-4">
                  <div className="flex items-center gap-3">
                    <AssinaturaIcon status={a.status} />
                    <div>
                      <p className="text-sm font-medium text-white/80">{a.nome_parte}</p>
                      <p className="text-xs text-white/40 capitalize">{a.tipo_parte}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={'text-xs font-semibold px-2 py-0.5 rounded-full ' + STATUS_ASSINATURA_COLORS[a.status]}>
                      {STATUS_ASSINATURA_LABELS[a.status]}
                    </span>
                    {a.data_assinatura && (
                      <p className="text-xs text-white/40 mt-1">{formatDt(a.data_assinatura)}</p>
                    )}
                    {a.ip_origem && (
                      <p className="text-xs text-white/25 font-mono">{a.ip_origem}</p>
                    )}
                    {a.hash_documento && (
                      <p className="text-xs text-white/20 font-mono mt-0.5 truncate max-w-40">{a.hash_documento}</p>
                    )}
                  </div>
                </div>
              ))}
              {assinaturas.length === 0 && (
                <p className="text-center text-white/30 text-sm py-8">Sem registros de assinatura.</p>
              )}
            </div>
          )}

          {tab === 'clausulas' && (
            <div>
              <div className="bg-white/[0.02] rounded-lg p-5">
                <pre className="text-sm text-white/70 whitespace-pre-wrap font-sans leading-relaxed">
                  {CLAUSULAS_PADRAO}
                  {contrato.clausulas_extras && '\n\nCLAUSULAS ADICIONAIS\n\n' + contrato.clausulas_extras}
                </pre>
              </div>
            </div>
          )}

          {tab === 'auditoria' && (
            <div className="space-y-3">
              {auditoria.map((ev, i) => (
                <div key={ev.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-violet-500 mt-1.5 flex-shrink-0" />
                    {i < auditoria.length - 1 && <div className="w-px flex-1 bg-white/[0.06] mt-1" />}
                  </div>
                  <div className="pb-4 flex-1">
                    <p className="text-sm text-white/70">{ev.descricao}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-white/30">{formatDt(ev.created_at)}</span>
                      {ev.usuario && <span className="text-xs text-white/25">· {ev.usuario}</span>}
                    </div>
                  </div>
                </div>
              ))}
              {auditoria.length === 0 && (
                <p className="text-center text-white/30 text-sm py-8">Nenhum evento registrado.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

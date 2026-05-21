'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Pencil, Users, Music, FileText, CreditCard, Receipt, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Titular, TipoTitular } from '@/lib/database.types'

const MOCK: Record<string, Titular & { _obras: number; _contratos: number }> = {
  '1': { id: '1', tenant_id: 't1', tipo: 'compositor', nome_completo: 'Nauilan Barbosa Silva', pessoa: 'PF', cpf_cnpj: '123.456.789-00', rg: '1.234.567-8', data_nascimento: '1985-03-12', endereco: 'Rua das Flores, 100', bairro: 'Centro', cep: '20040-020', cidade: 'Rio de Janeiro', estado: 'RJ', telefone: '(21) 99999-0001', email: 'nauilan@email.com', sociedade_autoral: 'UBC', codigo_cae: 'CAE001', codigo_ipi: null, ipi: '00123456', banco: 'Itau', agencia: '1234', conta: '56789-0', tipo_conta: 'corrente', pix: '123.456.789-00', usuario_id: null, status: 'ativo', observacoes: 'Autor principal da Top Show Music.', created_at: '2024-01-10T10:00:00Z', updated_at: '2024-01-10T10:00:00Z', deleted_at: null, _obras: 12, _contratos: 2 },
  '2': { id: '2', tenant_id: 't1', tipo: 'compositor', nome_completo: 'Giovani Alves Rodrigues', pessoa: 'PF', cpf_cnpj: '234.567.890-11', rg: null, data_nascimento: '1990-07-22', endereco: 'Av. Atlantica, 200', bairro: 'Copacabana', cep: '22010-000', cidade: 'Rio de Janeiro', estado: 'RJ', telefone: '(21) 99999-0002', email: 'giovani@email.com', sociedade_autoral: 'ECAD', codigo_cae: null, codigo_ipi: null, ipi: null, banco: 'Bradesco', agencia: '5678', conta: '12345-6', tipo_conta: 'corrente', pix: '234.567.890-11', usuario_id: null, status: 'ativo', observacoes: null, created_at: '2024-01-15T10:00:00Z', updated_at: '2024-01-15T10:00:00Z', deleted_at: null, _obras: 8, _contratos: 1 },
}

const TIPO_LABEL: Record<TipoTitular, string> = { autor: 'Autor', compositor: 'Compositor', interprete: 'Interprete', produtor: 'Produtor', editora: 'Editora', gravadora: 'Gravadora', cessionario: 'Cessionario' }

const MOCK_CONTRATOS = [
  { id: 'c1', numero: 'TSM-2024-001', tipo: 'cessao', status: 'ativo', data_inicio: '2024-01-10', obras_vinculadas: 8 },
  { id: 'c2', numero: 'TSM-2024-015', tipo: 'administracao', status: 'em_analise', data_inicio: '2024-03-01', obras_vinculadas: 4 },
]
const MOCK_OBRAS = [
  { id: 'o1', titulo: 'Amo Noite e Dia', status: 'ativa', pct: 37.5 },
  { id: 'o2', titulo: 'Deixa eu Te Amar', status: 'ativa', pct: 50.0 },
  { id: 'o3', titulo: 'Saudade de Voce', status: 'validada', pct: 25.0 },
  { id: 'o4', titulo: 'Tempo Bom', status: 'pendente_validacao', pct: 100.0 },
]
const MOCK_CC = [
  { data: '2024-04-15', descricao: 'Distribuicao Q1 2024 - ECAD', tipo: 'credito', valor: 4320.00 },
  { data: '2024-04-15', descricao: 'Desconto IRRF (11%)', tipo: 'debito', valor: -475.20 },
  { data: '2024-03-10', descricao: 'Distribuicao Q4 2023 - UBC', tipo: 'credito', valor: 7830.50 },
  { data: '2024-03-10', descricao: 'Desconto IRRF (11%)', tipo: 'debito', valor: -861.36 },
  { data: '2024-01-15', descricao: 'Adiantamento - Contrato TSM-2024-001', tipo: 'debito', valor: -5000.00 },
]

type Tab = 'dados' | 'contratos' | 'obras' | 'conta' | 'documentos'
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dados', label: 'Dados Cadastrais', icon: <Users className="w-4 h-4" /> },
  { id: 'contratos', label: 'Contratos', icon: <FileText className="w-4 h-4" /> },
  { id: 'obras', label: 'Obras', icon: <Music className="w-4 h-4" /> },
  { id: 'conta', label: 'Conta Corrente', icon: <CreditCard className="w-4 h-4" /> },
  { id: 'documentos', label: 'Documentos', icon: <Receipt className="w-4 h-4" /> },
]

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-white/[0.04] last:border-0">
      <span className="text-xs text-white/40 w-40 flex-shrink-0">{label}</span>
      <span className="text-sm text-white/80 text-right">{value || <span className="text-white/20">—</span>}</span>
    </div>
  )
}

function StatusIcon({ s }: { s: string }) {
  if (s === 'ativo') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
  if (s === 'em_analise') return <Clock className="w-3.5 h-3.5 text-amber-400" />
  return <AlertCircle className="w-3.5 h-3.5 text-white/30" />
}

export default function TitularDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('dados')

  const titular = MOCK[id] ?? MOCK['1']
  const saldo = MOCK_CC.reduce((acc, l) => acc + l.valor, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <button onClick={() => router.back()} className="mt-1 text-white/40 hover:text-white/70 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <PageHeader
            title={titular.nome_completo}
            description={TIPO_LABEL[titular.tipo] + ' · ' + titular.pessoa + ' · ' + titular.cpf_cnpj}
            actions={
              <Link href={'/master/titulares/' + id + '/editar'}>
                <Button variant="ghost" size="sm"><Pencil className="w-4 h-4" /> Editar</Button>
              </Link>
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-white/40 mb-1">Saldo Conta Corrente</p>
          <p className="text-xl font-bold text-emerald-400">R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-white/40 mb-1">Obras no Catalogo</p>
          <p className="text-xl font-bold text-violet-400">{titular._obras}</p>
        </div>
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-white/40 mb-1">Contratos Vigentes</p>
          <p className="text-xl font-bold text-sky-400">{titular._contratos}</p>
        </div>
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-white/40 mb-1">Status</p>
          <Badge variant={titular.status === 'ativo' ? 'emerald' : 'rose'}>{titular.status}</Badge>
        </div>
      </div>

      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="flex border-b border-white/[0.06] overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ' + (tab === t.id ? 'text-violet-300 border-violet-500' : 'text-white/40 border-transparent hover:text-white/70')}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'dados' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Identificacao</h4>
                <InfoRow label="Nome completo" value={titular.nome_completo} />
                <InfoRow label="CPF / CNPJ" value={<span className="font-mono">{titular.cpf_cnpj}</span>} />
                {titular.pessoa === 'PF' && <InfoRow label="Data de nascimento" value={titular.data_nascimento ? new Date(titular.data_nascimento + 'T00:00:00').toLocaleDateString('pt-BR') : null} />}
                <InfoRow label="RG" value={titular.rg} />
                <InfoRow label="Tipo" value={TIPO_LABEL[titular.tipo]} />
                <InfoRow label="IPI" value={titular.ipi} />
                <InfoRow label="Sociedade autoral" value={titular.sociedade_autoral} />
                <InfoRow label="Codigo CAE" value={titular.codigo_cae} />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Contato</h4>
                <InfoRow label="E-mail" value={titular.email} />
                <InfoRow label="Telefone" value={titular.telefone} />
                <InfoRow label="Endereco" value={titular.endereco} />
                <InfoRow label="Bairro" value={titular.bairro} />
                <InfoRow label="CEP" value={titular.cep} />
                <InfoRow label="Cidade / UF" value={titular.cidade ? titular.cidade + ' / ' + titular.estado : null} />
                <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3 mt-5">Dados Bancarios</h4>
                <InfoRow label="Banco" value={titular.banco} />
                <InfoRow label="Agencia / Conta" value={titular.agencia ? titular.agencia + ' / ' + titular.conta + ' (' + titular.tipo_conta + ')' : null} />
                <InfoRow label="PIX" value={titular.pix} />
              </div>
              {titular.observacoes && (
                <div className="md:col-span-2">
                  <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Observacoes</h4>
                  <p className="text-sm text-white/60 bg-white/[0.02] rounded-lg p-3">{titular.observacoes}</p>
                </div>
              )}
            </div>
          )}

          {tab === 'contratos' && (
            <div className="space-y-3">
              {MOCK_CONTRATOS.map(c => (
                <div key={c.id} className="flex items-center justify-between bg-white/[0.02] rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    <StatusIcon s={c.status} />
                    <div>
                      <p className="text-sm font-medium text-white">{c.numero}</p>
                      <p className="text-xs text-white/40">{c.tipo} · Inicio: {new Date(c.data_inicio).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/40">{c.obras_vinculadas} obra(s)</span>
                    <Badge variant={c.status === 'ativo' ? 'emerald' : 'amber'}>{c.status}</Badge>
                    <Link href={'/master/contratos/' + c.id} className="text-xs text-violet-400 hover:text-violet-300">Ver</Link>
                  </div>
                </div>
              ))}
              <div className="pt-2">
                <Button variant="ghost" size="sm"><FileText className="w-4 h-4" /> Gerar Novo Contrato</Button>
              </div>
            </div>
          )}

          {tab === 'obras' && (
            <div className="space-y-2">
              {MOCK_OBRAS.map(o => (
                <div key={o.id} className="flex items-center justify-between bg-white/[0.02] rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Music className="w-4 h-4 text-violet-400" />
                    <div>
                      <p className="text-sm font-medium text-white">{o.titulo}</p>
                      <p className="text-xs text-white/40">{o.pct}% participacao autoral</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={o.status === 'ativa' ? 'emerald' : o.status === 'validada' ? 'sky' : 'amber'}>{o.status}</Badge>
                    <Link href={'/master/obras/' + o.id} className="text-xs text-violet-400 hover:text-violet-300">Ver</Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'conta' && (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-white/40">Saldo atual</p>
                <p className="text-2xl font-bold text-emerald-400">R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <table className="w-full">
                <thead><tr className="border-b border-white/[0.05]">
                  <th className="text-left py-2 text-xs text-white/40">Data</th>
                  <th className="text-left py-2 text-xs text-white/40">Descricao</th>
                  <th className="text-right py-2 text-xs text-white/40">Valor</th>
                </tr></thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {MOCK_CC.map((l, i) => (
                    <tr key={i} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 text-xs text-white/40">{new Date(l.data).toLocaleDateString('pt-BR')}</td>
                      <td className="py-2.5 text-sm text-white/70">{l.descricao}</td>
                      <td className={'py-2.5 text-sm text-right font-mono font-medium ' + (l.valor >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                        {l.valor >= 0 ? '+' : ''}R$ {Math.abs(l.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'documentos' && (
            <div className="flex flex-col items-center justify-center py-12 text-white/20">
              <Receipt className="w-12 h-12 mb-3" />
              <p className="text-sm">Documentos fiscais disponiveis apos primeiro pagamento</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
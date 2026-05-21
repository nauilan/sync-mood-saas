'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Users, Plus, Search, Filter, UserCheck, Building2, AlertCircle, Music, FileText } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { KpiCard } from '@/components/ui/kpi-card'
import type { Titular, TipoTitular, StatusGeral, PessoaTipo } from '@/lib/database.types'

const TITULARES: (Titular & { _obras: number; _contratos: number })[] = [
  { id: '1', tenant_id: 't1', tipo: 'compositor', nome_completo: 'Nauilan Barbosa Silva', pessoa: 'PF', cpf_cnpj: '123.456.789-00', rg: null, data_nascimento: '1985-03-12', endereco: 'Rua das Flores, 100', bairro: 'Centro', cep: '20040-020', cidade: 'Rio de Janeiro', estado: 'RJ', telefone: '(21) 99999-0001', email: 'nauilan@email.com', sociedade_autoral: 'UBC', codigo_cae: 'CAE001', codigo_ipi: null, ipi: '00123456', banco: 'Itau', agencia: '1234', conta: '56789-0', tipo_conta: 'corrente', pix: '123.456.789-00', usuario_id: null, status: 'ativo', observacoes: null, created_at: '2024-01-10T10:00:00Z', updated_at: '2024-01-10T10:00:00Z', deleted_at: null, _obras: 12, _contratos: 2 },
  { id: '2', tenant_id: 't1', tipo: 'compositor', nome_completo: 'Giovani Alves Rodrigues', pessoa: 'PF', cpf_cnpj: '234.567.890-11', rg: null, data_nascimento: '1990-07-22', endereco: 'Av. Atlantica, 200', bairro: 'Copacabana', cep: '22010-000', cidade: 'Rio de Janeiro', estado: 'RJ', telefone: '(21) 99999-0002', email: 'giovani@email.com', sociedade_autoral: 'ECAD', codigo_cae: null, codigo_ipi: null, ipi: null, banco: 'Bradesco', agencia: '5678', conta: '12345-6', tipo_conta: 'corrente', pix: '234.567.890-11', usuario_id: null, status: 'ativo', observacoes: null, created_at: '2024-01-15T10:00:00Z', updated_at: '2024-01-15T10:00:00Z', deleted_at: null, _obras: 8, _contratos: 1 },
  { id: '3', tenant_id: 't1', tipo: 'compositor', nome_completo: 'Marcelo Costa Ferreira', pessoa: 'PF', cpf_cnpj: '345.678.901-22', rg: null, data_nascimento: '1978-11-05', endereco: 'Rua Augusta, 500', bairro: 'Consolacao', cep: '01304-000', cidade: 'Sao Paulo', estado: 'SP', telefone: '(11) 98888-0003', email: 'marcelo@email.com', sociedade_autoral: 'UBC', codigo_cae: 'CAE003', codigo_ipi: null, ipi: null, banco: null, agencia: null, conta: null, tipo_conta: null, pix: null, usuario_id: null, status: 'ativo', observacoes: null, created_at: '2024-02-01T10:00:00Z', updated_at: '2024-02-01T10:00:00Z', deleted_at: null, _obras: 5, _contratos: 0 },
  { id: '4', tenant_id: 't1', tipo: 'compositor', nome_completo: 'Joao Pedro Moraes Lima', pessoa: 'PF', cpf_cnpj: '456.789.012-33', rg: null, data_nascimento: '2000-04-18', endereco: null, bairro: null, cep: null, cidade: 'Belo Horizonte', estado: 'MG', telefone: '(31) 97777-0004', email: 'joaopedro@email.com', sociedade_autoral: null, codigo_cae: null, codigo_ipi: null, ipi: null, banco: null, agencia: null, conta: null, tipo_conta: null, pix: null, usuario_id: null, status: 'ativo', observacoes: null, created_at: '2024-02-10T10:00:00Z', updated_at: '2024-02-10T10:00:00Z', deleted_at: null, _obras: 3, _contratos: 0 },
  { id: '5', tenant_id: 't1', tipo: 'editora', nome_completo: 'Edi Music Editora Ltda', pessoa: 'PJ', cpf_cnpj: '12.345.678/0001-90', rg: null, data_nascimento: null, endereco: 'Rua do Comercio, 1000', bairro: 'Lapa', cep: '05074-000', cidade: 'Sao Paulo', estado: 'SP', telefone: '(11) 3000-5000', email: 'contato@edimusic.com', sociedade_autoral: 'UBC', codigo_cae: 'CAE-EDI', codigo_ipi: null, ipi: '00456789', banco: 'Santander', agencia: '9012', conta: '34567-8', tipo_conta: 'corrente', pix: '12.345.678/0001-90', usuario_id: null, status: 'ativo', observacoes: null, created_at: '2024-01-05T10:00:00Z', updated_at: '2024-01-05T10:00:00Z', deleted_at: null, _obras: 0, _contratos: 3 },
  { id: '6', tenant_id: 't1', tipo: 'interprete', nome_completo: 'Ana Paula Santos', pessoa: 'PF', cpf_cnpj: '567.890.123-44', rg: null, data_nascimento: '1993-09-30', endereco: 'Rua da Paz, 300', bairro: 'Vila Nova', cep: '41300-000', cidade: 'Salvador', estado: 'BA', telefone: '(71) 96666-0005', email: 'anapaulia@email.com', sociedade_autoral: 'UBC', codigo_cae: null, codigo_ipi: null, ipi: null, banco: 'Caixa', agencia: '3456', conta: '78901-2', tipo_conta: 'poupanca', pix: '567.890.123-44', usuario_id: null, status: 'inativo', observacoes: null, created_at: '2024-03-01T10:00:00Z', updated_at: '2024-03-01T10:00:00Z', deleted_at: null, _obras: 2, _contratos: 1 },
]

const TIPO_LABEL: Record<TipoTitular, string> = { autor: 'Autor', compositor: 'Compositor', interprete: 'Interprete', produtor: 'Produtor', editora: 'Editora', gravadora: 'Gravadora', cessionario: 'Cessionario' }
const TIPO_COLOR: Record<TipoTitular, 'violet' | 'sky' | 'emerald' | 'amber' | 'rose'> = { autor: 'violet', compositor: 'violet', interprete: 'sky', produtor: 'sky', editora: 'emerald', gravadora: 'amber', cessionario: 'amber' }

export default function TitularesPage() {
  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState<TipoTitular | ''>('')
  const [filterPessoa, setFilterPessoa] = useState<PessoaTipo | ''>('')
  const [filterStatus, setFilterStatus] = useState<StatusGeral | ''>('')

  const filtered = TITULARES.filter(t => {
    const q = search.toLowerCase()
    const matchSearch = !q || t.nome_completo.toLowerCase().includes(q) || t.cpf_cnpj.includes(q) || (t.email ?? '').toLowerCase().includes(q)
    const matchTipo = !filterTipo || t.tipo === filterTipo
    const matchPessoa = !filterPessoa || t.pessoa === filterPessoa
    const matchStatus = !filterStatus || t.status === filterStatus
    return matchSearch && matchTipo && matchPessoa && matchStatus
  })

  const totalPF = TITULARES.filter(t => t.pessoa === 'PF').length
  const totalPJ = TITULARES.filter(t => t.pessoa === 'PJ').length
  const totalAtivos = TITULARES.filter(t => t.status === 'ativo').length
  const semContrato = TITULARES.filter(t => t._contratos === 0).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Titulares"
        description="Gestao de titulares de direitos autorais"
        actions={
          <Link href="/master/titulares/novo">
            <Button variant="primary" size="sm"><Plus className="w-4 h-4" /> Novo Titular</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total de Titulares" value={TITULARES.length} subtitle={'ativos: ' + totalAtivos} accent="violet" icon={<Users className="w-4 h-4 text-violet-400" />} />
        <KpiCard title="Pessoas Fisicas (PF)" value={totalPF} subtitle="autores e compositores" accent="sky" icon={<UserCheck className="w-4 h-4 text-sky-400" />} />
        <KpiCard title="Pessoas Juridicas (PJ)" value={totalPJ} subtitle="editoras e cessionarios" accent="emerald" icon={<Building2 className="w-4 h-4 text-emerald-400" />} />
        <KpiCard title="Sem Contrato" value={semContrato} subtitle="pendentes de vinculacao" accent="amber" icon={<AlertCircle className="w-4 h-4 text-amber-400" />} />
      </div>

      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50 transition-colors" placeholder="Buscar por nome, CPF/CNPJ, e-mail..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-white/30" />
            <select className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/70 outline-none focus:border-violet-500/50 transition-colors" value={filterTipo} onChange={e => setFilterTipo(e.target.value as TipoTitular | '')}>
              <option value="">Todos os tipos</option>
              {(Object.keys(TIPO_LABEL) as TipoTitular[]).map(k => <option key={k} value={k}>{TIPO_LABEL[k]}</option>)}
            </select>
            <select className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/70 outline-none" value={filterPessoa} onChange={e => setFilterPessoa(e.target.value as PessoaTipo | '')}>
              <option value="">PF + PJ</option>
              <option value="PF">Pessoa Fisica</option>
              <option value="PJ">Pessoa Juridica</option>
            </select>
            <select className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/70 outline-none" value={filterStatus} onChange={e => setFilterStatus(e.target.value as StatusGeral | '')}>
              <option value="">Ativo + Inativo</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
        </div>
        <p className="text-xs text-white/30">{filtered.length} titular{filtered.length !== 1 ? 'es' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.05]">
              <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Titular</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider hidden md:table-cell">CPF / CNPJ</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider hidden lg:table-cell">Tipo</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider hidden lg:table-cell">Obras</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider hidden lg:table-cell">Contratos</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Status</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Acao</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filtered.map(t => (
              <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-400 text-xs font-bold flex-shrink-0">
                      {t.nome_completo.split(' ').slice(0, 2).map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{t.nome_completo}</p>
                      <p className="text-xs text-white/40">{t.email ?? '—'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-sm text-white/60 font-mono">{t.cpf_cnpj}</span>
                  <span className="ml-2 text-xs text-white/30">{t.pessoa}</span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <Badge variant={TIPO_COLOR[t.tipo]}>{TIPO_LABEL[t.tipo]}</Badge>
                </td>
                <td className="px-4 py-3 text-center hidden lg:table-cell">
                  <div className="flex items-center justify-center gap-1 text-sm text-white/60">
                    <Music className="w-3.5 h-3.5" /><span>{t._obras}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center hidden lg:table-cell">
                  <div className="flex items-center justify-center gap-1 text-sm">
                    <FileText className="w-3.5 h-3.5" />
                    <span className={t._contratos === 0 ? 'text-amber-400' : 'text-white/60'}>{t._contratos}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={t.status === 'ativo' ? 'emerald' : 'rose'}>{t.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={'/master/titulares/' + t.id} className="text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium">Ver detalhes</Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-white/30 text-sm">Nenhum titular encontrado com os filtros atuais.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft, Pencil, Users, Music, FileText, CreditCard,
  MapPin, Phone, Briefcase, UserCircle2, Shield, History,
  CheckCircle2, AlertCircle, Clock, Building2, Hash
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MOCK_TITULARES, MOCK_EDITORAS, getTitularById } from '@/lib/mock-cadastros'
import {
  FUNCAO_LABEL, nomeTitular, cpfCnpjTitular, nomeArtistico, emailPrincipal
} from '@/lib/types-cadastros'

type Tab = 'dados' | 'funcoes' | 'pseudonimos' | 'endereco' | 'contatos' | 'bancario' | 'documentos' | 'historico'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dados', label: 'Dados', icon: <Users className="w-4 h-4" /> },
  { id: 'funcoes', label: 'Funcoes', icon: <Briefcase className="w-4 h-4" /> },
  { id: 'pseudonimos', label: 'Pseudonimos', icon: <UserCircle2 className="w-4 h-4" /> },
  { id: 'endereco', label: 'Endereco', icon: <MapPin className="w-4 h-4" /> },
  { id: 'contatos', label: 'Contatos', icon: <Phone className="w-4 h-4" /> },
  { id: 'bancario', label: 'Bancario', icon: <CreditCard className="w-4 h-4" /> },
  { id: 'documentos', label: 'Documentos', icon: <Shield className="w-4 h-4" /> },
  { id: 'historico', label: 'Historico', icon: <History className="w-4 h-4" /> },
]

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-white/[0.04] last:border-0">
      <span className="text-xs text-white/40 w-44 flex-shrink-0">{label}</span>
      <span className="text-sm text-white/80 text-right flex-1 min-w-0 break-words">{value || <span className="text-white/20">—</span>}</span>
    </div>
  )
}

const MOCK_CONTRATOS = [
  { id: 'c1', numero: 'TSM-2024-001', tipo: 'cessao', status: 'ativo', data_inicio: '2024-01-10', obras_vinculadas: 8 },
  { id: 'c2', numero: 'TSM-2024-015', tipo: 'administracao', status: 'em_analise', data_inicio: '2024-03-01', obras_vinculadas: 4 },
]

const MOCK_OBRAS = [
  { id: 'o1', titulo: 'Amo Noite e Dia', status: 'ativa', pct: 37.5 },
  { id: 'o2', titulo: 'Deixa eu Te Amar', status: 'ativa', pct: 50.0 },
  { id: 'o3', titulo: 'Saudade de Voce', status: 'validada', pct: 25.0 },
]

const MOCK_HISTORICO = [
  { data: '2024-05-10', descricao: 'Dados bancarios atualizados', usuario: 'Marina Lopes' },
  { data: '2024-03-01', descricao: 'Contrato TSM-2024-015 gerado', usuario: 'Marina Lopes' },
  { data: '2024-01-10', descricao: 'Titular cadastrado', usuario: 'Marina Lopes' },
]

export default function TitularDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('dados')

  const titular = getTitularById(id) ?? MOCK_TITULARES[0]
  const editora = MOCK_EDITORAS.find(e => e.id === titular.editora_id)
  const nome = nomeTitular(titular)
  const docNum = cpfCnpjTitular(titular)
  const pseudo = nomeArtistico(titular)

  const isPF = titular.tipo_pessoa === 'PF'

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => router.back()} className="mt-1 text-white/40 hover:text-white/70 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <PageHeader
            title={nome}
            description={[
              isPF ? 'Pessoa Fisica' : 'Pessoa Juridica',
              pseudo && pseudo !== nome ? pseudo : null,
              docNum ?? null,
            ].filter(Boolean).join(' · ')}
            actions={
              <div className="flex items-center gap-2">
                <Badge variant={titular.ativo ? 'emerald' : 'rose'}>{titular.ativo ? 'Ativo' : 'Inativo'}</Badge>
                <Button variant="ghost" size="sm">
                  <Pencil className="w-4 h-4" /> Editar
                </Button>
              </div>
            }
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-white/40 mb-1">Codigo Titular</p>
          <p className="text-base font-mono font-bold text-violet-400">{titular.codigo_titular}</p>
          <p className="text-xs text-white/20">{titular.id_interno}</p>
        </div>
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-white/40 mb-1">Obras no Catalogo</p>
          <p className="text-xl font-bold text-violet-400">{titular._obras ?? 0}</p>
        </div>
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-white/40 mb-1">Contratos</p>
          <p className={'text-xl font-bold ' + ((titular._contratos ?? 0) === 0 ? 'text-amber-400' : 'text-sky-400')}>{titular._contratos ?? 0}</p>
        </div>
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-white/40 mb-1">Editora</p>
          <p className="text-sm font-semibold text-emerald-400 truncate">{editora?.nome_fantasia ?? '—'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="flex border-b border-white/[0.06] overflow-x-auto">
          {TABS.map(t => (
            // Filtrar pseudonimos se PJ
            isPF || t.id !== 'pseudonimos' ? (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={'flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ' + (tab === t.id ? 'text-violet-300 border-violet-500' : 'text-white/40 border-transparent hover:text-white/70')}
              >
                {t.icon}{t.label}
              </button>
            ) : null
          ))}
        </div>

        <div className="p-6">
          {/* TAB: DADOS */}
          {tab === 'dados' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">Identificacao</h4>
                {isPF ? (<>
                  <InfoRow label="Nome completo" value={titular._pf?.nome_completo} />
                  <InfoRow label="CPF" value={<span className="font-mono">{titular._pf?.cpf}</span>} />
                  <InfoRow label="RG" value={titular._pf?.rg} />
                  <InfoRow label="Data de nascimento" value={titular._pf?.data_nasc ? new Date(titular._pf.data_nasc + 'T12:00:00').toLocaleDateString('pt-BR') : null} />
                  <InfoRow label="Nacionalidade" value={titular._pf?.nacionalidade} />
                  <InfoRow label="Estado civil" value={titular._pf?.estado_civil} />
                  <InfoRow label="Profissao" value={titular._pf?.profissao} />
                  <InfoRow label="Nome artistico" value={titular._pf?.nome_artistico_principal} />
                </>) : (<>
                  <InfoRow label="Razao social" value={titular._pj?.razao_social} />
                  <InfoRow label="Nome fantasia" value={titular._pj?.nome_fantasia} />
                  <InfoRow label="CNPJ" value={<span className="font-mono">{titular._pj?.cnpj}</span>} />
                  <InfoRow label="IE" value={titular._pj?.ie} />
                  <InfoRow label="IM" value={titular._pj?.im} />
                  <InfoRow label="Responsavel legal" value={titular._pj?.responsavel_legal} />
                  <InfoRow label="Site" value={titular._pj?.site} />
                </>)}
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">Arrecadacao</h4>
                <InfoRow label="Sociedade autoral" value={isPF ? titular._pf?.sociedade_autoral : titular._pj?.sociedade_autoral} />
                <InfoRow label="Codigo CAE" value={isPF ? titular._pf?.cae : titular._pj?.cae} />
                <InfoRow label="Codigo IPI" value={isPF ? titular._pf?.ipi : titular._pj?.ipi} />
                <InfoRow label="Codigo titular" value={<span className="font-mono text-violet-400">{titular.codigo_titular}</span>} />
                <InfoRow label="ID interno" value={<span className="font-mono text-xs text-white/30">{titular.id_interno}</span>} />
                {titular.observacoes && (
                  <>
                    <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3 mt-5">Observacoes</h4>
                    <p className="text-sm text-white/60 bg-white/[0.02] rounded-lg p-3">{titular.observacoes}</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB: FUNCOES */}
          {tab === 'funcoes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider">Funcoes cadastradas</h4>
                <Button variant="ghost" size="sm"><Briefcase className="w-3.5 h-3.5" /> Adicionar funcao</Button>
              </div>
              {(titular._funcoes ?? []).length === 0 ? (
                <div className="text-center py-8 text-white/20 text-sm">Nenhuma funcao cadastrada.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(titular._funcoes ?? []).map(f => (
                    <div key={f.id} className="flex items-center justify-between bg-white/[0.02] rounded-xl px-4 py-3 border border-white/[0.04]">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs bg-violet-600/20 text-violet-400 px-2 py-1 rounded">{f.funcao}</span>
                        <span className="text-sm text-white/70">{FUNCAO_LABEL[f.funcao]}</span>
                      </div>
                      <Badge variant={f.ativa ? 'emerald' : 'rose'}>{f.ativa ? 'Ativa' : 'Inativa'}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: PSEUDONIMOS */}
          {tab === 'pseudonimos' && isPF && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider">Pseudonimos artisticos</h4>
                <Button variant="ghost" size="sm"><UserCircle2 className="w-3.5 h-3.5" /> Adicionar pseudonimo</Button>
              </div>
              {(titular._pseudonimos ?? []).length === 0 ? (
                <div className="text-center py-8 text-white/20 text-sm">Nenhum pseudonimo cadastrado.</div>
              ) : (
                <div className="space-y-2">
                  {(titular._pseudonimos ?? []).map(p => (
                    <div key={p.id} className="flex items-center justify-between bg-white/[0.02] rounded-xl px-4 py-3 border border-white/[0.04]">
                      <div className="flex items-center gap-3">
                        <UserCircle2 className="w-4 h-4 text-violet-400" />
                        <span className="text-sm text-white/80 font-medium">{p.pseudonimo}</span>
                        {p.principal && <Badge variant="violet">Principal</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        {p.data_inicio && <span className="text-xs text-white/30">desde {new Date(p.data_inicio).toLocaleDateString('pt-BR')}</span>}
                        <Badge variant={p.ativo ? 'emerald' : 'rose'}>{p.ativo ? 'Ativo' : 'Inativo'}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: ENDERECO */}
          {tab === 'endereco' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider">Enderecos</h4>
                <Button variant="ghost" size="sm"><MapPin className="w-3.5 h-3.5" /> Adicionar endereco</Button>
              </div>
              {(titular._enderecos ?? []).length === 0 ? (
                <div className="text-center py-8 text-white/20 text-sm">Nenhum endereco cadastrado.</div>
              ) : (
                <div className="space-y-3">
                  {(titular._enderecos ?? []).map(e => (
                    <div key={e.id} className="bg-white/[0.02] rounded-xl px-5 py-4 border border-white/[0.04] space-y-1">
                      <div className="flex items-center gap-2 mb-2">
                        {e.principal && <Badge variant="violet">Principal</Badge>}
                        <span className="text-xs text-white/30">{e.pais}</span>
                      </div>
                      <p className="text-sm text-white/80">{[e.endereco, e.numero, e.compl].filter(Boolean).join(', ')}</p>
                      <p className="text-xs text-white/40">{[e.bairro, e.cidade, e.estado].filter(Boolean).join(' — ')}{e.cep ? ` · CEP ${e.cep}` : ''}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: CONTATOS */}
          {tab === 'contatos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider">Contatos</h4>
                <Button variant="ghost" size="sm"><Phone className="w-3.5 h-3.5" /> Adicionar contato</Button>
              </div>
              {(titular._contatos ?? []).length === 0 ? (
                <div className="text-center py-8 text-white/20 text-sm">Nenhum contato cadastrado.</div>
              ) : (
                <div className="space-y-2">
                  {(titular._contatos ?? []).map(c => (
                    <div key={c.id} className="flex items-center justify-between bg-white/[0.02] rounded-xl px-4 py-3 border border-white/[0.04]">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-white/30 uppercase w-16">{c.tipo}</span>
                        <span className="text-sm text-white/70">{c.valor}</span>
                        {c.principal && <Badge variant="violet">Principal</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: BANCARIO */}
          {tab === 'bancario' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider">Dados bancarios</h4>
                <Button variant="ghost" size="sm"><CreditCard className="w-3.5 h-3.5" /> Adicionar conta</Button>
              </div>
              {(titular._dados_bancarios ?? []).length === 0 ? (
                <div className="text-center py-8 text-white/20 text-sm">Nenhum dado bancario cadastrado.</div>
              ) : (
                <div className="space-y-3">
                  {(titular._dados_bancarios ?? []).map(b => (
                    <div key={b.id} className="bg-white/[0.02] rounded-xl px-5 py-4 border border-white/[0.04]">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-white/80">{b.banco}</span>
                        {b.principal && <Badge variant="violet">Principal</Badge>}
                      </div>
                      <InfoRow label="Tipo de conta" value={b.tipo_conta ?? '—'} />
                      <InfoRow label="Agencia" value={b.agencia} />
                      <InfoRow label="Conta" value={b.conta} />
                      <InfoRow label="Titular da conta" value={b.titular_conta} />
                      {b.pix_chave && <InfoRow label={'PIX (' + (b.pix_tipo ?? '') + ')'} value={<span className="font-mono text-violet-400">{b.pix_chave}</span>} />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: DOCUMENTOS */}
          {tab === 'documentos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider">Documentos</h4>
                <Button variant="ghost" size="sm"><Shield className="w-3.5 h-3.5" /> Adicionar documento</Button>
              </div>
              {(titular._documentos ?? []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-white/20">
                  <Shield className="w-10 h-10 mb-3" />
                  <p className="text-sm">Nenhum documento anexado.</p>
                  <p className="text-xs mt-1 text-white/10">Upload disponivel apos configuracao do Supabase Storage.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(titular._documentos ?? []).map(d => (
                    <div key={d.id} className="flex items-center justify-between bg-white/[0.02] rounded-xl px-4 py-3 border border-white/[0.04]">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-white/30" />
                        <div>
                          <p className="text-sm text-white/70">{d.tipo}</p>
                          {d.numero && <p className="text-xs text-white/30 font-mono">{d.numero}</p>}
                        </div>
                      </div>
                      {d.validade && <span className="text-xs text-white/30">val: {new Date(d.validade).toLocaleDateString('pt-BR')}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: HISTORICO */}
          {tab === 'historico' && (
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider">Historico de alteracoes</h4>
              <div className="space-y-2">
                {MOCK_HISTORICO.map((h, i) => (
                  <div key={i} className="flex items-center gap-4 py-2.5 border-b border-white/[0.04] last:border-0">
                    <span className="text-xs text-white/30 w-24 flex-shrink-0">{new Date(h.data).toLocaleDateString('pt-BR')}</span>
                    <span className="text-sm text-white/60 flex-1">{h.descricao}</span>
                    <span className="text-xs text-white/30">{h.usuario}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

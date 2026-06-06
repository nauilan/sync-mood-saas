'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ChevronLeft, Pencil, Users, FileText, CreditCard,
  MapPin, Phone, Briefcase, UserCircle2, Shield, History,
  Trash2, AlertTriangle, Loader2, Building2, Link2, Link2Off, Check, X
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { authFetch } from '@/lib/supabase/client'

type Tab = 'dados' | 'funcoes' | 'pseudonimos' | 'endereco' | 'contatos' | 'bancario' | 'documentos' | 'historico'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dados',       label: 'Dados',       icon: <Users        className="w-4 h-4" /> },
  { id: 'funcoes',     label: 'Funções',      icon: <Briefcase    className="w-4 h-4" /> },
  { id: 'pseudonimos', label: 'Pseudônimos',  icon: <UserCircle2  className="w-4 h-4" /> },
  { id: 'endereco',    label: 'Endereço',     icon: <MapPin       className="w-4 h-4" /> },
  { id: 'contatos',    label: 'Contatos',     icon: <Phone        className="w-4 h-4" /> },
  { id: 'bancario',    label: 'Bancário',     icon: <CreditCard   className="w-4 h-4" /> },
  { id: 'documentos',  label: 'Documentos',   icon: <Shield       className="w-4 h-4" /> },
  { id: 'historico',   label: 'Histórico',    icon: <History      className="w-4 h-4" /> },
]

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-white/[0.04] last:border-0">
      <span className="text-xs text-white/40 w-44 flex-shrink-0">{label}</span>
      <span className="text-sm text-white/80 text-right flex-1 min-w-0 break-words">
        {value ?? <span className="text-white/20">—</span>}
      </span>
    </div>
  )
}

interface EditoraOpcao { id: string; nome_fantasia: string; razao_social: string }

export default function TitularDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [tab, setTab]           = useState<Tab>('dados')
  const [titular, setTitular]   = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [erro, setErro]         = useState<string | null>(null)

  // Modal exclusão
  const [confirmDelete, setConfirmDelete]   = useState(false)
  const [deleting, setDeleting]             = useState(false)
  const [deleteError, setDeleteError]       = useState<{ msg: string; vinculos?: string[] } | null>(null)

  // Editora vinculada
  const [editoras, setEditoras]                 = useState<EditoraOpcao[]>([])
  const [showVincular, setShowVincular]         = useState(false)
  const [vinculandoId, setVinculandoId]         = useState('')
  const [salvandoVinculo, setSalvandoVinculo]   = useState(false)
  const [vinculoMsg, setVinculoMsg]             = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const res = await fetch(`/api/titulares/${id}`, { credentials: 'include' })
      if (res.status === 404) { setNotFound(true); return }
      if (!res.ok) { setErro('Erro ao carregar titular.'); return }
      const json = await res.json()
      setTitular(json.data)
      setVinculandoId(json.data?.editora_vinculada_id ?? '')
    } catch {
      setErro('Falha de conexão ao carregar titular.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { carregar() }, [carregar])

  // Carrega editoras quando titular for do tipo editora
  useEffect(() => {
    if (titular?.tipo !== 'editora') return
    authFetch('/api/editoras?status=todos')
      .then(r => r.json())
      .then(d => setEditoras((d.editoras ?? []).map((e: any) => ({ id: e.id, nome_fantasia: e.nome_fantasia, razao_social: e.razao_social }))))
      .catch(() => { /* silencioso */ })
  }, [titular?.tipo])

  async function excluir() {
    setDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch(`/api/titulares/${id}`, { method: 'DELETE', credentials: 'include' })
      const json = await res.json()
      if (!res.ok) {
        setDeleteError({ msg: json.error, vinculos: json.vinculos })
        return
      }
      router.push('/master/titulares')
    } catch {
      setDeleteError({ msg: 'Falha de conexão ao excluir.' })
    } finally {
      setDeleting(false)
    }
  }

  async function salvarVinculo() {
    setSalvandoVinculo(true)
    setVinculoMsg(null)
    try {
      const res = await authFetch(`/api/titulares/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ editora_vinculada_id: vinculandoId || null }),
        credentials: 'include',
      })
      const json = await res.json()
      if (!res.ok) { setVinculoMsg('Erro: ' + (json.error ?? 'Falha ao salvar')); return }
      setTitular((prev: any) => ({ ...prev, editora_vinculada_id: vinculandoId || null }))
      setShowVincular(false)
      setVinculoMsg(null)
    } catch {
      setVinculoMsg('Falha de conexão.')
    } finally {
      setSalvandoVinculo(false)
    }
  }

  // ── Estados de loading / erro / não encontrado ──────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] gap-3 text-white/40">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Carregando titular...</span>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-white/40">
        <Users className="w-12 h-12 opacity-30" />
        <p className="text-base font-medium">Titular não encontrado</p>
        <p className="text-sm text-white/20">O ID informado não existe ou foi excluído.</p>
        <Button variant="ghost" size="sm" onClick={() => router.push('/master/titulares')}>
          <ChevronLeft className="w-4 h-4" /> Voltar para titulares
        </Button>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-rose-400">
        <AlertTriangle className="w-10 h-10" />
        <p className="text-sm">{erro}</p>
        <Button variant="ghost" size="sm" onClick={carregar}>Tentar novamente</Button>
      </div>
    )
  }

  if (!titular) return null

  const isPF    = (titular.pessoa ?? titular.tipo_pessoa) === 'PF'
  const isEditora = titular.tipo === 'editora'
  const nome    = titular.nome_completo ?? '—'
  const status  = titular.status ?? 'ativo'
  const editoraVinculada = editoras.find(e => e.id === titular.editora_vinculada_id)

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
              isPF ? 'Pessoa Física' : 'Pessoa Jurídica',
              titular.nome_artistico ?? null,
              titular.cpf_cnpj ?? null,
            ].filter(Boolean).join(' · ')}
            actions={
              <div className="flex items-center gap-2">
                <Badge variant={status === 'ativo' ? 'emerald' : 'rose'}>
                  {status === 'ativo' ? 'Ativo' : 'Inativo'}
                </Badge>
                {isEditora && <Badge variant="violet">Editora</Badge>}
                <Button variant="ghost" size="sm">
                  <Pencil className="w-4 h-4" /> Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                  onClick={() => { setConfirmDelete(true); setDeleteError(null) }}
                >
                  <Trash2 className="w-4 h-4" /> Excluir
                </Button>
              </div>
            }
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-white/40 mb-1">Código Titular</p>
          <p className="text-base font-mono font-bold text-violet-400">{titular.codigo_titular}</p>
        </div>
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-white/40 mb-1">Tipo</p>
          <p className="text-sm font-semibold text-sky-400 capitalize">{titular.tipo ?? '—'}</p>
        </div>
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-white/40 mb-1">CAE</p>
          <p className="text-sm font-mono text-white/70">{titular.codigo_cae ?? '—'}</p>
        </div>
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-white/40 mb-1">IPI</p>
          <p className="text-sm font-mono text-white/70">{titular.codigo_ipi ?? titular.ipi ?? '—'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="flex border-b border-white/[0.06] overflow-x-auto">
          {TABS.map(t =>
            (isPF || t.id !== 'pseudonimos') ? (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={'flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ' +
                  (tab === t.id ? 'text-violet-300 border-violet-500' : 'text-white/40 border-transparent hover:text-white/70')}
              >
                {t.icon}{t.label}
              </button>
            ) : null
          )}
        </div>

        <div className="p-6">
          {tab === 'dados' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">Identificação</h4>
                  <InfoRow label="Nome completo"    value={titular.nome_completo} />
                  <InfoRow label="Nome artístico"   value={titular.nome_artistico} />
                  <InfoRow label={isPF ? 'CPF' : 'CNPJ'} value={<span className="font-mono">{titular.cpf_cnpj}</span>} />
                  <InfoRow label="Nacionalidade"    value={titular.nacionalidade} />
                  <InfoRow label="Sociedade autoral" value={titular.sociedade_autoral} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">Arrecadação</h4>
                  <InfoRow label="Código CAE"     value={titular.codigo_cae} />
                  <InfoRow label="Código IPI"     value={titular.codigo_ipi ?? titular.ipi} />
                  <InfoRow label="Código titular" value={<span className="font-mono text-violet-400">{titular.codigo_titular}</span>} />
                  <InfoRow label="Cadastrado em"  value={titular.created_at ? new Date(titular.created_at).toLocaleDateString('pt-BR') : null} />
                  {titular.observacoes && (
                    <>
                      <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3 mt-5">Observações</h4>
                      <p className="text-sm text-white/60 bg-white/[0.02] rounded-lg p-3">{titular.observacoes}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Editora Vinculada — visível apenas quando tipo === 'editora' */}
              {isEditora && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-violet-400/60" />
                      <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider">Editora Vinculada</h4>
                    </div>
                    {!showVincular && (
                      <button
                        onClick={() => { setShowVincular(true); setVinculoMsg(null) }}
                        className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 bg-violet-500/10 hover:bg-violet-500/15 border border-violet-500/20 rounded-lg px-3 py-1.5 transition-colors"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        {titular.editora_vinculada_id ? 'Alterar vínculo' : 'Vincular editora'}
                      </button>
                    )}
                  </div>

                  {!showVincular && (
                    titular.editora_vinculada_id ? (
                      <div className="flex items-center gap-3 bg-violet-500/5 border border-violet-500/15 rounded-xl px-4 py-3">
                        <Building2 className="w-4 h-4 text-violet-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white/80">
                            {editoraVinculada?.nome_fantasia ?? 'Editora vinculada'}
                          </p>
                          {editoraVinculada?.razao_social && (
                            <p className="text-xs text-white/40">{editoraVinculada.razao_social}</p>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setVinculandoId('')
                            setShowVincular(true)
                            setVinculoMsg(null)
                          }}
                          className="text-white/20 hover:text-rose-400 transition-colors"
                          title="Remover vínculo"
                        >
                          <Link2Off className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-white/20 bg-white/[0.02] rounded-xl px-4 py-3 border border-white/[0.04]">
                        Nenhuma editora vinculada. Este titular do tipo editora ainda não foi associado a um cadastro oficial de editora.
                      </p>
                    )
                  )}

                  {showVincular && (
                    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 space-y-3">
                      <p className="text-xs text-white/40">
                        Selecione a editora que corresponde a este titular. O vínculo permite que o sistema use os dados CWR/CAE/IPI do cadastro oficial de editoras.
                      </p>
                      <select
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                        value={vinculandoId}
                        onChange={e => setVinculandoId(e.target.value)}
                      >
                        <option value="">— Sem vínculo —</option>
                        {editoras.map(e => (
                          <option key={e.id} value={e.id}>{e.nome_fantasia} — {e.razao_social}</option>
                        ))}
                      </select>
                      {vinculoMsg && (
                        <p className="text-xs text-rose-400">{vinculoMsg}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setShowVincular(false); setVinculoMsg(null); setVinculandoId(titular.editora_vinculada_id ?? '') }}
                          className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/70 px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
                          disabled={salvandoVinculo}
                        >
                          <X className="w-3.5 h-3.5" /> Cancelar
                        </button>
                        <button
                          onClick={salvarVinculo}
                          disabled={salvandoVinculo}
                          className="flex items-center gap-1.5 text-xs bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors"
                        >
                          {salvandoVinculo
                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Salvando...</>
                            : <><Check className="w-3.5 h-3.5" /> Salvar vínculo</>
                          }
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {tab !== 'dados' && (
            <div className="flex flex-col items-center justify-center py-12 text-white/20 gap-2">
              <FileText className="w-8 h-8" />
              <p className="text-sm">Seção em construção — dados serão exibidos em breve.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmação de exclusão */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0d1526] border border-white/[0.08] rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/10 rounded-lg">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <p className="font-semibold text-white">Excluir titular</p>
                <p className="text-sm text-white/40">Esta ação não pode ser desfeita facilmente.</p>
              </div>
            </div>

            <p className="text-sm text-white/60">
              Você está prestes a excluir <span className="text-white font-medium">{nome}</span> ({titular.codigo_titular}).
              O titular será desativado e não aparecerá mais nas listagens.
            </p>

            {deleteError && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 space-y-2">
                <p className="text-sm font-medium text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> {deleteError.msg}
                </p>
                {deleteError.vinculos && deleteError.vinculos.length > 0 && (
                  <ul className="text-xs text-rose-300/70 space-y-1 pl-6 list-disc">
                    {deleteError.vinculos.map((v, i) => <li key={i}>{v}</li>)}
                  </ul>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => { setConfirmDelete(false); setDeleteError(null) }}
                disabled={deleting}
              >
                Cancelar
              </Button>
              <Button
                variant="ghost"
                className="flex-1 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20"
                onClick={excluir}
                disabled={deleting}
              >
                {deleting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Excluindo...</>
                  : <><Trash2 className="w-4 h-4" /> Confirmar exclusão</>
                }
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

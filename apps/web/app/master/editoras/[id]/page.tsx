'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Building2, Users, Music, FileText, Pencil } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { KpiCard } from '@/components/ui/kpi-card'
import { MOCK_EDITORAS, MOCK_TITULARES } from '@/lib/mock-cadastros'
import { nomeTitular, cpfCnpjTitular } from '@/lib/types-cadastros'

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-white/[0.04] last:border-0">
      <span className="text-xs text-white/40 w-44 flex-shrink-0">{label}</span>
      <span className="text-sm text-white/70 text-right flex-1">{value || <span className="text-white/20">—</span>}</span>
    </div>
  )
}

export default function EditoraDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const editora = MOCK_EDITORAS.find(e => e.id === id) ?? MOCK_EDITORAS[0]
  const administradora = MOCK_EDITORAS.find(e => e.id === editora.administradora_id)
  const titulares = MOCK_TITULARES.filter(t => t.editora_id === editora.id)

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <button onClick={() => router.back()} className="mt-1 text-white/40 hover:text-white/70 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <PageHeader
            title={editora.nome_fantasia}
            description={editora.razao_social}
            actions={
              <div className="flex items-center gap-2">
                <Badge variant={editora.ativa ? 'emerald' : 'rose'}>{editora.ativa ? 'Ativa' : 'Inativa'}</Badge>
                {editora.administradora_id === null && <Badge variant="violet">Administradora</Badge>}
                <Button variant="ghost" size="sm"><Pencil className="w-4 h-4" /> Editar</Button>
              </div>
            }
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard title="Titulares" value={editora._titulares ?? 0} accent="violet" icon={<Users className="w-4 h-4 text-violet-400" />} />
        <KpiCard title="Obras no Catalogo" value={editora._obras ?? 0} accent="emerald" icon={<Music className="w-4 h-4 text-emerald-400" />} />
        <KpiCard title="Contratos Vigentes" value={editora._contratos ?? 0} accent="sky" icon={<FileText className="w-4 h-4 text-sky-400" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dados da editora */}
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">Dados Cadastrais</h3>
          <InfoRow label="Razao Social" value={editora.razao_social} />
          <InfoRow label="Nome Fantasia" value={editora.nome_fantasia} />
          <InfoRow label="CNPJ" value={editora.cnpj} />
          <InfoRow label="Codigo" value={editora.codigo} />
          <InfoRow label="Administradora" value={administradora?.nome_fantasia ?? (editora.administradora_id === null ? 'E a administradora' : '—')} />
          <InfoRow label="Cadastrado em" value={new Date(editora.created_at).toLocaleDateString('pt-BR')} />
        </div>

        {/* Titulares vinculados */}
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider">Titulares ({titulares.length})</h3>
            <Link href="/master/titulares" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">Ver todos</Link>
          </div>
          {titulares.length === 0 ? (
            <div className="text-center py-8 text-white/20 text-sm">Nenhum titular nesta editora.</div>
          ) : (
            <div className="space-y-2">
              {titulares.slice(0, 8).map(t => {
                const nome = nomeTitular(t)
                const doc = cpfCnpjTitular(t)
                const funcoes = (t._funcoes ?? []).map(f => f.funcao).join(', ')
                return (
                  <Link key={t.id} href={`/master/titulares/${t.id}`}>
                    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className={'w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ' + (t.tipo_pessoa === 'PF' ? 'bg-violet-600/20 text-violet-400' : 'bg-emerald-600/20 text-emerald-400')}>
                          {nome[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-white/80">{nome}</p>
                          {funcoes && <p className="text-[10px] text-white/30">{funcoes}</p>}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-white/25">{doc}</span>
                    </div>
                  </Link>
                )
              })}
              {titulares.length > 8 && (
                <Link href="/master/titulares" className="block text-center py-2 text-xs text-violet-400/60 hover:text-violet-400 transition-colors">
                  + {titulares.length - 8} mais...
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

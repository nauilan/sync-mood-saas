'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { KpiCard } from '@/components/ui/kpi-card'
import { BI_TITULARES } from '@/lib/mock-bi'
import { Users, Download } from 'lucide-react'

const UNIVERSAL_FILTERS = ['Período', 'Obra', 'Titular', 'Editora', 'Fonte', 'Sociedade', 'Status', 'Tipo Direito', 'Território', 'Moeda', 'Usuário']

const SUBS = [
  { id: 'autores', label: 'Autores', count: BI_TITULARES.total_autores },
  { id: 'editoras', label: 'Editoras', count: BI_TITULARES.total_editoras },
  { id: 'cessionarios', label: 'Cessionários', count: BI_TITULARES.total_cessionarios },
  { id: 'ativos', label: 'Ativos', count: BI_TITULARES.total_ativos },
  { id: 'pendentes', label: 'Pendentes', count: BI_TITULARES.total_pendentes },
  { id: 'sem_dados_bancarios', label: 'Sem Dados Bancários', count: BI_TITULARES.total_sem_banco },
  { id: 'sem_cpf_cnpj', label: 'Sem CPF/CNPJ', count: BI_TITULARES.total_sem_cpf_cnpj },
  { id: 'sem_cae_ipi', label: 'Sem CAE/IPI', count: BI_TITULARES.total_sem_cae_ipi },
  { id: 'pseudonimo_duplicado', label: 'Pseudônimo Duplicado', count: BI_TITULARES.total_pseudonimo_duplicado },
  { id: 'com_contratos_ativos', label: 'Com Contratos Ativos', count: BI_TITULARES.total_com_contrato_ativo },
]

const TIPO_MAP: Record<string, string> = {
  autores: 'Autor',
  editoras: 'Editora',
  cessionarios: 'Cessionário',
  ativos: 'Autor',
  pendentes: 'Autor',
  sem_dados_bancarios: 'Autor',
  sem_cpf_cnpj: 'Autor',
  sem_cae_ipi: 'Autor',
  pseudonimo_duplicado: 'Autor',
  com_contratos_ativos: 'Autor',
}

export default function RelTitularesPage() {
  const [sub, setSub] = useState('autores')
  const [exportModal, setExportModal] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  function handleExport(fmt: string) {
    setExportModal(fmt)
    setExporting(true)
    setTimeout(() => setExporting(false), 1500)
  }

  const activeSub = SUBS.find(s => s.id === sub)!

  function getStatusBadge(subId: string) {
    if (subId === 'ativos' || subId === 'com_contratos_ativos') return 'bg-emerald-500/10 text-emerald-400'
    if (subId === 'pendentes') return 'bg-amber-500/10 text-amber-400'
    if (subId === 'sem_dados_bancarios' || subId === 'sem_cpf_cnpj' || subId === 'sem_cae_ipi') return 'bg-rose-500/10 text-rose-400'
    if (subId === 'pseudonimo_duplicado') return 'bg-orange-500/10 text-orange-400'
    return 'bg-emerald-500/10 text-emerald-400'
  }

  function getStatusLabel(subId: string) {
    if (subId === 'ativos' || subId === 'com_contratos_ativos') return 'ativo'
    if (subId === 'pendentes') return 'pendente'
    if (subId === 'sem_dados_bancarios') return 'sem banco'
    if (subId === 'sem_cpf_cnpj') return 'sem CPF/CNPJ'
    if (subId === 'sem_cae_ipi') return 'sem CAE'
    if (subId === 'pseudonimo_duplicado') return 'duplicado'
    return 'ativo'
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Relatório de Titulares" description="Autores, editoras e cessionários do sistema." />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard title="Total Titulares" value={String(BI_TITULARES.total)} accent="emerald" subtitle="cadastrados" icon={<Users className="w-4 h-4 text-emerald-400" />} />
        <KpiCard title="Autores" value={String(BI_TITULARES.total_autores)} accent="violet" subtitle="compositors" icon={<Users className="w-4 h-4 text-violet-400" />} />
        <KpiCard title="Sem Dados Bancários" value={String(BI_TITULARES.total_sem_banco)} accent="amber" subtitle="aguardando dados" icon={<Users className="w-4 h-4 text-amber-400" />} />
        <KpiCard title="Pendentes" value={String(BI_TITULARES.total_pendentes)} accent="rose" subtitle="em análise" icon={<Users className="w-4 h-4 text-rose-400" />} />
      </div>

      {/* Filtros universais */}
      <div className="flex flex-wrap gap-2">
        {UNIVERSAL_FILTERS.map(f => (
          <select key={f} className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-white/50 focus:outline-none">
            <option>{f}: Todos</option>
          </select>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {SUBS.map(s => (
          <button
            key={s.id}
            onClick={() => setSub(s.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${sub === s.id ? 'bg-emerald-600 text-white' : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08]'}`}
          >
            {s.label} <span className="ml-1 opacity-60">({s.count})</span>
          </button>
        ))}
      </div>

      {/* Export buttons */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/40">{activeSub.count} registro(s) — {activeSub.label}</p>
        <div className="flex gap-2">
          {(['PDF', 'Excel', 'CSV'] as const).map(fmt => (
            <button
              key={fmt}
              onClick={() => handleExport(fmt)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white/60 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-300 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              {fmt}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.02]">
              <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Código</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Nome</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Tipo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Editora</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">CPF/CNPJ</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: Math.min(activeSub.count, 8) }, (_, i) => (
              <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white/40 font-mono text-xs">TIT-{String(i + 1).padStart(3, '0')}</td>
                <td className="px-4 py-3 text-white/70">Titular Demo {i + 1}</td>
                <td className="px-4 py-3 text-white/50">{TIPO_MAP[sub]}</td>
                <td className="px-4 py-3 text-white/50">Top Show Music</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-md ${getStatusBadge(sub)}`}>
                    {getStatusLabel(sub)}
                  </span>
                </td>
                <td className="px-4 py-3 text-white/40 font-mono text-xs">
                  {sub === 'sem_cpf_cnpj' ? '—' : `${String(i + 1).padStart(3, '0')}.456.789-00`}
                </td>
              </tr>
            ))}
            {activeSub.count === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-white/30 text-sm">
                  <Users className="w-8 h-8 text-white/15 mx-auto mb-2" />
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Export modal */}
      {exportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#12111e] border border-white/[0.08] rounded-2xl p-6 w-80 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
              <Download className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-white font-semibold">Exportação {exportModal}</p>
              {exporting ? (
                <p className="text-white/40 text-sm mt-1">Gerando arquivo...</p>
              ) : (
                <p className="text-emerald-400 text-sm mt-1">Arquivo gerado com sucesso!</p>
              )}
            </div>
            {!exporting && (
              <button
                onClick={() => setExportModal(null)}
                className="w-full py-2 rounded-xl bg-emerald-600 text-white text-sm hover:bg-emerald-700 transition-colors"
              >
                Fechar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

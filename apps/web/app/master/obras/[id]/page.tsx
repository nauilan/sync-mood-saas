import { PageHeader } from '@/components/ui/page-header'
import { Eye, FileText, AlignLeft, Paperclip, Edit, CheckCircle2 } from 'lucide-react'
import { STATUS_OBRA_LABELS, STATUS_OBRA_COLORS, FUNCAO_LINK_COLORS } from '@/lib/types-obras'
import type { FuncaoLink, StatusObra, ObraIntegrante } from '@/lib/types-obras'

export const metadata = { title: 'Detalhes da Obra | Sync Mood' }

const MOCK_OBRA = {
  id: '2', codigo_obra: 'OBR-002',
  titulo: 'EXEMPLO DE OBRA - VER PRINTS',
  subtitulo: null as string | null, titulo_alternativo: null as string | null,
  idioma: 'Portugues', status: 'ativa' as StatusObra,
  status_iswc: 'recebido', iswc: 'T-987654321-0',
  origem_cadastro: 'contrato_sistema',
  observacoes: 'Obra com administracao parcial — Link 1 administrado, Links 2 e 3 diretos.',
  controle_exec_publica: 3.75, controle_fonomecanico: 30.0, controle_sincronizacao: 30.0,
}

const MOCK_INTEGRANTES: ObraIntegrante[] = [
  { obra_id:'2', numero_link:1, tipo_link:'editora_administrada', percentual_link:26.25,
    nome_participante:'ALEX STELA', ipi:'2780022', funcao_no_link:'CA',
    percentual_exec_publica:22.50, percentual_fonomecanico:0.00, percentual_sincronizacao:0.00,
    status_controle:'controlado', pais:'BR' },
  { obra_id:'2', numero_link:1, tipo_link:'editora_administrada', percentual_link:26.25,
    nome_participante:'P3 EDITORA MUSICAL LTDA - ME', ipi:'8961236', funcao_no_link:'E',
    percentual_exec_publica:3.75, percentual_fonomecanico:0.00, percentual_sincronizacao:0.00,
    status_controle:'controlado', pais:'BR' },
  { obra_id:'2', numero_link:1, tipo_link:'editora_administrada', percentual_link:26.25,
    nome_participante:'TOP SHOW MUSIC LIMITADA - ME', ipi:'2646326', funcao_no_link:'AM',
    percentual_exec_publica:3.75, percentual_fonomecanico:30.00, percentual_sincronizacao:30.00,
    status_controle:'controlado', pais:'BR' },
  { obra_id:'2', numero_link:2, tipo_link:'direto_sem_editora', percentual_link:50,
    nome_participante:'RENEE FERNANDES CORDEIRO', ipi:'970754', funcao_no_link:'CA',
    percentual_exec_publica:50.00, percentual_fonomecanico:50.00, percentual_sincronizacao:50.00,
    status_controle:'nao_controlado', pais:'BR' },
  { obra_id:'2', numero_link:3, tipo_link:'direto_sem_editora', percentual_link:20,
    nome_participante:'EDUARDO MUNIZ DE ARAUJO', ipi:'8153005', funcao_no_link:'CA',
    percentual_exec_publica:20.00, percentual_fonomecanico:20.00, percentual_sincronizacao:20.00,
    status_controle:'nao_controlado', pais:'BR' },
]

const LINK_BG = ['bg-violet-600','bg-slate-600','bg-slate-700','bg-slate-700','bg-slate-700']

function LinkCircle({ n }: { n: number }) {
  return (
    <span className={'inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0 text-white ' + (LINK_BG[n-1] ?? LINK_BG[4])}>
      {n}
    </span>
  )
}

function FuncaoBadge({ f }: { f: FuncaoLink }) {
  return (
    <span className={'inline-flex items-center justify-center w-7 h-6 rounded text-[11px] font-bold ' + FUNCAO_LINK_COLORS[f]}>
      {f}
    </span>
  )
}

function PctCell({ v, color }: { v: number; color: string }) {
  return (
    <span className={'text-sm font-semibold tabular-nums ' + (v === 0 ? 'text-white/25' : color)}>
      {v.toFixed(2).replace('.', ',')}%
    </span>
  )
}

function CtrlBadge({ label, value, bg, text }: { label: string; value: number; bg: string; text: string }) {
  return (
    <div className={'flex flex-col items-center justify-center px-4 py-2 rounded-lg min-w-[160px] border ' + bg}>
      <span className={'text-[10px] font-semibold uppercase tracking-wide ' + text}>{label}</span>
      <span className={'text-lg font-bold ' + text}>{value.toFixed(3).replace('.', ',')} %</span>
    </div>
  )
}

export default function ObraDetailPage({ params }: { params: { id: string } }) {
  const obra = MOCK_OBRA
  const integrantes = MOCK_INTEGRANTES
  const linkNumbers = [...new Set(integrantes.map(i => i.numero_link))].sort((a, b) => a - b)
  const sumExec = integrantes.reduce((s, i) => s + i.percentual_exec_publica, 0)
  const sumFono = integrantes.reduce((s, i) => s + i.percentual_fonomecanico, 0)
  const sumSync = integrantes.reduce((s, i) => s + i.percentual_sincronizacao, 0)

  return (
    <div className="space-y-5">
      <PageHeader
        title={obra.titulo}
        description={'Codigo: ' + obra.codigo_obra + (obra.iswc ? '  |  ISWC: ' + obra.iswc : '')}
        actions={
          <div className="flex items-center gap-2">
            <a href="/master/obras" className="h-8 px-3 rounded-lg bg-white/5 border border-white/[0.06] text-xs text-white/60 hover:text-white/80 transition-colors flex items-center">
              Voltar
            </a>
            <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs text-white font-semibold transition-colors">
              <Edit className="w-3.5 h-3.5" /> Editar
            </button>
          </div>
        }
      />

      {/* Status + controles */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className={'text-xs font-semibold px-2.5 py-1 rounded-full ' + STATUS_OBRA_COLORS[obra.status]}>
            {STATUS_OBRA_LABELS[obra.status]}
          </span>
          <span className="text-xs text-white/30">|</span>
          <span className="text-xs text-white/40">Origem: {obra.origem_cadastro.replace(/_/g, ' ')}</span>
          <span className="text-xs text-white/30">|</span>
          <span className={'text-xs font-semibold ' + (obra.status_iswc === 'recebido' ? 'text-emerald-400' : 'text-amber-400')}>
            ISWC: {obra.status_iswc === 'recebido' ? obra.iswc : 'Pendente'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <CtrlBadge label="Controle execucao publica" value={obra.controle_exec_publica}
            bg="bg-cyan-500/10 border-cyan-500/20" text="text-cyan-400" />
          <CtrlBadge label="Controle fonomecanico" value={obra.controle_fonomecanico}
            bg="bg-emerald-500/10 border-emerald-500/20" text="text-emerald-400" />
          <CtrlBadge label="Controle sincronizacao" value={obra.controle_sincronizacao}
            bg="bg-amber-500/10 border-amber-500/20" text="text-amber-400" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button className="flex items-center gap-2 h-9 px-5 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm font-bold text-white transition-colors">
          <AlignLeft className="w-4 h-4" /> EXIBIR LETRA
        </button>
        <button className="flex items-center gap-2 h-9 px-5 rounded-lg bg-violet-700/60 hover:bg-violet-700 text-sm font-bold text-white transition-colors">
          <FileText className="w-4 h-4" /> OBSERVACOES
        </button>
        <div className="flex items-center gap-2 h-9 px-4 rounded-lg bg-white/5 border border-white/[0.06] text-xs text-white/40">
          <Paperclip className="w-3.5 h-3.5" /> Arquivos recebidos
        </div>
      </div>

      {/* Integrantes da Obra table */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold text-white">Integrantes da Obra</h2>
          <div className="flex items-center gap-2 text-xs text-white/40">
            Visao Padrao
            <div className="w-8 h-4 rounded-full bg-violet-600 relative">
              <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/[0.04]">
                <th className="w-10 px-4 py-2.5" />
                <th className="w-10 px-2 py-2.5" />
                <th className="text-left text-xs font-semibold text-white/40 px-3 py-2.5 min-w-[200px]">Participante</th>
                <th className="text-center text-xs font-semibold text-white/40 px-3 py-2.5">IPI</th>
                <th className="text-center text-xs font-semibold text-white/40 px-3 py-2.5">Fn</th>
                <th className="text-center text-xs font-semibold text-cyan-500/80 px-4 py-2.5">Exec. Publica</th>
                <th className="text-center text-xs font-semibold text-emerald-500/80 px-4 py-2.5">Fonomecanico</th>
                <th className="text-center text-xs font-semibold text-amber-500/80 px-4 py-2.5">Sincronizacao</th>
                <th className="w-24 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {linkNumbers.map(linkNum => {
                const rows = integrantes.filter(i => i.numero_link === linkNum)
                return rows.map((row, rowIdx) => (
                  <tr
                    key={row.nome_participante + String(linkNum)}
                    className={'border-b border-white/[0.03] transition-colors ' +
                      (row.status_controle === 'nao_controlado' ? 'opacity-60 hover:opacity-90' : 'hover:bg-white/[0.02]')}
                  >
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-5 rounded text-[9px] font-bold bg-blue-700/30 text-blue-400 border border-blue-700/20">
                        {row.pais ?? 'BR'}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-center">
                      {rowIdx === 0 ? <LinkCircle n={linkNum} /> : <span className="inline-block w-5" />}
                    </td>
                    <td className="px-3 py-3">
                      <span className={'text-sm ' + (row.status_controle === 'nao_controlado' ? 'text-white/50' : 'text-white/80 font-medium')}>
                        {row.nome_participante}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={'text-xs font-mono ' + (row.status_controle === 'nao_controlado' ? 'text-white/30' : 'text-violet-400')}>
                        {row.ipi ?? '—'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <FuncaoBadge f={row.funcao_no_link} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <PctCell v={row.percentual_exec_publica} color="text-cyan-400" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <PctCell v={row.percentual_fonomecanico} color="text-emerald-400" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <PctCell v={row.percentual_sincronizacao} color="text-amber-400" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors ml-auto">
                        <Eye className="w-3.5 h-3.5" /> Visualizar
                      </button>
                    </td>
                  </tr>
                ))
              })}
            </tbody>
            <tfoot className="border-t border-white/[0.06] bg-white/[0.02]">
              <tr>
                <td colSpan={5} className="px-5 py-3">
                  <span className="text-xs font-semibold text-white/40">TOTAIS</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={'text-sm font-bold tabular-nums ' + (sumExec === 100 ? 'text-cyan-400' : 'text-rose-400')}>
                    {sumExec.toFixed(2).replace('.', ',')}%
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={'text-sm font-bold tabular-nums ' + (sumFono === 100 ? 'text-emerald-400' : 'text-rose-400')}>
                    {sumFono.toFixed(2).replace('.', ',')}%
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={'text-sm font-bold tabular-nums ' + (sumSync === 100 ? 'text-amber-400' : 'text-rose-400')}>
                    {sumSync.toFixed(2).replace('.', ',')}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {sumExec === 100 && sumFono === 100 && sumSync === 100 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto" />
                  ) : (
                    <span className="text-xs text-rose-400">Verificar</span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Dados complementares */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5">
        <details>
          <summary className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-white/60 hover:text-white/80 transition-colors list-none select-none">
            <span className="text-white/30">v</span> DADOS COMPLEMENTARES
          </summary>
          <div className="mt-4 grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Idioma', value: obra.idioma ?? '—' },
              { label: 'Titulo Alternativo', value: obra.titulo_alternativo ?? '—' },
              { label: 'Subtitulo', value: obra.subtitulo ?? '—' },
              { label: 'Origem', value: obra.origem_cadastro.replace(/_/g, ' ') },
              { label: 'Status ISWC', value: obra.status_iswc },
            ].map(f => (
              <div key={f.label}>
                <p className="text-xs text-white/30 mb-0.5">{f.label}</p>
                <p className="text-sm text-white/70">{f.value}</p>
              </div>
            ))}
          </div>
          {obra.observacoes && (
            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <p className="text-xs text-white/30 mb-1">Observacoes</p>
              <p className="text-sm text-white/60 leading-relaxed">{obra.observacoes}</p>
            </div>
          )}
        </details>
      </div>
    </div>
  )
}
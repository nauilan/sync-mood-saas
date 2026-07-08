'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { authFetch } from '@/lib/supabase/client'
import { ChevronLeft, Printer, Download, Music2 } from 'lucide-react'

interface TitularRow {
  id: string
  papel: string
  percentual: number
  pct_comunicacao_publico: number
  percentual_exec_publica: number
  controlado: boolean
  titular_id: string
  titulares: {
    id: string
    codigo_titular: string
    tipo: string
    pessoa: string
    nome_completo: string
    nome_artistico: string | null
    cpf_cnpj: string | null
    sociedade_autoral: string | null
  }
}

interface Obra {
  id: string
  titulo: string
  codigo_obra: string
  iswc: string | null
}

const PAPEL_LABELS: Record<string, string> = {
  compositor: 'Compositor / Autor',
  autor: 'Autor',
  adaptador: 'Adaptador',
  versionista: 'Versionista',
  editora_original: 'Editora Original',
  editora_adm: 'Editora Administradora',
  sub_editora: 'Sub-Editora',
  co_titular: 'Co-Titular',
}

const PAPEIS_AUTOR  = new Set(['compositor', 'autor', 'adaptador', 'versionista', 'co_titular'])
const PAPEIS_ED_ORI = new Set(['editora_original'])
const PAPEIS_ED_ADM = new Set(['editora_adm', 'sub_editora'])

function pct(v: number) {
  if (!v && v !== 0) return '—'
  return v.toFixed(4).replace('.', ',') + '%'
}

function exportCsv(obra: Obra, titulares: TitularRow[]) {
  const rows: string[] = [
    `"Obra";"${obra.titulo}"`,
    `"Código";"${obra.codigo_obra}"`,
    `"ISWC";"${obra.iswc ?? ''}"`,
    `""`,
    `"Tipo";"ID Interno";"Categoria";"Nome Civil / Razão Social";"Pseudônimo / Nome Fantasia";"CPF / CNPJ";"Sociedade";"% Exec. Pública"`,
  ]

  const secoes = [
    { label: 'Compositores / Autores', filtro: (t: TitularRow) => PAPEIS_AUTOR.has(t.papel) },
    { label: 'Editoras Originais',     filtro: (t: TitularRow) => PAPEIS_ED_ORI.has(t.papel) },
    { label: 'Editoras Administradoras', filtro: (t: TitularRow) => PAPEIS_ED_ADM.has(t.papel) },
  ]

  for (const secao of secoes) {
    const grupo = titulares.filter(secao.filtro)
    if (!grupo.length) continue
    rows.push(`"${secao.label}"`)
    for (const t of grupo) {
      const ti = t.titulares
      rows.push([
        `"${PAPEL_LABELS[t.papel] ?? t.papel}"`,
        `"${ti.codigo_titular}"`,
        `"${ti.tipo}"`,
        `"${ti.nome_completo}"`,
        `"${ti.nome_artistico ?? ''}"`,
        `"${ti.cpf_cnpj ?? ''}"`,
        `"${ti.sociedade_autoral ?? ''}"`,
        `"${pct(t.pct_comunicacao_publico || t.percentual_exec_publica)}"`,
      ].join(';'))
    }
    rows.push(`""`)
  }

  const bom = '\uFEFF'
  const blob = new Blob([bom + rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `execucao-publica-${obra.codigo_obra}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function SecaoTable({ titulo, titulares, isPF }: { titulo: string; titulares: TitularRow[]; isPF: boolean }) {
  if (!titulares.length) return null
  return (
    <section className="mb-8 print:mb-6">
      <h2 className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-3 print:text-black">
        {titulo}
      </h2>
      <div className="overflow-x-auto rounded-xl border border-white/[0.07] print:border-gray-300">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.02] print:bg-gray-100 print:border-gray-300">
              <th className="px-4 py-2.5 text-left text-xs text-white/40 print:text-gray-600 font-medium">ID Interno</th>
              <th className="px-4 py-2.5 text-left text-xs text-white/40 print:text-gray-600 font-medium">
                {isPF ? 'Nome Civil' : 'Razão Social'}
              </th>
              <th className="px-4 py-2.5 text-left text-xs text-white/40 print:text-gray-600 font-medium">
                {isPF ? 'Pseudônimo' : 'Nome Fantasia'}
              </th>
              {isPF && <th className="px-4 py-2.5 text-left text-xs text-white/40 print:text-gray-600 font-medium">CPF</th>}
              {!isPF && <th className="px-4 py-2.5 text-left text-xs text-white/40 print:text-gray-600 font-medium">CNPJ</th>}
              <th className="px-4 py-2.5 text-left text-xs text-white/40 print:text-gray-600 font-medium">Categoria</th>
              <th className="px-4 py-2.5 text-right text-xs text-white/40 print:text-gray-600 font-medium">% Exec. Pública</th>
            </tr>
          </thead>
          <tbody>
            {titulares.map((t) => {
              const ti = t.titulares
              const pctVal = t.pct_comunicacao_publico || t.percentual_exec_publica || 0
              return (
                <tr key={t.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.015] print:border-gray-200">
                  <td className="px-4 py-3 text-white/50 print:text-gray-500 text-xs font-mono">{ti.codigo_titular}</td>
                  <td className="px-4 py-3 text-white print:text-gray-900 font-medium">{ti.nome_completo}</td>
                  <td className="px-4 py-3 text-white/60 print:text-gray-600">{ti.nome_artistico || '—'}</td>
                  <td className="px-4 py-3 text-white/50 print:text-gray-500 text-xs font-mono">{ti.cpf_cnpj || '—'}</td>
                  <td className="px-4 py-3 text-white/60 print:text-gray-600 capitalize">{ti.tipo}</td>
                  <td className="px-4 py-3 text-right font-semibold text-emerald-400 print:text-gray-900">{pct(pctVal)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default function ExecucaoPublicaPage() {
  const rawParams = useParams()
  const obraId = rawParams?.id as string

  const [obra, setObra] = useState<Obra | null>(null)
  const [titulares, setTitulares] = useState<TitularRow[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authFetch(`/api/obras/${obraId}/execucao-publica`)
      if (!res.ok) throw new Error('Erro ao carregar')
      const json = await res.json()
      setObra(json.obra)
      setTitulares(json.titulares ?? [])
    } catch (e) {
      setErro('Não foi possível carregar os dados. Verifique se a obra existe.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [obraId])

  useEffect(() => { carregar() }, [carregar])

  const autores  = titulares.filter(t => PAPEIS_AUTOR.has(t.papel))
  const edOri    = titulares.filter(t => PAPEIS_ED_ORI.has(t.papel))
  const edAdm    = titulares.filter(t => PAPEIS_ED_ADM.has(t.papel))
  const somaExec = titulares.reduce((acc, t) => acc + (t.pct_comunicacao_publico || t.percentual_exec_publica || 0), 0)

  if (loading) return (
    <div className="min-h-screen bg-[#070d1a] flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
    </div>
  )

  if (erro || !obra) return (
    <div className="min-h-screen bg-[#070d1a] flex items-center justify-center text-white/50">
      {erro || 'Obra não encontrada'}
    </div>
  )

  return (
    <div className="min-h-screen bg-[#070d1a] print:bg-white">
      {/* Nav — escondido ao imprimir */}
      <div className="print:hidden border-b border-white/[0.06] bg-[#0a1122]/80 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <Link
            href={`/master/obras/${obraId}`}
            className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar para a obra
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => obra && exportCsv(obra, titulares)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/5 border border-white/[0.08] text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar XLS
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-violet-600 text-sm text-white hover:bg-violet-500 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Exportar PDF
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-5xl mx-auto px-6 py-8 print:px-0 print:py-4">
        {/* Cabeçalho da obra */}
        <div className="mb-8 print:mb-6">
          <div className="flex items-start gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center shrink-0 print:hidden">
              <Music2 className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <p className="text-xs text-white/30 print:text-gray-500 uppercase tracking-wider mb-0.5">
                Execução Pública — Comunicação ao Público
              </p>
              <h1 className="text-2xl font-bold text-white print:text-black">{obra.titulo}</h1>
              <div className="flex items-center gap-4 mt-1 text-xs text-white/40 print:text-gray-500">
                <span>Código: <span className="font-mono">{obra.codigo_obra}</span></span>
                {obra.iswc && <span>ISWC: <span className="font-mono">{obra.iswc}</span></span>}
                <span className={`font-semibold ${Math.abs(somaExec - 100) < 0.1 ? 'text-emerald-400 print:text-green-700' : 'text-amber-400 print:text-amber-600'}`}>
                  Soma: {somaExec.toFixed(4).replace('.', ',')}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Aviso de informação */}
        <div className="mb-6 print:hidden bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 text-xs text-blue-300">
          Esta tela mostra apenas os percentuais de <strong>Execução Pública (ECAD)</strong> — modelo diluído individual.
          O ECAD distribui diretamente para a sociedade de cada titular. A editora <strong>não recebe bloco</strong>.
        </div>

        <SecaoTable titulo="Compositores / Autores" titulares={autores} isPF={true} />
        <SecaoTable titulo="Editoras Originais" titulares={edOri} isPF={false} />
        <SecaoTable titulo="Editoras Administradoras" titulares={edAdm} isPF={false} />

        {titulares.length === 0 && (
          <div className="text-center py-16 text-white/30">
            Nenhum titular encontrado para esta obra.
          </div>
        )}

        {/* Rodapé de impressão */}
        <div className="hidden print:block mt-8 pt-4 border-t border-gray-300 text-xs text-gray-400 text-center">
          Sync Mood — Relatório de Execução Pública · {new Date().toLocaleDateString('pt-BR')}
        </div>
      </div>

      {/* CSS de impressão */}
      <style jsx global>{`
        @media print {
          body { background: white !important; color: black !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  )
}

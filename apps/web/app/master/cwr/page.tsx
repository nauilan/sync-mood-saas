'use client'

import { useState, useEffect, useRef } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import {
  Upload, RefreshCw, FileCode2, Loader2, AlertTriangle,
  ChevronRight, CheckCircle2, Clock, XCircle, FileText,
} from 'lucide-react'
import { authFetch } from '@/lib/supabase/client'

const STATUS_LABELS: Record<string, string> = {
  pendente:    'Pendente',
  em_analise:  'Em Análise',
  confirmado:  'Confirmado',
  descartado:  'Descartado',
}

const STATUS_COLORS: Record<string, string> = {
  pendente:   'bg-slate-500/15 text-slate-400',
  em_analise: 'bg-amber-500/15 text-amber-400',
  confirmado: 'bg-emerald-500/15 text-emerald-400',
  descartado: 'bg-rose-500/15 text-rose-400',
}

const StatusIcon = ({ s }: { s: string }) => {
  if (s === 'confirmado') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
  if (s === 'descartado') return <XCircle className="w-3.5 h-3.5 text-rose-400" />
  if (s === 'em_analise') return <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
  return <Clock className="w-3.5 h-3.5 text-slate-400" />
}

export default function CwrPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadErro, setUploadErro] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    setErro('')
    try {
      const res = await authFetch('/api/cwr')
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { setErro(`Erro ${res.status}: ${d.error ?? 'Falha na API'} | debug: ${JSON.stringify(d.debug ?? {})}`); return }
      setItems(d.importacoes ?? [])
    } catch (e: unknown) { setErro(`Falha na requisição: ${e instanceof Error ? e.message : String(e)}`) }
    finally { setLoading(false) }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadErro('')
    try {
      const fd = new FormData()
      fd.append('arquivo', file)
      const res = await authFetch('/api/cwr', { method: 'POST', body: fd })
      const d = await res.json()
      if (!res.ok) { setUploadErro(d.error ?? 'Erro no upload.'); return }
      load()
      window.location.href = `/master/cwr/${d.importacao_id}`
    } catch { setUploadErro('Falha no envio do arquivo.') }
    finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Importação CWR"
        description="Reconstrução editorial a partir de arquivos CWR 2.1 / 2.2"
        actions={
          <>
            <input
              ref={fileRef}
              type="file"
              accept=".cwr,.txt"
              className="hidden"
              onChange={handleUpload}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
            >
              {uploading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Upload className="w-3.5 h-3.5" />}
              {uploading ? 'Processando...' : 'Importar Arquivo CWR'}
            </button>
          </>
        }
      />

      {(erro || uploadErro) && (
        <div className="flex items-center gap-2 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {erro || uploadErro}
        </div>
      )}

      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold text-white">Importações CWR</h2>
          <button onClick={load} className="text-xs text-white/30 hover:text-white/60 flex items-center gap-1 transition-colors">
            <RefreshCw className="w-3 h-3" /> Atualizar
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-white/30 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
          </div>
        ) : items.length === 0 ? (
          <div className="py-14 text-center">
            <FileCode2 className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/30">Nenhuma importação CWR realizada.</p>
            <button
              onClick={() => fileRef.current?.click()}
              className="mt-4 text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              Importar primeiro arquivo
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="text-left px-5 py-2.5 text-white/30 font-semibold">Arquivo</th>
                  <th className="text-center px-4 py-2.5 text-white/30 font-semibold">Obras</th>
                  <th className="text-center px-4 py-2.5 text-white/30 font-semibold">Novas</th>
                  <th className="text-center px-4 py-2.5 text-white/30 font-semibold">Vinculadas</th>
                  <th className="text-center px-4 py-2.5 text-white/30 font-semibold">Conflitos</th>
                  <th className="text-center px-4 py-2.5 text-white/30 font-semibold">Status</th>
                  <th className="text-right px-5 py-2.5 text-white/30 font-semibold">Data</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {items.map((item: any) => {
                  const r = item.relatorio ?? {}
                  return (
                    <tr key={item.id} className="hover:bg-white/[0.02] group">
                      <td className="px-5 py-3">
                        <a href={`/master/cwr/${item.id}`} className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
                          <FileText className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                          <span className="font-mono truncate max-w-[220px]">{item.nome_arquivo}</span>
                        </a>
                      </td>
                      <td className="px-4 py-3 text-center text-white/60 tabular-nums">{r.obras_lidas ?? '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-emerald-400 tabular-nums font-semibold">{r.obras_novas ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sky-400 tabular-nums font-semibold">{r.obras_vinculadas ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-rose-400 tabular-nums font-semibold">{r.conflitos_editoriais ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[item.status] ?? 'bg-white/5 text-white/40'}`}>
                          <StatusIcon s={item.status} />
                          {STATUS_LABELS[item.status] ?? item.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-white/30 tabular-nums whitespace-nowrap">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <a href={`/master/cwr/${item.id}`} className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-white/60 transition-all">
                          <ChevronRight className="w-4 h-4" />
                        </a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

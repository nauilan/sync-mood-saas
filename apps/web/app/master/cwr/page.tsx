'use client'

import { useState, useEffect, useRef } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import {
  Upload, RefreshCw, FileCode2, Loader2, AlertTriangle,
  ChevronRight, CheckCircle2, Clock, XCircle, FileText, Trash2,
} from 'lucide-react'
import { authFetch } from '@/lib/supabase/client'

const STATUS_LABELS: Record<string, string> = {
  pendente:    'Pendente',
  em_analise:  'Em Análise',
  confirmado:  'Confirmado',
  descartado:  'Descartado',
  integrado:   'Integrado',
}

const STATUS_COLORS: Record<string, string> = {
  pendente:   'bg-slate-500/15 text-slate-400',
  em_analise: 'bg-amber-500/15 text-amber-400',
  confirmado: 'bg-emerald-500/15 text-emerald-400',
  integrado:  'bg-emerald-500/15 text-emerald-400',
  descartado: 'bg-rose-500/15 text-rose-400',
}

const StatusIcon = ({ s }: { s: string }) => {
  if (s === 'confirmado' || s === 'integrado') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
  if (s === 'descartado') return <XCircle className="w-3.5 h-3.5 text-rose-400" />
  if (s === 'em_analise') return <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
  return <Clock className="w-3.5 h-3.5 text-slate-400" />
}

export default function CwrPage() {
  const [items, setItems]               = useState<any[]>([])
  const [loading, setLoading]           = useState(true)
  const [erro, setErro]                 = useState('')
  const [uploading, setUploading]       = useState(false)
  const [uploadErro, setUploadErro]     = useState('')
  const [confirmId, setConfirmId]       = useState<string | null>(null)
  const [deleting, setDeleting]         = useState(false)
  const [deleteErro, setDeleteErro]     = useState('')
  const [reintegrando, setReintegrando] = useState<string | null>(null)
  const [reintegrarMsg, setReintegrarMsg] = useState<{ ok: boolean; texto: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    setErro('')
    try {
      const res = await authFetch('/api/cwr')
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { setErro(`Erro ${res.status}: ${d.error ?? 'Falha na API'}`); return }
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

  async function handleReintegrar(id: string) {
    setReintegrando(id)
    setReintegrarMsg(null)
    try {
      const res = await authFetch(`/api/cwr/${id}/integrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) {
        setReintegrarMsg({ ok: false, texto: d.error ?? `Erro ${res.status}` })
      } else {
        const n = d.obras_integradas ?? d.obras ?? '?'
        setReintegrarMsg({ ok: true, texto: `${n} obras reintegradas com sucesso.` })
        load()
      }
    } catch (e: unknown) {
      setReintegrarMsg({ ok: false, texto: e instanceof Error ? e.message : 'Falha na reintegração.' })
    } finally {
      setReintegrando(null)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    setDeleteErro('')
    try {
      const res = await authFetch(`/api/cwr/${id}`, { method: 'DELETE' })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) {
        setDeleteErro(d.error ?? `Erro ${res.status}`)
        return
      }
      setConfirmId(null)
      setItems(prev => prev.filter(i => i.id !== id))
    } catch (e: unknown) {
      setDeleteErro(e instanceof Error ? e.message : 'Falha ao deletar.')
    } finally {
      setDeleting(false)
    }
  }

  const confirmItem = items.find(i => i.id === confirmId)

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
              accept=".cwr,.txt,.V21,.v21,.V22,.v22,text/plain,*/*"
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

      {reintegrarMsg && (
        <div className={`flex items-center justify-between gap-2 px-4 py-3 rounded-lg text-sm border ${reintegrarMsg.ok ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-300'}`}>
          <div className="flex items-center gap-2">
            {reintegrarMsg.ok
              ? <CheckCircle2 className="w-4 h-4 shrink-0" />
              : <AlertTriangle className="w-4 h-4 shrink-0" />}
            {reintegrarMsg.texto}
          </div>
          <button onClick={() => setReintegrarMsg(null)} className="text-white/30 hover:text-white/60 text-xs">✕</button>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {confirmId && confirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0d1526] border border-rose-500/30 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-rose-500/15 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4 text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">Apagar importação CWR</h3>
                <p className="text-xs text-white/50 font-mono">{confirmItem.nome_arquivo}</p>
              </div>
            </div>

            <p className="text-xs text-white/60 mb-2">
              Esta ação irá remover permanentemente:
            </p>
            <ul className="text-xs text-white/50 space-y-1 mb-4 ml-3 list-disc">
              <li>Todas as <span className="text-rose-300 font-semibold">{confirmItem.relatorio?.obras_lidas ?? '?'} obras</span> criadas por este arquivo</li>
              <li>Todos os titulares, fonogramas e links dessas obras</li>
              <li>O registro desta importação</li>
            </ul>
            <p className="text-[11px] text-rose-400 font-semibold mb-5">Esta ação é irreversível.</p>

            {deleteErro && (
              <div className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-xs mb-4">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {deleteErro}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setConfirmId(null); setDeleteErro('') }}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-xs text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmId)}
                disabled={deleting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
              >
                {deleting
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Apagando...</>
                  : <><Trash2 className="w-3.5 h-3.5" /> Apagar tudo</>}
              </button>
            </div>
          </div>
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
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleReintegrar(item.id)}
                            disabled={reintegrando === item.id}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-violet-500/15 text-white/20 hover:text-violet-400 disabled:opacity-50 transition-colors"
                            title="Reintegrar obras deste CWR (pode levar alguns minutos)"
                          >
                            {reintegrando === item.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
                              : <RefreshCw className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => { setConfirmId(item.id); setDeleteErro('') }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-rose-500/15 text-white/20 hover:text-rose-400 transition-colors"
                            title="Apagar importação e todas as obras"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <a href={`/master/cwr/${item.id}`} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 text-white/20 hover:text-white/60 transition-colors">
                            <ChevronRight className="w-4 h-4" />
                          </a>
                        </div>
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

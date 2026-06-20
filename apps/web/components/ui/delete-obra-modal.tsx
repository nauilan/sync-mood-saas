'use client'

import { useState } from 'react'
import { Trash2, AlertTriangle, Loader2, ShieldAlert, X } from 'lucide-react'
import { authFetch } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface DeleteObraModalProps {
  obra: {
    id: string
    titulo: string
    contrato_origem_id?: string | null
    contrato_numero?: string | null
    contrato_obras_count?: number
  }
  onClose: () => void
  /** Chamado após exclusão bem-sucedida. Se não informado, redireciona para /master/obras */
  onDeleted?: (resultado: { obras_removidas: number; contrato_removido: string | null }) => void
}

export function DeleteObraModal({ obra, onClose, onDeleted }: DeleteObraModalProps) {
  const router = useRouter()
  const [step, setStep]           = useState<1 | 2>(1)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting]   = useState(false)
  const [erro, setErro]           = useState('')

  const temContrato   = !!obra.contrato_origem_id
  const tituloNorm    = obra.titulo.trim().toUpperCase()
  const confirmOk     = confirmText.trim().toUpperCase() === tituloNorm

  async function executarDelete(cascade: boolean) {
    setDeleting(true)
    setErro('')
    try {
      const url = `/api/obras/${obra.id}${cascade ? '?cascade=contrato' : ''}`
      const res = await authFetch(url, { method: 'DELETE' })
      const d   = await res.json().catch(() => ({}))
      if (!res.ok) { setErro(d.error ?? `Erro ${res.status}`); return }

      if (onDeleted) {
        onDeleted({ obras_removidas: d.obras_removidas ?? 1, contrato_removido: d.contrato_removido ?? null })
      } else {
        router.push('/master/obras')
      }
      onClose()
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Falha ao excluir.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#0d1526] border border-rose-500/30 rounded-xl w-full max-w-md shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-500/15 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <span className="text-sm font-semibold text-white">
              {step === 1 ? 'Apagar obra' : 'Confirmação final'}
            </span>
            <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
              Etapa {step} de 2
            </span>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 text-white/30 hover:text-white/70 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* ─── ETAPA 1 ───────────────────────────────────────────────── */}
          {step === 1 && (
            <>
              <div>
                <p className="text-xs text-white/50 mb-1">Obra a ser apagada:</p>
                <p className="text-sm font-semibold text-white">{obra.titulo}</p>
              </div>

              {/* Sem contrato: aviso simples */}
              {!temContrato && (
                <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-300">
                    Esta obra não possui contrato vinculado. Apenas ela e seus dados serão apagados.
                  </p>
                </div>
              )}

              {/* Com contrato: destaque forte */}
              {temContrato && (
                <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-300 space-y-1">
                    <p className="font-semibold">Esta obra pertence a um contrato.</p>
                    <p>
                      Contrato: <span className="font-mono text-rose-200">{obra.contrato_numero ?? obra.contrato_origem_id?.slice(0, 8)}</span>
                      {obra.contrato_obras_count != null && obra.contrato_obras_count > 1 && (
                        <> — contém mais <span className="font-bold text-rose-200">{obra.contrato_obras_count - 1} obra(s)</span></>
                      )}
                    </p>
                    <p>Ao prosseguir, você poderá apagar <strong>somente esta obra</strong> ou <strong>o contrato inteiro com todas as obras</strong>.</p>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-white/30">
                Apagar é irreversível. Os dados não podem ser recuperados.
              </p>

              <div className="flex gap-2 justify-end pt-1">
                <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Continuar
                </button>
              </div>
            </>
          )}

          {/* ─── ETAPA 2 ───────────────────────────────────────────────── */}
          {step === 2 && (
            <>
              <div>
                <p className="text-xs text-white/60 mb-3">
                  Para confirmar, digite o título da obra exatamente como aparece abaixo:
                </p>
                <p className="text-xs font-mono bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white/80 mb-3 select-all">
                  {obra.titulo}
                </p>
                <input
                  autoFocus
                  value={confirmText}
                  onChange={e => setConfirmText(e.target.value)}
                  placeholder="Digite o título da obra..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 outline-none focus:border-rose-500/50 transition-colors"
                />
                {confirmText && !confirmOk && (
                  <p className="text-[11px] text-rose-400 mt-1.5">Título não confere. Verifique letras maiúsculas e espaços.</p>
                )}
                {confirmOk && (
                  <p className="text-[11px] text-emerald-400 mt-1.5">Título confirmado.</p>
                )}
              </div>

              {erro && (
                <div className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {erro}
                </div>
              )}

              <div className="flex flex-col gap-2 pt-1">
                {/* Botão: apagar só esta obra */}
                <button
                  disabled={!confirmOk || deleting}
                  onClick={() => executarDelete(false)}
                  className="flex items-center justify-center gap-1.5 w-full px-4 py-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-40 text-amber-300 text-xs font-semibold transition-colors"
                >
                  {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Apagar somente esta obra
                </button>

                {/* Botão: apagar contrato inteiro (só se tiver contrato) */}
                {temContrato && (
                  <button
                    disabled={!confirmOk || deleting}
                    onClick={() => executarDelete(true)}
                    className="flex items-center justify-center gap-1.5 w-full px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-semibold transition-colors"
                  >
                    {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                    Apagar contrato + todas as obras
                  </button>
                )}

                <button
                  onClick={() => { setStep(1); setConfirmText(''); setErro('') }}
                  disabled={deleting}
                  className="text-xs text-white/30 hover:text-white/60 transition-colors py-1"
                >
                  Voltar
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}

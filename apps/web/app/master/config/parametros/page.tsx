'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { MOCK_PARAMETROS } from '@/lib/mock-config'
import type { ParametroFinanceiro } from '@/lib/types-config'
import { Save, DollarSign } from 'lucide-react'

export default function ParametrosPage() {
  const [valores, setValores] = useState<Record<string, string>>(
    Object.fromEntries(MOCK_PARAMETROS.map((p) => [p.id, p.valor]))
  )
  const [toast, setToast] = useState(false)

  function handleChange(id: string, val: string) {
    setValores((prev) => ({ ...prev, [id]: val }))
  }

  function handleSave() {
    setToast(true)
    setTimeout(() => setToast(false), 3500)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Parâmetros Financeiros"
          description="Taxas, alíquotas e comissões aplicadas nos cálculos do sistema."
        />
        <div className="flex items-center gap-3">
          {toast && (
            <span className="text-xs text-emerald-400 animate-pulse">
              Salvo e registrado em audit log!
            </span>
          )}
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm hover:bg-violet-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            Salvar Parâmetros
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {MOCK_PARAMETROS.map((param: ParametroFinanceiro) => (
          <div
            key={param.id}
            className="flex items-center gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.04] transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4 text-amber-400" strokeWidth={1.5} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono text-violet-400">{param.chave}</p>
              <p className="text-sm text-white/70 mt-0.5">{param.descricao}</p>
              <p className="text-[10px] text-white/25 mt-1">
                Última atualização:{' '}
                {new Date(param.updated_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={valores[param.id] ?? param.valor}
                onChange={(e) => handleChange(param.id, e.target.value)}
                className="w-24 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white/80 text-right font-mono focus:outline-none focus:border-violet-500/40 transition-colors"
              />
              <span className="text-sm text-white/30">%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
        <p className="text-xs text-amber-400/80">
          Alterações nos parâmetros são registradas automaticamente no log de auditoria e aplicadas em novos cálculos. Cálculos já executados não são retroativos.
        </p>
      </div>
    </div>
  )
}

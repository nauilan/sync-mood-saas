'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { MOCK_INTEGRACOES } from '@/lib/mock-config'
import type { IntegracaoExterna, IntegracaoStatus } from '@/lib/types-config'
import { Globe, RefreshCw, Settings, X, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

const STATUS_STYLES: Record<IntegracaoStatus, string> = {
  ativa: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  inativa: 'bg-white/5 text-white/30 border-white/10',
  erro: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
}

const STATUS_LABEL: Record<IntegracaoStatus, string> = {
  ativa: 'Ativa',
  inativa: 'Inativa',
  erro: 'Erro',
}

const TIPO_LABEL: Record<string, string> = {
  d4sign: 'D4SIGN',
  docusign: 'DocuSign',
  icp_brasil: 'ICP Brasil',
  socinpro: 'SOCINPRO',
  backoffice_ms: 'BackOffice MS',
  whatsapp_api: 'WhatsApp',
  email_api: 'Email API',
  pix_api: 'PIX API',
  banco_api: 'Banco API',
}

export default function IntegracoesPage() {
  const [testingId, setTestingId] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error'>>({})
  const [configModalId, setConfigModalId] = useState<string | null>(null)

  function handleTestar(integracao: IntegracaoExterna) {
    setTestingId(integracao.id)
    setTimeout(() => {
      setTestingId(null)
      // Simula: status ativa/inativa = success; erro = error
      setTestResults((prev) => ({
        ...prev,
        [integracao.id]: integracao.status === 'erro' ? 'error' : 'success',
      }))
    }, 1800)
  }

  const configModelo = MOCK_INTEGRACOES.find((i) => i.id === configModalId)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Integrações Externas"
        description="Gerencie conexões com serviços externos: assinatura digital, SOCINPRO, PIX, WhatsApp e outros."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {MOCK_INTEGRACOES.map((integ: IntegracaoExterna) => {
          const isLoading = testingId === integ.id
          const testResult = testResults[integ.id]

          return (
            <div
              key={integ.id}
              className="flex flex-col gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.04] transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4 text-white/40" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/80">{integ.nome}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] text-white/35 font-mono">
                      {TIPO_LABEL[integ.tipo] ?? integ.tipo}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_STYLES[integ.status]}`}
                >
                  {STATUS_LABEL[integ.status]}
                </span>
              </div>

              {/* Info */}
              <div className="space-y-1 text-xs text-white/35">
                {integ.ultimo_teste && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>
                      Último teste:{' '}
                      {new Date(integ.ultimo_teste).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Error message */}
              {integ.status === 'erro' && integ.last_error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-400/80">{integ.last_error}</p>
                </div>
              )}

              {/* Test result feedback */}
              {testResult && !isLoading && (
                <div
                  className={`flex items-center gap-2 p-2.5 rounded-xl text-xs ${
                    testResult === 'success'
                      ? 'bg-emerald-500/5 border border-emerald-500/10 text-emerald-400'
                      : 'bg-rose-500/5 border border-rose-500/10 text-rose-400'
                  }`}
                >
                  {testResult === 'success' ? (
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  )}
                  {testResult === 'success' ? 'Conexão bem-sucedida!' : 'Falha na conexão.'}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1 border-t border-white/[0.05]">
                <button
                  onClick={() => handleTestar(integ)}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/[0.04] hover:bg-emerald-500/10 text-white/40 hover:text-emerald-400 text-xs transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? 'Testando...' : 'Testar Conexão'}
                </button>
                <button
                  onClick={() => setConfigModalId(integ.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/40 hover:text-white/60 text-xs transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Configurar
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Config Modal */}
      {configModalId && configModelo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#0f0d1a] border border-white/[0.08] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div>
                <p className="text-sm font-semibold text-white/80">{configModelo.nome}</p>
                <p className="text-xs text-white/35 mt-0.5">Configuração (somente leitura)</p>
              </div>
              <button
                onClick={() => setConfigModalId(null)}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <pre className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-xs text-white/55 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
                {JSON.stringify(configModelo.config_json, null, 2)}
              </pre>
              <p className="text-[10px] text-white/25 mt-2">
                Editora: {configModelo.editora_id} · Criado em:{' '}
                {new Date(configModelo.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div className="px-5 py-4 border-t border-white/[0.06] flex justify-end">
              <button
                onClick={() => setConfigModalId(null)}
                className="px-4 py-2 rounded-xl bg-white/[0.04] text-sm text-white/40 hover:text-white/60 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'
import { useState } from 'react'
import { PortalNav } from '@/components/portal/portal-nav'
import { PORTAL_PERFIL } from '@/lib/mock-portal-autor'
import { User, CreditCard, CheckCircle, Edit3 } from 'lucide-react'

function maskCpf(cpf: string) {
  return cpf.replace(/(\d{3})\.\d{3}\.\d{3}-(\d{2})/, '$1.***.***-$2')
}

export default function PortalPerfilPage() {
  const [changeModal, setChangeModal] = useState(false)
  const [successModal, setSuccessModal] = useState(false)
  const db = PORTAL_PERFIL.dados_bancarios

  return (
    <>
      <PortalNav />
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-2xl font-bold text-white shrink-0">
            NB
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{PORTAL_PERFIL.nome}</h1>
            <p className="text-sm text-violet-300">{PORTAL_PERFIL.nome_artistico}</p>
            <p className="text-xs text-white/35 mt-0.5">{PORTAL_PERFIL.editora_nome}</p>
          </div>
        </div>

        {/* Dados Pessoais */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
            <User className="w-4 h-4 text-white/30" />
            <h2 className="text-sm font-semibold text-white/80">Dados Pessoais</h2>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {[
              { label: 'Nome Completo', value: PORTAL_PERFIL.nome },
              { label: 'Nome Artístico', value: PORTAL_PERFIL.nome_artistico },
              { label: 'CPF', value: maskCpf(PORTAL_PERFIL.cpf) },
              { label: 'E-mail', value: PORTAL_PERFIL.email },
              { label: 'Telefone', value: PORTAL_PERFIL.telefone ?? '—' },
              { label: 'CAE', value: PORTAL_PERFIL.cae ?? '—' },
              { label: 'IPI', value: PORTAL_PERFIL.ipi ?? '—' },
            ].map((row) => (
              <div key={row.label} className="px-5 py-3.5 flex items-center justify-between gap-4">
                <span className="text-xs text-white/40 w-36 shrink-0">{row.label}</span>
                <span className="text-sm text-white/70 font-medium text-right">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dados Bancários */}
        {db && (
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-white/30" />
                <h2 className="text-sm font-semibold text-white/80">Dados Bancários</h2>
              </div>
              {db.validado && (
                <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
                  <CheckCircle className="w-3 h-3" /> Validado
                </span>
              )}
            </div>
            <div className="divide-y divide-white/[0.04]">
              {[
                { label: 'Banco', value: db.banco },
                { label: 'Agência', value: db.agencia },
                { label: 'Conta', value: db.conta },
                { label: 'Tipo', value: db.tipo === 'corrente' ? 'Conta Corrente' : db.tipo === 'poupanca' ? 'Poupança' : 'PIX' },
                { label: 'Chave PIX', value: db.pix_chave ?? '—' },
              ].map((row) => (
                <div key={row.label} className="px-5 py-3.5 flex items-center justify-between gap-4">
                  <span className="text-xs text-white/40 w-36 shrink-0">{row.label}</span>
                  <span className="text-sm text-white/70 font-medium text-right">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Solicitar Alteração */}
        <button
          onClick={() => setChangeModal(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-sm text-white/60 hover:text-white/80 hover:bg-white/[0.08] transition-all"
        >
          <Edit3 className="w-4 h-4" /> Solicitar Alteração
        </button>
      </div>

      {/* Change Request Modal */}
      {changeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#12101e] border border-white/[0.08] rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h2 className="text-sm font-semibold text-white">Solicitar Alteração de Dados</h2>
            <p className="text-xs text-white/50">Descreva o que precisa ser alterado. A solicitação será enviada para validação da editora.</p>
            <textarea
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/70 placeholder:text-white/20 focus:outline-none focus:border-violet-500/40 resize-none h-24"
              placeholder="Descreva a alteração solicitada..."
            />
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setChangeModal(false); setSuccessModal(true) }}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm hover:bg-violet-700 transition-colors font-medium"
              >
                Enviar Solicitação
              </button>
              <button
                onClick={() => setChangeModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/50 text-sm hover:text-white/70 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#12101e] border border-white/[0.08] rounded-2xl p-6 max-w-sm w-full space-y-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-sm font-semibold text-white">Solicitação Enviada</h2>
            <p className="text-xs text-white/50">
              Solicitação de alteração enviada para validação da editora.
            </p>
            <button
              onClick={() => setSuccessModal(false)}
              className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-sm hover:bg-violet-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import { ChevronLeft, Save } from 'lucide-react'
import { MOCK_CC_TITULARES } from '@/lib/mock-cc'
import { MOCK_PRESTACOES } from '@/lib/mock-prestacao'

export default function NovoPagamentoPage() {
  const [titularId, setTitularId] = useState('')
  const [prestacaoId, setPrestacaoId] = useState('')
  const [valor, setValor] = useState('')
  const [metodo, setMetodo] = useState('pix')
  const [dataProg, setDataProg] = useState('2026-05-25')
  const [salvo, setSalvo] = useState(false)

  const titular = MOCK_CC_TITULARES.find(t => t.titular_id === titularId)
  const prestacoesTitular = MOCK_PRESTACOES.filter(p => p.titular_id === titularId)

  function handleSalvar() {
    setSalvo(true)
  }

  if (salvo) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <Save className="w-8 h-8 text-emerald-400" />
        </div>
        <p className="text-white/80 font-semibold">Pagamento agendado com sucesso!</p>
        <Link href="/master/financeiro-m11/contas-pagar" className="text-violet-400 text-xs hover:underline">Voltar para Contas a Pagar</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/master/financeiro-m11/contas-pagar" className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors">
          <ChevronLeft className="w-4 h-4 text-white/50" />
        </Link>
        <PageHeader title="Novo Pagamento" description="Agende um pagamento a um titular." className="mb-0 flex-1" />
      </div>

      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-6 space-y-4">
        <div>
          <label className="text-xs text-white/40 block mb-1">Titular *</label>
          <select value={titularId} onChange={e => setTitularId(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.10] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50">
            <option value="">Selecione...</option>
            {MOCK_CC_TITULARES.map(t => <option key={t.titular_id} value={t.titular_id}>{t.titular_nome} ({t.titular_tipo})</option>)}
          </select>
        </div>

        {titular && (
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] text-xs">
            <p className="text-white/50">Saldo disponível: <span className="text-emerald-400 font-semibold">{titular.saldo_liberado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
            {titular.bloqueios.length > 0 && <p className="text-amber-400 mt-1">⚠ {titular.bloqueios.length} bloqueio(s) ativo(s)</p>}
          </div>
        )}

        <div>
          <label className="text-xs text-white/40 block mb-1">Prestação vinculada (opcional)</label>
          <select value={prestacaoId} onChange={e => setPrestacaoId(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.10] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50">
            <option value="">— Sem prestação —</option>
            {prestacoesTitular.map(p => <option key={p.id} value={p.id}>{p.codigo} · R$ {p.valor_liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-white/40 block mb-1">Valor *</label>
          <input type="number" min="0.01" step="0.01" value={valor} onChange={e => setValor(e.target.value)} placeholder="0,00" className="w-full bg-white/[0.04] border border-white/[0.10] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50" />
        </div>

        <div>
          <label className="text-xs text-white/40 block mb-1">Método de pagamento *</label>
          <div className="flex items-center gap-2 flex-wrap">
            {(['pix', 'ted', 'boleto', 'internacional', 'dinheiro'] as const).map(m => (
              <button key={m} onClick={() => setMetodo(m)} className={['h-8 px-3 rounded-lg border text-xs font-medium transition-colors', metodo === m ? 'bg-violet-500/10 border-violet-500/30 text-violet-400' : 'bg-white/[0.02] border-white/[0.06] text-white/40 hover:text-white/70'].join(' ')}>
                {m.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {metodo === 'pix' && (
          <div>
            <label className="text-xs text-white/40 block mb-1">Chave PIX</label>
            <input type="text" placeholder="CPF, CNPJ, e-mail ou telefone" className="w-full bg-white/[0.04] border border-white/[0.10] rounded-lg px-3 py-2 text-sm text-white/70 outline-none focus:border-violet-500/50" />
          </div>
        )}
        {(metodo === 'ted' || metodo === 'internacional') && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/40 block mb-1">Banco Destino</label>
              <input type="text" placeholder="Ex: Bradesco" className="w-full bg-white/[0.04] border border-white/[0.10] rounded-lg px-3 py-2 text-sm text-white/70 outline-none focus:border-violet-500/50" />
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">Conta Destino</label>
              <input type="text" placeholder="00000-0" className="w-full bg-white/[0.04] border border-white/[0.10] rounded-lg px-3 py-2 text-sm text-white/70 outline-none focus:border-violet-500/50" />
            </div>
          </div>
        )}

        <div>
          <label className="text-xs text-white/40 block mb-1">Data de agendamento</label>
          <input type="date" value={dataProg} onChange={e => setDataProg(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.10] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50" />
        </div>

        <button onClick={handleSalvar} className="flex items-center gap-2 h-9 px-5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors">
          <Save className="w-4 h-4" />
          Agendar Pagamento
        </button>
      </div>
    </div>
  )
}

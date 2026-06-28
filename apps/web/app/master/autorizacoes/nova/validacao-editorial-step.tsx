'use client'

import Link from 'next/link'
import { AlertCircle, CheckCircle2, RefreshCw, Shield } from 'lucide-react'

function fmtPct(v?: number | null) {
  if (v == null) return '—'
  return `${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`
}

type Item = {
  nome: string
  documento: string
  funcao: string
  percentual_brasil: number
  percentual_exterior: number
}

export function ValidacaoEditorialStep({
  obraAptaEditorialmente,
  carregandoSaneamento,
  statusIntegridade,
  recebedorDefinido,
  percentualControladoBr,
  percentualControladoEx,
  editorasOriginais,
  administradoras,
  titularesControlados,
  titularesNaoControlados,
  percentualNaoControladoBr,
  pendenciasEditorial,
  obraId,
}: {
  obraAptaEditorialmente: boolean
  carregandoSaneamento: boolean
  statusIntegridade: string | null
  recebedorDefinido: string
  percentualControladoBr: number
  percentualControladoEx: number
  editorasOriginais: string[]
  administradoras: string[]
  titularesControlados: Item[]
  titularesNaoControlados: Item[]
  percentualNaoControladoBr: number
  pendenciasEditorial: Array<any>
  obraId: string
}) {
  return (
    <div className="space-y-4">
      <div className={`border rounded-xl p-4 flex items-start gap-3 ${
        obraAptaEditorialmente
          ? 'bg-emerald-500/10 border-emerald-500/20'
          : 'bg-amber-500/10 border-amber-500/20'
      }`}>
        {obraAptaEditorialmente ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        )}
        <div>
          <p className={`text-sm font-semibold ${obraAptaEditorialmente ? 'text-emerald-300' : 'text-amber-300'}`}>
            {obraAptaEditorialmente
              ? 'Esta obra está editorialmente apta para emissão.'
              : 'Esta autorização ainda não pode ser emitida porque a obra possui pendências editoriais.'}
          </p>
          <p className={`text-xs mt-1 ${obraAptaEditorialmente ? 'text-emerald-200/80' : 'text-amber-200/80'}`}>
            {obraAptaEditorialmente
              ? 'A autorização será limitada à parte controlada informada na ficha editorial.'
              : 'Corrija as pendências no saneamento da obra antes de prosseguir. Você ainda pode salvar como rascunho.'}
          </p>
        </div>
      </div>

      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-semibold text-white">Validação Editorial da Obra</h3>
          </div>
          {carregandoSaneamento && (
            <span className="inline-flex items-center gap-1.5 text-xs text-white/35">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Carregando saneamento...
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Status editorial</p>
            <p className="text-sm font-semibold text-white/80">{statusIntegridade ?? '—'}</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Recebedor definido</p>
            <p className="text-sm font-semibold text-white/80">{recebedorDefinido}</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Parte autorizável BR</p>
            <p className="text-sm font-semibold text-white/80">{fmtPct(percentualControladoBr)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-3">
            <p className="text-[10px] font-semibold text-white/35 uppercase tracking-wider">Resumo da parte autorizável</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-white/30">Controle Brasil</p>
                <p className="text-xs text-emerald-300 font-semibold">{fmtPct(percentualControladoBr)}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/30">Controle Exterior</p>
                <p className="text-xs text-emerald-300 font-semibold">{fmtPct(percentualControladoEx)}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/30">Editoras originais</p>
                <p className="text-xs text-white/70">{editorasOriginais.length ? editorasOriginais.join(' / ') : '—'}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/30">Administradora</p>
                <p className="text-xs text-white/70">{administradoras.length ? administradoras.join(' / ') : '—'}</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-white/30 mb-2">Titulares controlados</p>
              {titularesControlados.length === 0 ? (
                <p className="text-xs text-white/35">Nenhum titular controlado encontrado.</p>
              ) : (
                <div className="space-y-2">
                  {titularesControlados.map((item, index) => (
                    <div key={`${item.nome}-${index}`} className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-white/80">{item.nome}</p>
                          <p className="text-[10px] text-white/35">{item.documento} · {item.funcao}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-white/30">BR {fmtPct(item.percentual_brasil)}</p>
                          <p className="text-[10px] text-white/30">EX {fmtPct(item.percentual_exterior)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-3">
            <p className="text-[10px] font-semibold text-white/35 uppercase tracking-wider">Parte não controlada</p>
            <div>
              <p className="text-[10px] text-white/30">Percentual não controlado (BR)</p>
              <p className="text-xs text-amber-300 font-semibold">{fmtPct(percentualNaoControladoBr)}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/30 mb-2">Titulares não controlados</p>
              {titularesNaoControlados.length === 0 ? (
                <p className="text-xs text-white/35">Nenhum titular não controlado identificado.</p>
              ) : (
                <div className="space-y-2">
                  {titularesNaoControlados.map((item, index) => (
                    <div key={`${item.nome}-nao-${index}`} className="rounded-lg bg-amber-500/5 border border-amber-500/10 p-3">
                      <p className="text-xs font-semibold text-white/80">{item.nome}</p>
                      <p className="text-[10px] text-white/35">{item.documento} · {item.funcao}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
              <p className="text-xs text-amber-300">
                Esta parte não está incluída na autorização. O documento emitido será limitado exclusivamente à parte controlada.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-3">
          <p className="text-[10px] font-semibold text-white/35 uppercase tracking-wider">Pendências editoriais</p>
          {pendenciasEditorial.length === 0 ? (
            <p className="text-xs text-emerald-300">Nenhuma pendência editorial detectada.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {pendenciasEditorial.map((pendencia, index) => (
                <span
                  key={`${pendencia?.codigo ?? 'pendencia'}-${index}`}
                  className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-200"
                >
                  {pendencia?.mensagem ?? pendencia?.codigo ?? 'Pendência'}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={obraId ? `/master/obras/${obraId}` : '/master/obras'}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-white/5 border border-white/[0.06] text-sm text-white/70 hover:text-white"
          >
            Abrir saneamento da obra
          </Link>
        </div>
      </div>
    </div>
  )
}
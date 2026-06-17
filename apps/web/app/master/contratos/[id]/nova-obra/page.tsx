'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { authFetch } from '@/lib/supabase/client'
import {
  Music, Mic2, Disc3, Plus, Trash2, ChevronLeft, Check,
  X, AlertCircle, Info,
} from 'lucide-react'

// ── Tipos ──────────────────────────────────────────────────────────────────────

type Interprete = {
  _key: string
  nome_artistico: string
  nome_civil: string
  tipo: string
}

type Fonograma = {
  _key: string
  titulo_fonograma: string
  titulo_album: string
  produtor_album: string
  codigo_catalogo: string
  ean: string
  isrc: string
  titulo_versao: string
  interprete: string
  gravadora: string
  data_lancamento: string
  duracao_segundos: string
  formato_audio: boolean
  tecnica_digital: boolean
  tipo_midia: string
  versao: string
}

type Autor = {
  nome: string
  papel: string
  pct?: number
}

type ObraJson = {
  titulo: string
  titulo_alternativo?: string
  papel_autor?: string
  pct_autor?: number
  co_autores?: Autor[]
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2)
}

function fonogramaVazio(): Fonograma {
  return {
    _key: uid(),
    titulo_fonograma: '',
    titulo_album: '',
    produtor_album: '',
    codigo_catalogo: '',
    ean: '',
    isrc: '',
    titulo_versao: '',
    interprete: '',
    gravadora: '',
    data_lancamento: '',
    duracao_segundos: '',
    formato_audio: true,
    tecnica_digital: true,
    tipo_midia: '',
    versao: 'original',
  }
}

// ── Página ─────────────────────────────────────────────────────────────────────

export default function NovaObraPage() {
  const rawParams = useParams()
  const contratoId = rawParams?.id as string
  const router = useRouter()

  // Dados do contrato
  const [contrato, setContrato] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  // Form state
  const [iswc, setIswc] = useState('')
  const [interpretes, setInterpretes] = useState<Interprete[]>([])
  const [fonogramas, setFonogramas] = useState<Fonograma[]>([])

  // Add intérprete form
  const [novaArtista, setNovaArtista] = useState({ nome_artistico: '', nome_civil: '', tipo: 'principal' })

  // Modal fonograma
  const [modal, setModal] = useState<{ aberto: boolean; fono: Fonograma }>({
    aberto: false,
    fono: fonogramaVazio(),
  })

  // Submit
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState<{ tipo: 'homonima' | 'duplicata_exata'; message: string } | null>(null)

  // ── Load contrato ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!contratoId) return
    async function load() {
      const res = await authFetch(`/api/contratos/${contratoId}`)
      if (res.ok) {
        const d = await res.json()
        setContrato(d.contrato ?? null)
      }
      setLoading(false)
    }
    load()
  }, [contratoId])

  // ── Derived ──────────────────────────────────────────────────────────────────
  const obrasJson: ObraJson[] = (contrato?.obras_json as ObraJson[]) ?? []
  const titularNome: string = (contrato?.titular_principal as string) ?? ''
  const primeiraObra: ObraJson | undefined = obrasJson[0]

  // ── Handlers — intérpretes ───────────────────────────────────────────────────
  function addInterprete() {
    if (!novaArtista.nome_artistico.trim()) return
    setInterpretes(prev => [...prev, { _key: uid(), ...novaArtista }])
    setNovaArtista({ nome_artistico: '', nome_civil: '', tipo: 'principal' })
  }

  function removeInterprete(key: string) {
    setInterpretes(prev => prev.filter(i => i._key !== key))
  }

  // ── Handlers — fonogramas ────────────────────────────────────────────────────
  function abrirModal(fono?: Fonograma) {
    setModal({ aberto: true, fono: fono ?? fonogramaVazio() })
  }

  function salvarFonograma() {
    if (!modal.fono.titulo_fonograma.trim() && !modal.fono.isrc.trim()) return
    setFonogramas(prev => {
      const existIdx = prev.findIndex(f => f._key === modal.fono._key)
      if (existIdx >= 0) {
        const updated = [...prev]
        updated[existIdx] = modal.fono
        return updated
      }
      return [...prev, modal.fono]
    })
    setModal({ aberto: false, fono: fonogramaVazio() })
  }

  function removeFonograma(key: string) {
    setFonogramas(prev => prev.filter(f => f._key !== key))
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  async function confirmar(forcar = false) {
    setSalvando(true)
    setErro('')
    setAviso(null)
    try {
      const body = {
        forcar,
        iswc: iswc.trim() || undefined,
        interpretes: interpretes.map(({ _key: _k, ...rest }) => rest),
        fonogramas: fonogramas.map(({ _key: _k, duracao_segundos: ds, ...rest }) => ({
          ...rest,
          duracao_segundos: ds ? parseInt(ds, 10) || null : null,
        })),
      }
      const res = await authFetch(`/api/contratos/${contratoId}/criar-obra`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()

      if (res.ok && json.criadas?.length > 0) {
        router.push(`/master/obras/${json.criadas[0].obra_id}`)
      } else if (res.status === 409 && json.match) {
        setAviso({ tipo: json.match_type, message: json.message })
      } else {
        setErro(json.error ?? 'Erro ao criar obra.')
      }
    } catch {
      setErro('Erro de conexao.')
    } finally {
      setSalvando(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!contrato) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <p className="text-white/40">Contrato nao encontrado.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-20">
      {/* Header */}
      <div className="border-b border-white/[0.06] bg-[#0d0d14] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </button>
          <span className="text-white/20">/</span>
          <span className="text-sm text-white/60">{contrato.numero as string}</span>
          <span className="text-white/20">/</span>
          <span className="text-sm text-white/80 font-medium">Cadastro da Obra</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">

        {/* Info box */}
        <div className="flex gap-3 bg-violet-500/[0.08] border border-violet-500/20 rounded-xl px-4 py-3">
          <Info className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-white/60">
            Preencha os dados da obra antes de confirmar o cadastro. Informacoes autorais sao pre-preenchidas a partir do contrato e nao podem ser alteradas aqui.
          </p>
        </div>

        {/* ── Dados autorais (somente leitura) ──────────────────────────── */}
        {obrasJson.map((obra, i) => (
          <section key={i} className="bg-[#111118] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06]">
              <Music className="w-4 h-4 text-violet-400" />
              <h2 className="text-sm font-semibold text-white">{obra.titulo}</h2>
              {obra.titulo_alternativo && (
                <span className="text-xs text-white/40 ml-1">/ {obra.titulo_alternativo}</span>
              )}
              <span className="ml-auto text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded">somente leitura</span>
            </div>

            <div className="px-5 py-4 space-y-3">
              {/* Titular principal */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/40 w-28 flex-shrink-0">Titular principal</span>
                <span className="text-sm font-medium text-white">{titularNome}</span>
                <span className="text-[10px] text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded">
                  {obra.papel_autor ?? 'CA'}
                </span>
                {obra.pct_autor !== undefined && (
                  <span className="text-xs text-white/50 ml-auto">{obra.pct_autor}% PR</span>
                )}
              </div>

              {/* Co-autores */}
              {(obra.co_autores ?? []).map((co, ci) => (
                <div key={ci} className="flex items-center gap-3">
                  <span className="text-xs text-white/40 w-28 flex-shrink-0">Co-autor</span>
                  <span className="text-sm text-white/80">{co.nome}</span>
                  <span className="text-[10px] text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded">{co.papel}</span>
                  {co.pct !== undefined && (
                    <span className="text-xs text-white/50 ml-auto">{co.pct}% PR</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* ── ISWC ──────────────────────────────────────────────────────── */}
        <section className="bg-[#111118] border border-white/[0.06] rounded-2xl">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06]">
            <span className="text-sm font-semibold text-white">ISWC</span>
            <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded ml-auto">opcional</span>
          </div>
          <div className="px-5 py-4">
            <input
              type="text"
              value={iswc}
              onChange={e => setIswc(e.target.value)}
              placeholder="T-000.000.000-0"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50 font-mono"
            />
            <p className="text-xs text-white/30 mt-1.5">Se ainda nao tiver ISWC, deixe em branco. Podera ser adicionado depois.</p>
          </div>
        </section>

        {/* ── Interpretes ───────────────────────────────────────────────── */}
        <section className="bg-[#111118] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06]">
            <Mic2 className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Interpretes</h2>
            <span className="text-xs text-white/30 ml-1">({interpretes.length})</span>
          </div>

          {/* Lista */}
          {interpretes.length > 0 && (
            <div className="border-b border-white/[0.06]">
              {interpretes.map(interp => (
                <div key={interp._key} className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.04] last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{interp.nome_artistico}</p>
                    {interp.nome_civil && (
                      <p className="text-xs text-white/40 truncate">{interp.nome_civil}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-white/50 bg-white/5 px-2 py-0.5 rounded capitalize">{interp.tipo}</span>
                  <button
                    onClick={() => removeInterprete(interp._key)}
                    className="p-1 text-white/20 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Form add */}
          <div className="px-5 py-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={novaArtista.nome_artistico}
                onChange={e => setNovaArtista(p => ({ ...p, nome_artistico: e.target.value.toUpperCase() }))}
                onKeyDown={e => e.key === 'Enter' && addInterprete()}
                placeholder="NOME ARTISTICO"
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/50 uppercase"
              />
              <button
                onClick={addInterprete}
                disabled={!novaArtista.nome_artistico.trim()}
                className="h-9 px-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 rounded-lg transition-colors disabled:opacity-40"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* ── Gravacoes ─────────────────────────────────────────────────── */}
        <section className="bg-[#111118] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06]">
            <Disc3 className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-semibold text-white">Gravacoes</h2>
            <span className="text-xs text-white/30 ml-1">({fonogramas.length})</span>
            <button
              onClick={() => abrirModal()}
              className="ml-auto flex items-center gap-1.5 h-7 px-3 text-xs bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/25 text-sky-400 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar gravacao
            </button>
          </div>

          {fonogramas.length === 0 ? (
            <div className="px-5 py-6 text-center">
              <p className="text-sm text-white/25">Nenhuma gravacao adicionada.</p>
              <p className="text-xs text-white/20 mt-0.5">Voce pode adicionar depois na tela da obra.</p>
            </div>
          ) : (
            <div>
              {/* Header */}
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-5 py-2 border-b border-white/[0.04]">
                <span className="text-[10px] text-white/30 uppercase tracking-wide">Interprete</span>
                <span className="text-[10px] text-white/30 uppercase tracking-wide">ISRC</span>
                <span className="text-[10px] text-white/30 uppercase tracking-wide w-16" />
                <span className="w-4" />
              </div>
              {fonogramas.map(fono => (
                <div key={fono._key} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center px-5 py-3 border-b border-white/[0.04] last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{fono.interprete || fono.titulo_fonograma || '—'}</p>
                    {fono.titulo_fonograma && fono.interprete && (
                      <p className="text-xs text-white/40 truncate">{fono.titulo_fonograma}</p>
                    )}
                  </div>
                  <span className="text-xs font-mono text-sky-300">{fono.isrc || '—'}</span>
                  <button
                    onClick={() => abrirModal(fono)}
                    className="text-xs text-white/40 hover:text-white/70 transition-colors px-2"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => removeFonograma(fono._key)}
                    className="p-1 text-white/20 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Aviso de match ────────────────────────────────────────────── */}
        {aviso && (
          <div className={`rounded-xl border px-5 py-4 space-y-3 ${aviso.tipo === 'duplicata_exata' ? 'bg-rose-500/[0.07] border-rose-500/20' : 'bg-amber-500/[0.07] border-amber-500/20'}`}>
            <div className="flex items-start gap-2">
              <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${aviso.tipo === 'duplicata_exata' ? 'text-rose-400' : 'text-amber-400'}`} />
              <p className={`text-sm font-medium ${aviso.tipo === 'duplicata_exata' ? 'text-rose-300' : 'text-amber-300'}`}>{aviso.message}</p>
            </div>
            {aviso.tipo === 'homonima' && (
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => confirmar(true)}
                  disabled={salvando}
                  className="h-8 px-4 text-xs bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 rounded-lg transition-colors disabled:opacity-50"
                >
                  Criar como homonima
                </button>
                <button
                  onClick={() => setAviso(null)}
                  className="h-8 px-4 text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            )}
            {aviso.tipo === 'duplicata_exata' && (
              <button
                onClick={() => setAviso(null)}
                className="h-8 px-4 text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 rounded-lg transition-colors"
              >
                Fechar
              </button>
            )}
          </div>
        )}

        {/* ── Erro ──────────────────────────────────────────────────────── */}
        {erro && (
          <div className="flex items-center gap-2 bg-rose-500/[0.07] border border-rose-500/20 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <p className="text-sm text-rose-300">{erro}</p>
          </div>
        )}

        {/* ── Botao confirmar ───────────────────────────────────────────── */}
        {!aviso && (
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => confirmar(false)}
              disabled={salvando}
              className="flex items-center gap-2 h-10 px-6 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              {salvando ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Confirmar Cadastro da Obra
            </button>
            <button
              onClick={() => router.back()}
              className="h-10 px-4 text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* ── Modal Gravacao ─────────────────────────────────────────────────────── */}
      {modal.aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModal(p => ({ ...p, aberto: false }))} />
          <div className="relative w-full max-w-2xl bg-[#13131e] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center gap-2 px-6 py-4 border-b border-white/[0.06]">
              <Disc3 className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-semibold text-white">Detalhe da Gravacao</h3>
              <button
                onClick={() => setModal(p => ({ ...p, aberto: false }))}
                className="ml-auto p-1 text-white/30 hover:text-white/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
              {/* Título da gravação */}
              <div className="col-span-2">
                <label className="text-xs text-white/40 mb-1 block">Titulo da gravacao</label>
                <input
                  type="text"
                  value={modal.fono.titulo_fonograma}
                  onChange={e => setModal(p => ({ ...p, fono: { ...p.fono, titulo_fonograma: e.target.value } }))}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-sky-500/50"
                />
              </div>

              {/* Título do álbum */}
              <div>
                <label className="text-xs text-white/40 mb-1 block">Titulo do album</label>
                <input
                  type="text"
                  value={modal.fono.titulo_album}
                  onChange={e => setModal(p => ({ ...p, fono: { ...p.fono, titulo_album: e.target.value } }))}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-sky-500/50"
                />
              </div>

              {/* Produtor do álbum */}
              <div>
                <label className="text-xs text-white/40 mb-1 block">Produtor do album</label>
                <input
                  type="text"
                  value={modal.fono.produtor_album}
                  onChange={e => setModal(p => ({ ...p, fono: { ...p.fono, produtor_album: e.target.value } }))}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-sky-500/50"
                />
              </div>

              {/* Código catálogo */}
              <div>
                <label className="text-xs text-white/40 mb-1 block">Codigo catalogo</label>
                <input
                  type="text"
                  value={modal.fono.codigo_catalogo}
                  onChange={e => setModal(p => ({ ...p, fono: { ...p.fono, codigo_catalogo: e.target.value } }))}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-sky-500/50"
                />
              </div>

              {/* EAN */}
              <div>
                <label className="text-xs text-white/40 mb-1 block">EAN</label>
                <input
                  type="text"
                  value={modal.fono.ean}
                  onChange={e => setModal(p => ({ ...p, fono: { ...p.fono, ean: e.target.value } }))}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-sky-500/50"
                />
              </div>

              {/* ISRC — obrigatório */}
              <div>
                <label className="text-xs mb-1 flex items-center gap-1">
                  <span className="text-white/40">ISRC</span>
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={modal.fono.isrc}
                  onChange={e => setModal(p => ({ ...p, fono: { ...p.fono, isrc: e.target.value.toUpperCase() } }))}
                  placeholder="BR-XXX-00-00000"
                  className={`w-full bg-white/[0.04] border rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none font-mono ${!modal.fono.isrc.trim() ? 'border-rose-500/40 focus:border-rose-500/70' : 'border-white/[0.08] focus:border-sky-500/50'}`}
                />
              </div>

              {/* Título da versão */}
              <div>
                <label className="text-xs text-white/40 mb-1 block">Titulo da versao</label>
                <input
                  type="text"
                  value={modal.fono.titulo_versao}
                  onChange={e => setModal(p => ({ ...p, fono: { ...p.fono, titulo_versao: e.target.value } }))}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-sky-500/50"
                />
              </div>

              {/* Intérprete — obrigatório */}
              <div>
                <label className="text-xs mb-1 flex items-center gap-1">
                  <span className="text-white/40">Interprete</span>
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={modal.fono.interprete}
                  onChange={e => setModal(p => ({ ...p, fono: { ...p.fono, interprete: e.target.value.toUpperCase() } }))}
                  className={`w-full bg-white/[0.04] border rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none ${!modal.fono.interprete.trim() ? 'border-rose-500/40 focus:border-rose-500/70' : 'border-white/[0.08] focus:border-sky-500/50'}`}
                />
              </div>

              {/* Gravadora */}
              <div>
                <label className="text-xs text-white/40 mb-1 block">Gravadora</label>
                <input
                  type="text"
                  value={modal.fono.gravadora}
                  onChange={e => setModal(p => ({ ...p, fono: { ...p.fono, gravadora: e.target.value } }))}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-sky-500/50"
                />
              </div>

              {/* Lançamento */}
              <div>
                <label className="text-xs text-white/40 mb-1 block">Lancamento</label>
                <input
                  type="date"
                  value={modal.fono.data_lancamento}
                  onChange={e => setModal(p => ({ ...p, fono: { ...p.fono, data_lancamento: e.target.value } }))}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500/50"
                />
              </div>

              {/* Duração */}
              <div>
                <label className="text-xs text-white/40 mb-1 block">Duracao (segundos)</label>
                <input
                  type="number"
                  value={modal.fono.duracao_segundos}
                  onChange={e => setModal(p => ({ ...p, fono: { ...p.fono, duracao_segundos: e.target.value } }))}
                  placeholder="180"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-sky-500/50"
                />
              </div>

              {/* Tipo Mídia */}
              <div>
                <label className="text-xs text-white/40 mb-1 block">Tipo de Midia</label>
                <select
                  value={modal.fono.tipo_midia}
                  onChange={e => setModal(p => ({ ...p, fono: { ...p.fono, tipo_midia: e.target.value } }))}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500/50"
                >
                  <option value="">Selecionar</option>
                  <option value="digital">Digital</option>
                  <option value="cd">CD</option>
                  <option value="vinil">Vinil</option>
                  <option value="streaming">Streaming</option>
                  <option value="download">Download</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              {/* Versão */}
              <div>
                <label className="text-xs text-white/40 mb-1 block">Versao</label>
                <select
                  value={modal.fono.versao}
                  onChange={e => setModal(p => ({ ...p, fono: { ...p.fono, versao: e.target.value } }))}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500/50"
                >
                  <option value="original">Original</option>
                  <option value="ao_vivo">Ao vivo</option>
                  <option value="remix">Remix</option>
                  <option value="acustico">Acustico</option>
                  <option value="regravacao">Regravacao</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              {/* Toggles */}
              <div className="col-span-2 flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <button
                    type="button"
                    onClick={() => setModal(p => ({ ...p, fono: { ...p.fono, formato_audio: !p.fono.formato_audio } }))}
                    className={`w-10 h-5 rounded-full transition-colors ${modal.fono.formato_audio ? 'bg-sky-500' : 'bg-white/10'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${modal.fono.formato_audio ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                  <span className="text-sm text-white/60">Formato Audio</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <button
                    type="button"
                    onClick={() => setModal(p => ({ ...p, fono: { ...p.fono, tecnica_digital: !p.fono.tecnica_digital } }))}
                    className={`w-10 h-5 rounded-full transition-colors ${modal.fono.tecnica_digital ? 'bg-sky-500' : 'bg-white/10'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${modal.fono.tecnica_digital ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                  <span className="text-sm text-white/60">Tecnica Digital</span>
                </label>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-white/[0.06]">
              <button
                onClick={() => setModal(p => ({ ...p, aberto: false }))}
                className="h-9 px-4 text-sm text-white/50 hover:text-white/80 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={salvarFonograma}
                disabled={!modal.fono.interprete.trim() || !modal.fono.isrc.trim()}
                className="flex items-center gap-1.5 h-9 px-5 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-40"
              >
                <Check className="w-4 h-4" />
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

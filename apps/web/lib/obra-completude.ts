// ──────────────────────────────────────────────────────────────────────────────
// lib/obra-completude.ts
// Motor de completude editorial — calcula score (0–100) e pendências por obra
// Regra-mestre: nenhuma obra pode ser exportada enquanto score < 100
// ──────────────────────────────────────────────────────────────────────────────

export type DestinoExportacao = 'cwr' | 'socinpro' | 'backoffice'

export interface PendenciaExportacao {
  campo: string
  mensagem: string
  destinos: DestinoExportacao[]
}

export interface ResultadoCompletude {
  score: number                    // 0–100
  total_checks: number
  checks_ok: number
  pendencias: PendenciaExportacao[]
  bloqueado: boolean               // true se score < 100
  por_destino: Record<DestinoExportacao, { ok: boolean; pendencias: PendenciaExportacao[] }>
}

const ALL: DestinoExportacao[] = ['cwr', 'socinpro', 'backoffice']

interface CheckInput {
  obra: Record<string, unknown>
  participantes: Record<string, unknown>[]
  fonogramas: Record<string, unknown>[]
}

interface Verificacao {
  campo: string
  mensagem: string
  destinos: DestinoExportacao[]
  ok: (i: CheckInput) => boolean
}

const VERIFICACOES: Verificacao[] = [
  {
    campo: 'status_catalogo',
    mensagem: 'Obra não está em "Catálogo Ativo". Ative antes de exportar.',
    destinos: ALL,
    ok: ({ obra }) => obra.status_catalogo === 'catalogo_ativo',
  },
  {
    campo: 'titulo',
    mensagem: 'Título não informado.',
    destinos: ALL,
    ok: ({ obra }) => Boolean(obra.titulo),
  },
  {
    campo: 'titulo_original',
    mensagem: 'Título original não informado (obrigatório para CWR).',
    destinos: ['cwr'],
    ok: ({ obra }) => Boolean(obra.titulo_original),
  },
  {
    campo: 'iswc',
    mensagem: 'ISWC não informado (obrigatório para CWR e Socinpro).',
    destinos: ['cwr', 'socinpro'],
    ok: ({ obra }) => Boolean(obra.iswc),
  },
  {
    campo: 'idioma',
    mensagem: 'Idioma não informado.',
    destinos: ['cwr', 'socinpro'],
    ok: ({ obra }) => Boolean(obra.idioma),
  },
  {
    campo: 'genero_musical',
    mensagem: 'Gênero musical não informado.',
    destinos: ['socinpro', 'backoffice'],
    ok: ({ obra }) => Boolean(obra.genero_musical ?? obra.genero),
  },
  {
    campo: 'editora_id',
    mensagem: 'Editora não vinculada à obra.',
    destinos: ALL,
    ok: ({ obra }) => Boolean(obra.editora_id),
  },
  {
    campo: 'codigo_obra',
    mensagem: 'Código da obra não informado.',
    destinos: ALL,
    ok: ({ obra }) => Boolean(obra.codigo_obra ?? obra.codigo),
  },
  {
    campo: 'contrato_origem_id',
    mensagem: 'Nenhum contrato de origem vinculado.',
    destinos: ALL,
    ok: ({ obra }) => Boolean(obra.contrato_origem_id),
  },
  {
    campo: 'participantes',
    mensagem: 'Nenhum participante/autor cadastrado na obra.',
    destinos: ALL,
    ok: ({ participantes }) => participantes.length > 0,
  },
  {
    campo: 'percentuais',
    mensagem: 'Soma dos percentuais dos participantes diferente de 100%.',
    destinos: ALL,
    ok: ({ participantes }) => {
      if (participantes.length === 0) return false
      const soma = participantes.reduce((s, p) => s + (Number(p.percentual) || 0), 0)
      return Math.abs(soma - 100) <= 0.01
    },
  },
  {
    campo: 'fonogramas_isrc',
    mensagem: 'Nenhum fonograma com ISRC cadastrado (obrigatório para BackOffice).',
    destinos: ['backoffice'],
    ok: ({ fonogramas }) => fonogramas.some(f => Boolean(f.isrc)),
  },
]

export function calcularCompletude(
  obra: Record<string, unknown>,
  participantes: Record<string, unknown>[],
  fonogramas: Record<string, unknown>[],
): ResultadoCompletude {
  const input: CheckInput = { obra, participantes, fonogramas }
  const pendencias: PendenciaExportacao[] = []

  for (const v of VERIFICACOES) {
    if (!v.ok(input)) {
      pendencias.push({ campo: v.campo, mensagem: v.mensagem, destinos: v.destinos })
    }
  }

  const total_checks = VERIFICACOES.length
  const checks_ok = total_checks - pendencias.length
  const score = Math.round((checks_ok / total_checks) * 100)

  const porDestino = (d: DestinoExportacao) => {
    const dp = pendencias.filter(p => p.destinos.includes(d))
    return { ok: dp.length === 0, pendencias: dp }
  }

  return {
    score,
    total_checks,
    checks_ok,
    pendencias,
    bloqueado: pendencias.length > 0,
    por_destino: {
      cwr: porDestino('cwr'),
      socinpro: porDestino('socinpro'),
      backoffice: porDestino('backoffice'),
    },
  }
}

/** Mensagem resumida de bloqueio para exibir em botões de exportação */
export function mensagemBloqueio(resultado: ResultadoCompletude): string {
  if (!resultado.bloqueado) return ''
  const n = resultado.pendencias.length
  return `Exportação bloqueada: ${n} pendência${n !== 1 ? 's' : ''} encontrada${n !== 1 ? 's' : ''}. Score: ${resultado.score}/100.`
}

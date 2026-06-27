// ──────────────────────────────────────────────────────────────────────────────
// lib/integridade-editorial.ts
// Motor de integridade editorial — calcula o status de aptidão de uma obra
// para emissão de autorização e exportação.
//
// Status possíveis (ordem de prioridade):
//   bloqueada           → exportacao_bloqueada = true
//   contrato_pendente   → sem contrato ou recontratação pendente
//   link_incompleto     → sem formações/links ou link sem titulares
//   percentual_pendente → percentuais não somam 100% em algum link
//   recebedor_pendente  → titular controlado sem editora administradora
//   revisao             → obra CWR não confirmada editorialmente
//   apta                → todos os checks passaram
// ──────────────────────────────────────────────────────────────────────────────

export type StatusIntegridade =
  | 'apta'
  | 'contrato_pendente'
  | 'link_incompleto'
  | 'percentual_pendente'
  | 'recebedor_pendente'
  | 'revisao'
  | 'bloqueada'

export interface PendenciaIntegridade {
  codigo: string
  mensagem: string
  link_numero?: number
}

export interface ResultadoIntegridade {
  status: StatusIntegridade
  apta: boolean
  pendencias: PendenciaIntegridade[]
  por_tipo: {
    contrato:    boolean
    links:       boolean
    percentuais: boolean
    recebedores: boolean
  }
}

// ── Tipos de entrada ──────────────────────────────────────────────────────────

export interface ObraInput {
  id?: string
  status_catalogo?:      string | null
  contrato_origem_id?:   string | null
  contrato_manual_url?:  string | null
  contrato_manual_nome?: string | null
  status_contrato?:      string | null
  exportacao_bloqueada?: boolean | null
  origem_cadastro?:      string | null   // 'cwr' | 'manual' | 'backoffice'
  socinpro_status?:      string | null
}

export interface LinkInput {
  id:            string
  numero_link?:  number | null
  percentual_link?: number | null
}

export interface TitularLinkInput {
  id:                       string
  link_id:                  string
  titular_id?:              string | null
  controlado?:              boolean | null
  editora_administradora_id?: string | null
  percentual?:              number | null          // share total dentro do link
  percentual_exec_publica?: number | null          // % de execução pública (absoluto)
  percentual_fonomecanico?: number | null
  percentual_sincronizacao?: number | null
}

// ── Motor principal ───────────────────────────────────────────────────────────

export function calcularIntegridade(
  obra:      ObraInput,
  links:     LinkInput[],
  titulares: TitularLinkInput[],
): ResultadoIntegridade {
  const pendencias: PendenciaIntegridade[] = []

  // ── 1. Bloqueada ─────────────────────────────────────────────────────────
  if (obra.exportacao_bloqueada) {
    pendencias.push({ codigo: 'exportacao_bloqueada', mensagem: 'Obra bloqueada para exportação' })
    return {
      status: 'bloqueada', apta: false, pendencias,
      por_tipo: { contrato: false, links: false, percentuais: false, recebedores: false },
    }
  }

  // ── 2. Contrato ──────────────────────────────────────────────────────────
  const statusContrato = obra.status_contrato ?? ''
  const temContrato = (
    Boolean(obra.contrato_origem_id) ||
    Boolean(obra.contrato_manual_url) ||
    Boolean(obra.contrato_manual_nome) ||
    ['valido', 'contrato_sistema', 'contrato_manual'].includes(statusContrato)
  )

  if (!temContrato) {
    pendencias.push({ codigo: 'sem_contrato', mensagem: 'Nenhum contrato vinculado à obra' })
  } else if (statusContrato === 'recontratacao_pendente') {
    pendencias.push({ codigo: 'recontratacao_pendente', mensagem: 'Recontratação pendente — campos críticos foram alterados' })
  }

  // ── 3. Links / formações ─────────────────────────────────────────────────
  if (links.length === 0) {
    pendencias.push({ codigo: 'sem_links', mensagem: 'Nenhuma formação/link definido na obra' })
  } else {
    for (const link of links) {
      const lt = titulares.filter(t => t.link_id === link.id)
      if (lt.length === 0) {
        pendencias.push({
          codigo:      'link_sem_titular',
          mensagem:    `Link ${link.numero_link ?? '?'} sem titulares cadastrados`,
          link_numero: link.numero_link ?? undefined,
        })
      }
    }
  }

  // ── 4. Percentuais ───────────────────────────────────────────────────────
  for (const link of links) {
    const lt = titulares.filter(t => t.link_id === link.id)
    if (lt.length === 0) continue

    // Usa exec_publica se preenchida; senão tenta percentual geral
    const usaExec = lt.some(t => (Number(t.percentual_exec_publica) || 0) > 0)
    const soma = usaExec
      ? lt.reduce((s, t) => s + (Number(t.percentual_exec_publica) || 0), 0)
      : lt.reduce((s, t) => s + (Number(t.percentual)               || 0), 0)

    // Apenas valida se ao menos um percentual foi informado
    if (soma > 0 && Math.abs(soma - 100) > 0.5) {
      pendencias.push({
        codigo:      'percentual_invalido',
        mensagem:    `Link ${link.numero_link ?? '?'}: percentuais somam ${soma.toFixed(2)}% (esperado: 100%)`,
        link_numero: link.numero_link ?? undefined,
      })
    }
  }

  // ── 5. Recebedores ───────────────────────────────────────────────────────
  for (const t of titulares) {
    if (t.controlado && !t.editora_administradora_id) {
      const link = links.find(l => l.id === t.link_id)
      pendencias.push({
        codigo:      'recebedor_pendente',
        mensagem:    `Titular controlado sem editora administradora (link ${link?.numero_link ?? '?'})`,
        link_numero: link?.numero_link ?? undefined,
      })
    }
  }

  // ── Derivar status final (prioridade decrescente) ─────────────────────────
  let status: StatusIntegridade = 'apta'

  if      (pendencias.some(p => p.codigo === 'exportacao_bloqueada'))                     status = 'bloqueada'
  else if (pendencias.some(p => ['sem_contrato','recontratacao_pendente'].includes(p.codigo))) status = 'contrato_pendente'
  else if (pendencias.some(p => ['sem_links','link_sem_titular'].includes(p.codigo)))       status = 'link_incompleto'
  else if (pendencias.some(p => p.codigo === 'percentual_invalido'))                       status = 'percentual_pendente'
  else if (pendencias.some(p => p.codigo === 'recebedor_pendente'))                        status = 'recebedor_pendente'

  // Revisão: obra CWR ainda não confirmada editorialmente
  if (status === 'apta' &&
      obra.origem_cadastro === 'cwr' &&
      obra.socinpro_status === 'pendente_confirmacao'
  ) {
    status = 'revisao'
    pendencias.push({ codigo: 'cwr_nao_confirmado', mensagem: 'Obra importada via CWR aguarda confirmação editorial' })
  }

  const por_tipo = {
    contrato:    !pendencias.some(p => ['sem_contrato','recontratacao_pendente'].includes(p.codigo)),
    links:       !pendencias.some(p => ['sem_links','link_sem_titular'].includes(p.codigo)),
    percentuais: !pendencias.some(p => p.codigo === 'percentual_invalido'),
    recebedores: !pendencias.some(p => p.codigo === 'recebedor_pendente'),
  }

  return { status, apta: status === 'apta', pendencias, por_tipo }
}

// ── Helpers de UI ─────────────────────────────────────────────────────────────

const LABELS: Record<StatusIntegridade, string> = {
  apta:                'Apta',
  contrato_pendente:   'Contrato pendente',
  link_incompleto:     'Formação incompleta',
  percentual_pendente: 'Percentuais pendentes',
  recebedor_pendente:  'Recebedor pendente',
  revisao:             'Em revisão',
  bloqueada:           'Bloqueada',
}

const CORES: Record<StatusIntegridade, 'green' | 'yellow' | 'orange' | 'red' | 'gray'> = {
  apta:                'green',
  contrato_pendente:   'red',
  link_incompleto:     'red',
  percentual_pendente: 'orange',
  recebedor_pendente:  'orange',
  revisao:             'yellow',
  bloqueada:           'red',
}

export function labelIntegridade(status: StatusIntegridade): string {
  return LABELS[status] ?? status
}

export function corIntegridade(status: StatusIntegridade): 'green' | 'yellow' | 'orange' | 'red' | 'gray' {
  return CORES[status] ?? 'gray'
}

export type LinkTitularRecebedor = {
  papel?: string | null
  controlado?: boolean | null
  percentual_controle?: number | null
  percentual_controle_brasil?: number | null
  percentual_controle_exterior?: number | null
  editora?: { id?: string | null; nome?: string | null } | null
  editora_original?: { id?: string | null; nome?: string | null } | null
  editora_administradora?: { id?: string | null; nome?: string | null } | null
}

export type RecebedorResultado =
  | { ok: true; tipo: 'administradora' | 'editora_original'; editoraId: string; nome?: string | null }
  | { ok: false; motivo: 'sem_recebedor' | 'sem_percentual_controlado' }

const PAPEL_EDITORA = new Set(['editora_original', 'administradora', 'subeditora', 'E', 'AM', 'SE'])

function numeroPositivo(valor: unknown): boolean {
  return typeof valor === 'number' ? valor > 0 : Number(valor) > 0
}

export function resolverRecebedorEditorial(titulares: LinkTitularRecebedor[]): RecebedorResultado {
  const controlados = (titulares ?? []).filter((titular) => {
    if (!titular?.controlado) return false
    if (!PAPEL_EDITORA.has(String(titular.papel ?? ''))) return false
    return (
      numeroPositivo(titular.percentual_controle) ||
      numeroPositivo(titular.percentual_controle_brasil) ||
      numeroPositivo(titular.percentual_controle_exterior)
    )
  })

  if (controlados.length === 0) return { ok: false, motivo: 'sem_percentual_controlado' }

  const administradora = controlados.find((titular) => titular.editora_administradora?.id)
  if (administradora?.editora_administradora?.id) {
    return {
      ok: true,
      tipo: 'administradora',
      editoraId: administradora.editora_administradora.id,
      nome: administradora.editora_administradora.nome ?? null,
    }
  }

  const editoraOriginal = controlados.find(
    (titular) => titular.editora_original?.id || titular.editora?.id
  )

  if (editoraOriginal?.editora_original?.id || editoraOriginal?.editora?.id) {
    return {
      ok: true,
      tipo: 'editora_original',
      editoraId: editoraOriginal.editora_original?.id ?? editoraOriginal.editora?.id ?? '',
      nome: editoraOriginal.editora_original?.nome ?? editoraOriginal.editora?.nome ?? null,
    }
  }

  return { ok: false, motivo: 'sem_recebedor' }
}
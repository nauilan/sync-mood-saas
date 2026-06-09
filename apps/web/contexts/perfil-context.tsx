'use client'
import { createContext, useContext, type ReactNode } from 'react'
import type { PerfilCodigo } from '@/lib/types-config'

// Mapeamento role DB → PerfilCodigo UI (backward compat)
function roleToPerfilCodigo(role: string): PerfilCodigo {
  const map: Record<string, PerfilCodigo> = {
    master:               'master',
    admin:                'master',
    super_admin:          'master',
    editora_administrada: 'administrada',
    autor:                'autor',
    financeiro:           'financeiro',
    juridico:             'juridico',
    atendimento:          'operacional',
  }
  return map[role] ?? 'master'
}

const ROLE_PERMISSIONS: Record<PerfilCodigo, string[]> = {
  master:      ['*'],
  administrada:['cadastros.titulares.view','cadastros.titulares.create','cadastros.titulares.edit','obras.view','obras.create','contratos.view','contratos.create','autorizacoes.view','relatorios.view'],
  autor:       ['portal.obras.view','portal.recebimentos.view','portal.demonstrativos.view','portal.recibos.view','cc_titular.view','prestacao.view'],
  financeiro:  ['recebimentos.view','recebimentos.importar','distribuicao.view','distribuicao.execute','cc_obra.view','cc_titular.view','prestacao.view','financeiro.view','relatorios.view'],
  juridico:    ['contratos.view','contratos.create','contratos.edit','autorizacoes.view','autorizacoes.create','autorizacoes.edit','autorizacoes.approve','relatorios.view'],
  operacional: ['obras.view','backoffice.view','backoffice.execute','relatorios.view'],
}

interface PerfilContextValue {
  activePerfil: PerfilCodigo
  userRole: string
  // setActivePerfil mantido para não quebrar componentes que chamam, mas é no-op
  setActivePerfil: (p: PerfilCodigo) => void
  activeUsuario: null
  activePerfilNome: string
  hasPermission: (codigo: string) => boolean
}

const PerfilContext = createContext<PerfilContextValue>({
  activePerfil:    'master',
  userRole:        'master',
  setActivePerfil: () => {},
  activeUsuario:   null,
  activePerfilNome:'Master',
  hasPermission:   () => true,
})

const PERFIL_NOMES: Record<PerfilCodigo, string> = {
  master:      'Master',
  administrada:'Editora Adm.',
  autor:       'Autor',
  financeiro:  'Financeiro',
  juridico:    'Jurídico',
  operacional: 'Operacional',
}

export function PerfilProvider({ children, userRole = 'master' }: { children: ReactNode; userRole?: string }) {
  const activePerfil = roleToPerfilCodigo(userRole)

  function hasPermission(codigo: string): boolean {
    const perms = ROLE_PERMISSIONS[activePerfil] ?? []
    if (perms.includes('*')) return true
    return perms.includes(codigo)
  }

  return (
    <PerfilContext.Provider value={{
      activePerfil,
      userRole,
      setActivePerfil: () => {}, // no-op: role vem do banco, não troca no cliente
      activeUsuario:   null,
      activePerfilNome: PERFIL_NOMES[activePerfil] ?? 'Master',
      hasPermission,
    }}>
      {children}
    </PerfilContext.Provider>
  )
}

export function usePerfilContext() {
  return useContext(PerfilContext)
}

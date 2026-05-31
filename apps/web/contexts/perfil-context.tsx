'use client'
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { PerfilCodigo } from '@/lib/types-config'
import { MOCK_USUARIOS, MOCK_USUARIOS_PERFIS, DEMO_PERFIL_NOMES } from '@/lib/mock-config'

interface PerfilContextValue {
  activePerfil: PerfilCodigo
  setActivePerfil: (perfil: PerfilCodigo) => void
  activeUsuario: typeof MOCK_USUARIOS[0] | null
  activePerfilNome: string
  hasPermission: (codigo: string) => boolean
}

const PerfilContext = createContext<PerfilContextValue>({
  activePerfil: 'master',
  setActivePerfil: () => {},
  activeUsuario: null,
  activePerfilNome: 'Master',
  hasPermission: () => true,
})

// Permissions mapping per perfil
const PERFIL_PERMISSIONS: Record<PerfilCodigo, string[]> = {
  master: ['*'], // all
  administrada: ['cadastros.titulares.view','cadastros.titulares.create','cadastros.titulares.edit','obras.view','obras.create','contratos.view','contratos.create','autorizacoes.view','relatorios.view'],
  autor: ['portal.obras.view','portal.recebimentos.view','portal.demonstrativos.view','portal.recibos.view','portal.royalties_futuros.view','portal.informe_rendimentos.view','obras.view','cc_titular.view','prestacao.view'],
  financeiro: ['recebimentos.view','recebimentos.importar','recebimentos.divergencias.resolve','tv.view','tv.cobranca','conciliacao.view','conciliacao.execute','distribuicao.view','distribuicao.execute','cc_obra.view','cc_titular.view','prestacao.view','prestacao.create','prestacao.enviar','financeiro.view','financeiro.pagamentos.view','financeiro.pagamentos.execute','financeiro.contas.view','relatorios.view','relatorios.export','config.parametros.view'],
  juridico: ['contratos.view','contratos.create','contratos.edit','contratos.modelos.view','autorizacoes.view','autorizacoes.create','autorizacoes.edit','autorizacoes.approve','relatorios.view'],
  operacional: ['cadastros.titulares.view','cadastros.titulares.create','cadastros.titulares.edit','obras.view','obras.create','obras.edit','obras.exportar','backoffice.view','backoffice.execute','tv.view','tv.importar','relatorios.view'],
}

export function PerfilProvider({ children }: { children: ReactNode }) {
  const [activePerfil, setActivePerfilState] = useState<PerfilCodigo>('master')

  useEffect(() => {
    // Try to read from localStorage for demo persistence
    try {
      const stored = localStorage.getItem('sm_active_role') as PerfilCodigo | null
      if (stored && ['master','administrada','autor','financeiro','juridico','operacional'].includes(stored)) {
        setActivePerfilState(stored)
      }
    } catch {}
  }, [])

  function setActivePerfil(perfil: PerfilCodigo) {
    setActivePerfilState(perfil)
    try {
      localStorage.setItem('sm_active_role', perfil)
    } catch {}
  }

  const activeUsuario = MOCK_USUARIOS.find(u => {
    const perfil = MOCK_USUARIOS_PERFIS.find(p => p.usuario_id === u.id && p.perfil_codigo === activePerfil)
    return !!perfil
  }) ?? MOCK_USUARIOS[0]

  function hasPermission(codigo: string): boolean {
    const perms = PERFIL_PERMISSIONS[activePerfil]
    if (perms.includes('*')) return true
    return perms.includes(codigo)
  }

  return (
    <PerfilContext.Provider value={{
      activePerfil,
      setActivePerfil,
      activeUsuario,
      activePerfilNome: DEMO_PERFIL_NOMES[activePerfil],
      hasPermission,
    }}>
      {children}
    </PerfilContext.Provider>
  )
}

export function usePerfilContext() {
  return useContext(PerfilContext)
}

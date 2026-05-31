'use client'

import { useEffect, useRef, DependencyList } from 'react'

/**
 * useWizardSmartScroll
 *
 * Comportamento:
 *  1. Quando `step` muda → rola a tela de volta ao topo (inicio do passo)
 *  2. Quando qualquer valor de `fieldDeps` muda E o step ja tem dados
 *     → rola suavemente ate o rodape do wizard (botao Proximo/Emitir)
 *
 * Uso:
 *   const footerRef = useWizardSmartScroll(step, [valor1, valor2, ...])
 *   <div ref={footerRef}> ... <button>Proximo</button> </div>
 */
export function useWizardSmartScroll(
  step: number,
  fieldDeps: DependencyList,
) {
  const footerRef = useRef<HTMLDivElement>(null)
  const isFirstRender = useRef(true)

  // step muda → scroll to top
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  // campo preenchido → scroll ate o botao de acao
  useEffect(() => {
    const hasFilled = fieldDeps.some(v =>
      v !== '' && v !== null && v !== undefined && v !== 0 && v !== false
    )
    if (!hasFilled) return
    const el = footerRef.current
    if (!el) return
    el.scrollIntoView({ block: 'end', behavior: 'smooth' })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, fieldDeps)

  return footerRef
}

'use client'
import { useEffect } from 'react'

export function TenantBootstrap() {
  useEffect(() => {
    const key = 'sm_tenant_bootstrapped'
    if (sessionStorage.getItem(key)) return
    fetch('/api/bootstrap-tenant', { method: 'POST' })
      .then(r => r.json())
      .then(d => {
        if (d.tenant_id) {
          sessionStorage.setItem(key, '1')
          localStorage.setItem('sm_tenant_id', d.tenant_id)
        }
      })
      .catch(() => {})
  }, [])
  return null
}

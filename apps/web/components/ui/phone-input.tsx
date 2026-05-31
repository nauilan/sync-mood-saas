'use client'

import { useState, useEffect, useRef } from 'react'

// Países principais com bandeira emoji e DDI
const COUNTRIES = [
  { code: 'BR', flag: '🇧🇷', name: 'Brasil',             dial: '+55',  mask: 'BR' },
  { code: 'US', flag: '🇺🇸', name: 'Estados Unidos',    dial: '+1',   mask: 'INTL' },
  { code: 'PT', flag: '🇵🇹', name: 'Portugal',          dial: '+351', mask: 'INTL' },
  { code: 'AR', flag: '🇦🇷', name: 'Argentina',         dial: '+54',  mask: 'INTL' },
  { code: 'ES', flag: '🇪🇸', name: 'Espanha',           dial: '+34',  mask: 'INTL' },
  { code: 'GB', flag: '🇬🇧', name: 'Reino Unido',       dial: '+44',  mask: 'INTL' },
  { code: 'DE', flag: '🇩🇪', name: 'Alemanha',          dial: '+49',  mask: 'INTL' },
  { code: 'FR', flag: '🇫🇷', name: 'Franca',            dial: '+33',  mask: 'INTL' },
  { code: 'IT', flag: '🇮🇹', name: 'Italia',            dial: '+39',  mask: 'INTL' },
  { code: 'MX', flag: '🇲🇽', name: 'Mexico',            dial: '+52',  mask: 'INTL' },
  { code: 'CO', flag: '🇨🇴', name: 'Colombia',          dial: '+57',  mask: 'INTL' },
  { code: 'CL', flag: '🇨🇱', name: 'Chile',             dial: '+56',  mask: 'INTL' },
  { code: 'UY', flag: '🇺🇾', name: 'Uruguai',           dial: '+598', mask: 'INTL' },
  { code: 'PY', flag: '🇵🇾', name: 'Paraguai',          dial: '+595', mask: 'INTL' },
  { code: 'PE', flag: '🇵🇪', name: 'Peru',              dial: '+51',  mask: 'INTL' },
  { code: 'BO', flag: '🇧🇴', name: 'Bolivia',           dial: '+591', mask: 'INTL' },
  { code: 'VE', flag: '🇻🇪', name: 'Venezuela',         dial: '+58',  mask: 'INTL' },
  { code: 'EC', flag: '🇪🇨', name: 'Equador',           dial: '+593', mask: 'INTL' },
  { code: 'AO', flag: '🇦🇴', name: 'Angola',            dial: '+244', mask: 'INTL' },
  { code: 'MZ', flag: '🇲🇿', name: 'Mocambique',        dial: '+258', mask: 'INTL' },
  { code: 'JP', flag: '🇯🇵', name: 'Japao',             dial: '+81',  mask: 'INTL' },
  { code: 'CN', flag: '🇨🇳', name: 'China',             dial: '+86',  mask: 'INTL' },
]

// Máscara brasileira: detecta celular (11 dígitos) ou fixo (10 dígitos)
function maskBR(digits: string): string {
  const d = digits.slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  // celular com 9: (XX) 9XXXX-XXXX
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
}

// Máscara genérica internacional
function maskINTL(digits: string): string {
  const d = digits.slice(0, 15)
  if (d.length <= 2) return d
  if (d.length <= 6) return `${d.slice(0,2)} ${d.slice(2)}`
  if (d.length <= 10) return `${d.slice(0,2)} ${d.slice(2,6)}-${d.slice(6)}`
  return `${d.slice(0,2)} ${d.slice(2,6)}-${d.slice(6,10)} ${d.slice(10)}`
}

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function PhoneInput({ value, onChange, disabled, placeholder, className }: PhoneInputProps) {
  const [country, setCountry] = useState('BR')
  const [phone, setPhone] = useState('')
  const phoneInputRef = useRef<HTMLInputElement>(null)

  // Inicializa a partir do value externo
  useEffect(() => {
    if (!value) { setCountry('BR'); setPhone(''); return }
    const match = COUNTRIES.find(c => value.startsWith(c.dial + ' '))
    if (match) {
      setCountry(match.code)
      setPhone(value.slice(match.dial.length + 1))
    } else {
      setPhone(value)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const currentCountry = COUNTRIES.find(c => c.code === country) ?? COUNTRIES[0]

  function handleCountryChange(code: string) {
    setCountry(code)
    const c = COUNTRIES.find(x => x.code === code) ?? COUNTRIES[0]
    onChange(phone ? `${c.dial} ${phone}` : '')
    // Pula o foco para o campo de telefone após selecionar o país
    setTimeout(() => phoneInputRef.current?.focus(), 0)
  }

  function handlePhoneChange(raw: string) {
    const digits = raw.replace(/\D/g, '')
    const formatted = currentCountry.mask === 'BR' ? maskBR(digits) : maskINTL(digits)
    setPhone(formatted)
    onChange(formatted ? `${currentCountry.dial} ${formatted}` : '')
  }

  const inputCls = `flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-white/20 min-w-0 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`
  const wrapCls = `flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-violet-500/40 focus-within:border-violet-500/40 transition-all ${className ?? ''} ${disabled ? 'opacity-60' : ''}`

  return (
    <div className={wrapCls}>
      {/* Seletor de país */}
      <div className="flex items-center border-r border-white/10 px-2 flex-shrink-0">
        <select
          value={country}
          onChange={e => handleCountryChange(e.target.value)}
          disabled={disabled}
          className="bg-transparent text-sm text-white/70 outline-none cursor-pointer pr-1 appearance-none"
          title="Codigo do pais"
        >
          {COUNTRIES.map(c => (
            <option key={c.code} value={c.code} className="bg-[#1a1a2e] text-white">
              {c.flag} {c.dial}
            </option>
          ))}
        </select>
      </div>
      {/* Código DDI exibido */}
      <span className="text-xs text-white/30 pl-2 pr-1 flex-shrink-0">{currentCountry.dial}</span>
      {/* Campo numérico */}
      <input
        ref={phoneInputRef}
        type="tel"
        className={inputCls + ' px-2 py-2'}
        placeholder={placeholder ?? (currentCountry.mask === 'BR' ? '(00) 00000-0000' : '00 0000-0000')}
        value={phone}
        onChange={e => handlePhoneChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  )
}

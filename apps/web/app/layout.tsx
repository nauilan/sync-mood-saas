import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Sync Mood | Gestao Inteligente de Direitos Musicais',
  description: 'Plataforma SaaS para editoras musicais — Sync Mood Gestao Inteligente',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={jakarta.variable}>
      <body className="bg-[#07060f] text-[#f4f4f8] antialiased">
        {children}
      </body>
    </html>
  )
}

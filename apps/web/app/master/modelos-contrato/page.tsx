'use client'

import Link from 'next/link'
import { Plus, BookOpen, ChevronRight, Clock } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import type { ModeloContrato } from '@/lib/types-contratos'
import { TIPO_CONTRATO_LABELS, TIPO_CONTRATO_COLORS } from '@/lib/types-contratos'

const MOCK_MODELOS: ModeloContrato[] = [
  {
    id: 'm1', tenant_id: 't1', nome: 'Cessao Padrao UBC', tipo: 'cessao',
    descricao: 'Modelo padrao para cessao total de direitos autorais com filiacao UBC. Inclui clausulas de exec. publica, fonomecanico e sync.',
    clausulas: 'CONTRATO DE CESSAO DE DIREITOS\n\nO {{titular_nome}} cede a {{cessionario_nome}} os direitos sobre as obras listadas a partir de {{vigencia_inicio}}...',
    ativo: true, contagem_uso: 12,
    created_at: '2024-01-01T10:00:00Z', updated_at: '2024-06-15T10:00:00Z',
  },
  {
    id: 'm2', tenant_id: 't1', nome: 'Administracao Editorial', tipo: 'administracao',
    descricao: 'Contrato de administracao editorial para obras nacionais. Permite administracao parcial por territorio.',
    clausulas: 'CONTRATO DE ADMINISTRACAO EDITORIAL\n\nPelo presente instrumento, {{titular_nome}} autoriza {{cessionario_nome}} a administrar...',
    ativo: true, contagem_uso: 5,
    created_at: '2024-02-10T10:00:00Z', updated_at: '2024-05-20T10:00:00Z',
  },
  {
    id: 'm3', tenant_id: 't1', nome: 'Co-edicao Internacional', tipo: 'coedicao',
    descricao: 'Modelo para co-edicao com parceiros internacionais. Inclui clausulas de sub-publicacao e split de receitas.',
    clausulas: 'CO-EDICAO INTERNACIONAL\n\nAs partes {{titular_nome}} e {{cessionario_nome}} firmam o presente acordo de co-edicao...',
    ativo: true, contagem_uso: 3,
    created_at: '2024-03-05T10:00:00Z', updated_at: '2024-04-01T10:00:00Z',
  },
  {
    id: 'm4', tenant_id: 't1', nome: 'Licenca Sync Audiovisual', tipo: 'licenca',
    descricao: 'Licenca especifica para sincronizacao em producoes audiovisuais (filmes, series, publicidade).',
    clausulas: 'LICENCA DE SINCRONIZACAO\n\nFica autorizado o uso das obras listadas em {{obras_lista}} na producao audiovisual...',
    ativo: false, contagem_uso: 1,
    created_at: '2024-04-01T10:00:00Z', updated_at: '2024-04-01T10:00:00Z',
  },
]

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR')
}

export default function ModelosContratoPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Modelos de Contrato"
        description="Templates reutilizaveis para geracao automatica de contratos"
        actions={
          <Link href="/master/modelos-contrato/novo">
            <button className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm text-white font-semibold transition-colors">
              <Plus className="w-4 h-4" /> Novo Modelo
            </button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MOCK_MODELOS.map(m => (
          <div key={m.id} className={['bg-[#0d1526] border rounded-xl p-5 transition-all hover:border-white/10', m.ativo ? 'border-white/[0.06]' : 'border-white/[0.03] opacity-60'].join(' ')}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white/90">{m.nome}</p>
                    {!m.ativo && <span className="text-xs bg-slate-500/20 text-slate-400 px-1.5 py-0.5 rounded">Inativo</span>}
                  </div>
                  <span className={'text-xs font-semibold px-1.5 py-0.5 rounded-full ' + TIPO_CONTRATO_COLORS[m.tipo]}>
                    {TIPO_CONTRATO_LABELS[m.tipo]}
                  </span>
                </div>
              </div>
              <Link
                href={'/master/modelos-contrato/' + m.id}
                className="text-white/30 hover:text-violet-400 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {m.descricao && (
              <p className="text-xs text-white/50 mb-4 leading-relaxed">{m.descricao}</p>
            )}

            <div className="flex items-center justify-between text-xs text-white/30">
              <div className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                <span>{m.contagem_uso} uso{m.contagem_uso !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Atualizado em {formatDate(m.updated_at)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

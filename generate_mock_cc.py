"""
Gera mock-cc.ts com distribuição real iMusica ST505168.
"""
import json, re
from collections import defaultdict

with open(r'C:\Users\Usuário\Desktop\sync-mood-saas\dist_resultado.json', encoding='utf-8') as f:
    data = json.load(f)

cc_obras_data = data['cc_obras']
titular_data = data['titular_creditos']

DATE = '2026-04-17T00:00:00Z'
DATE_SHORT = '2026-04-17'

def q(s):
    if s is None:
        return 'undefined'
    safe = str(s).replace('\\', '\\\\').replace('"', '\\"')
    return f'"{safe}"'

def evolucao(valor):
    meses = [
        ('2025-06','Jun'), ('2025-07','Jul'), ('2025-08','Ago'), ('2025-09','Set'),
        ('2025-10','Out'), ('2025-11','Nov'), ('2025-12','Dez'), ('2026-01','Jan'),
        ('2026-02','Fev'), ('2026-03','Mar'), ('2026-04','Abr'), ('2026-05','Mai'),
    ]
    lines = []
    saldo = 0.0
    for mes, label in meses:
        ent = round(valor, 4) if mes == '2026-04' else 0
        sai = 0
        saldo += ent - sai
        lines.append(f'    {{ mes: "{mes}", label: "{label}", entradas: {ent}, saidas: {sai}, saldo_final: {round(saldo,4)} }},')
    return '\n'.join(lines)

# ─── CONSOLIDAR CC OBRAS por obra_codigo ──────────────────────────────────────
from collections import defaultdict as _dd

_obras_merged = {}
for o in cc_obras_data:
    cod = o['obra_codigo']
    if cod not in _obras_merged:
        _obras_merged[cod] = {
            'cco_id': f"cco-{cod}",
            'obra_id': o['obra_id'],
            'obra_codigo': cod,
            'obra_titulo': o['obra_titulo'],
            'obra_iswc': o['obra_iswc'],
            'saldo': 0.0,
            'movimentos': [],
            'dist_agg': {},  # (link_id, nome) -> {valor, pct, tipo, id}
            'descricao': [],
        }
    m = _obras_merged[cod]
    m['saldo'] = round(m['saldo'] + o['saldo'], 6)
    m['movimentos'].append({'mov_id': o['mov_id'], 'cco_id': o['cco_id'],
                             'saldo': o['saldo'], 'descricao': o.get('descricao','')})
    m['descricao'].append(o.get('descricao',''))
    for d in o['distribuicoes']:
        key = (d['obra_link_id'], d['titular_nome'])
        if key not in m['dist_agg']:
            m['dist_agg'][key] = {
                'id': d['id'], 'obra_link_id': d['obra_link_id'],
                'titular_nome': d['titular_nome'],
                'percentual_aplicado': d['percentual_aplicado'],
                'valor_destinado': 0.0,
                'tipo_destino': d['tipo_destino'],
            }
        m['dist_agg'][key]['valor_destinado'] = round(
            m['dist_agg'][key]['valor_destinado'] + d['valor_destinado'], 6)

cc_obras_data = list(_obras_merged.values())

# ─── CC OBRAS ─────────────────────────────────────────────────────────────────
obras_ts = []
for o in cc_obras_data:
    cco_id = o['cco_id']
    saldo = round(o['saldo'], 4)
    iswc_str = q(o['obra_iswc'])
    # Múltiplos movimentos (um por statement)
    mov_lines = []
    for mv in o['movimentos']:
        mov_lines.append(
            f"      {{ id: {q(mv['mov_id'])}, conta_obra_id: {q(cco_id)}, "
            f"tipo_movimento: 'entrada', origem_recebimento: 'backoffice', "
            f"recebimento_id: {q(mv['cco_id'])}, valor_bruto: {mv['saldo']}, valor_liquido: {mv['saldo']}, "
            f"moeda: 'BRL', data_movimento: {q(DATE)}, descricao: {q(mv['descricao'])}, "
            f"usuario: 'sistema', status: 'confirmado' }},"
        )
    mov_block = '\n'.join(mov_lines)
    # Distribuições consolidadas (somadas por link+titular)
    dist_lines = []
    for (link_id, nome), d in o['dist_agg'].items():
        dist_lines.append(
            f"      {{ id: {q(d['id'])}, conta_obra_movimento_id: {q(cco_id)}, "
            f"obra_link_id: {q(d['obra_link_id'])}, titular_nome: {q(d['titular_nome'])}, "
            f"percentual_aplicado: {d['percentual_aplicado']}, valor_destinado: {round(d['valor_destinado'],6)}, "
            f"tipo_destino: '{d['tipo_destino']}', status: 'distribuido' }},"
        )
    dist_block = '\n'.join(dist_lines) if dist_lines else ''

    obras_ts.append(f"""  {{
    id: {q(cco_id)},
    obra_id: {q(o['obra_id'])},
    obra_codigo: {q(o['obra_codigo'])},
    obra_titulo: {q(o['obra_titulo'])},
    obra_iswc: {iswc_str},
    saldo_atual: {saldo},
    saldo_bloqueado: 0,
    saldo_distribuido: {saldo},
    saldo_pendente: 0,
    moeda: 'BRL',
    status: 'ativa',
    data_ultima_movimentacao: {q(DATE)},
    total_entradas_mes: {saldo},
    total_saidas_mes: {saldo},
    bloqueios: [],
    movimentos: [
{mov_block}
    ],
    distribuicoes: [
{dist_block}
    ],
    evolucao_12m: [
{evolucao(saldo)}
    ],
  }},""")

# ─── CC TITULARES ─────────────────────────────────────────────────────────────
titulares_ts = []
for t_idx, (nome, tdata) in enumerate(sorted(titular_data.items(), key=lambda x: -x[1]['total']), 1):
    tct_id = f'tct-{t_idx:03d}'
    total = round(tdata['total'], 4)
    movs = tdata['movimentos']

    mov_lines = []
    for m in movs:
        descricao_tit = q(m.get('descricao', 'Distribuição iMúsica ST505168'))
        mov_lines.append(
            f"      {{ id: {q(m['mov_id'])}, conta_titular_id: {q(tct_id)}, "
            f"origem_obra_id: {q(m['obra_id'])}, origem_obra_titulo: {q(m['obra_titulo'])}, "
            f"tipo_movimento: 'credito', valor_bruto: {m['valor']}, valor_liquido: {m['valor']}, "
            f"retencoes_total: 0, moeda: 'BRL', data_movimento: {q(DATE)}, "
            f"descricao: {descricao_tit}, status: 'confirmado', retencoes: [] }},"
        )
    mov_block = '\n'.join(mov_lines)

    titular_tipo = 'PJ' if any(x in nome.upper() for x in ['LTDA','S.A.','EDITORA','MUSIC','RECORDS','PRODUCOES']) else 'PF'

    titulares_ts.append(f"""  {{
    id: {q(tct_id)},
    titular_id: {q(f'tit-{t_idx:03d}')},
    titular_codigo: {q(f'GEN-{t_idx:03d}')},
    titular_nome: {q(nome)},
    titular_tipo: '{titular_tipo}',
    saldo_atual: {total},
    saldo_bloqueado: 0,
    saldo_liberado: {total},
    saldo_pago: 0,
    moeda: 'BRL',
    status: 'ativa',
    data_ultima_movimentacao: {q(DATE)},
    bloqueios: [],
    movimentos: [
{mov_block}
    ],
    pagamentos_historicos: [],
  }},""")

# KPIs
total_geral = round(sum(o['saldo'] for o in cc_obras_data), 4)
total_titular = round(sum(v['total'] for v in titular_data.values()), 4)

ts_content = f"""// ============================================================
// lib/mock-cc.ts — Módulo 9: Conta Corrente (Obra + Titular)
// Distribuição real: iMúsica S.A. — ST505168 — 2026-04-17
// {len(cc_obras_data)} CC Obras | {len(titular_data)} CC Titulares | R$ {total_geral:.2f}
// Sync Mood Gestão Inteligente
// ============================================================

import type {{
  ContaCorrenteObra, ContaCorrenteTitular,
}} from './types-cc'

// ── Helpers ───────────────────────────────────────────────────────────────────

export function fmtBRL(v: number) {{
  return v.toLocaleString('pt-BR', {{ style: 'currency', currency: 'BRL' }})
}}

export function fmtDate(d: string) {{
  return new Date(d + (d.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('pt-BR')
}}

// ════════════════════════════════════════════════════════════════════════════
// CC OBRAS — {len(cc_obras_data)} obras distribuídas (iMúsica ST505168)
// ════════════════════════════════════════════════════════════════════════════

export const MOCK_CC_OBRAS: ContaCorrenteObra[] = [
{''.join(obras_ts)}
]

export function getCCObraById(id: string) {{
  return MOCK_CC_OBRAS.find(o => o.id === id || o.obra_id === id)
}}

export const KPI_CC_OBRAS = {{
  saldo_total_obras: {total_geral},
  total_entradas_mes: {total_geral},
  total_distribuido_mes: {total_geral},
  obras_com_bloqueio: 0,
}}

// ════════════════════════════════════════════════════════════════════════════
// CC TITULARES — {len(titular_data)} titulares com créditos
// ════════════════════════════════════════════════════════════════════════════

export const MOCK_CC_TITULARES: ContaCorrenteTitular[] = [
{''.join(titulares_ts)}
]

export function getCCTitularById(id: string) {{
  return MOCK_CC_TITULARES.find(t => t.id === id || t.titular_id === id)
}}

export const KPI_CC_TITULARES = {{
  saldo_total_titulares: {total_titular},
  saldo_disponivel: {total_titular},
  saldo_bloqueado: 0,
  total_pago_mes: 0,
}}
"""

with open(r'C:\Users\Usuário\Desktop\sync-mood-saas\apps\web\lib\mock-cc.ts', 'w', encoding='utf-8') as f:
    f.write(ts_content)

print(f"mock-cc.ts gerado!")
print(f"  CC Obras:     {len(cc_obras_data)}")
print(f"  CC Titulares: {len(titular_data)}")
print(f"  Total R$:     {total_geral:.4f}")

# Verificar amostra de descricao
sample = cc_obras_data[0]
print(f"\nAmostra descricao obra:")
print(f"  {sample.get('descricao','')}")
sample_tit = list(titular_data.values())[0]['movimentos'][0]
print(f"\nAmostra descricao titular:")
print(f"  {sample_tit.get('descricao','')}")

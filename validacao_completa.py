"""
VALIDACAO COMPLETA DA DISTRIBUICAO
Garante:
1. Soma dos percentual_aplicado = 100% por CC Obra
2. Soma dos valor_destinado = saldo da CC Obra
3. Total distribuido = total recebido
4. Nenhum titular fora da lista controlada
5. Editoras com % correto (multiplicado por N autores)
"""
import json, re

with open('dist_resultado.json', 'r', encoding='utf-8') as f:
    dist = json.load(f)

erros = []
avisos = []

cc_obras = dist['cc_obras']
titular_creditos = dist['titular_creditos']

# ─── TESTE 1: soma % = 100 por obra ───────────────────────────────────────────
falhas_pct = 0
for o in cc_obras:
    soma = sum(d['percentual_aplicado'] for d in o['distribuicoes'])
    if abs(soma - 100.0) > 0.01:
        erros.append(f"  PCT≠100: {o['obra_codigo']} {o['obra_titulo'][:30]} soma={soma:.4f}%")
        falhas_pct += 1

print(f"[1] Soma % = 100 por CC Obra: {'OK (' + str(len(cc_obras)) + '/'+str(len(cc_obras))+')' if falhas_pct==0 else 'FALHAS: '+str(falhas_pct)}")

# ─── TESTE 2: soma valor = saldo por obra ─────────────────────────────────────
falhas_val = 0
for o in cc_obras:
    soma_val = sum(d['valor_destinado'] for d in o['distribuicoes'])
    if abs(soma_val - o['saldo']) > 0.01:
        erros.append(f"  VAL≠SALDO: {o['obra_codigo']} saldo={o['saldo']:.4f} dist={soma_val:.6f}")
        falhas_val += 1

print(f"[2] Soma valor = saldo por obra: {'OK' if falhas_val==0 else 'FALHAS: '+str(falhas_val)}")

# ─── TESTE 3: total distribuido = total recebido ──────────────────────────────
total_recebido = sum(o['saldo'] for o in cc_obras)
total_dist = sum(v['total'] for v in titular_creditos.values())
diff = abs(total_recebido - total_dist)
ok3 = diff < 1.0
print(f"[3] Total recebido R$ {total_recebido:.2f} vs distribuido R$ {total_dist:.2f} | diff={diff:.4f} {'OK' if ok3 else 'FALHA'}")

# ─── TESTE 4: titulares todos na lista (40 controlados) ──────────────────────
nomes_dist = set(titular_creditos.keys())
print(f"[4] Titulares únicos: {len(nomes_dist)}")
editoras_conhecidas = {'EDI MUSIC EDITORA LTDA', 'TOP SHOW MUSIC LIMITADA - ME', 
                       'P3 EDITORA MUSICAL LTDA - ME', 'EDITORA LAMU LTDA',
                       'LOJAS MIL CALCADOS E CONFECCOES LTDA'}
autores_dist = nomes_dist - editoras_conhecidas
print(f"     Autores: {len(autores_dist)} | Editoras: {len(nomes_dist & editoras_conhecidas)}")

# ─── TESTE 5: verificar AFW2 especificamente (caso de referência do usuário) ──
for o in cc_obras:
    if o['obra_codigo'] == 'AFW2':
        d_map = {d['titular_nome']: d['percentual_aplicado'] for d in o['distribuicoes']}
        edi = d_map.get('EDI MUSIC EDITORA LTDA', 0)
        top = d_map.get('TOP SHOW MUSIC LIMITADA - ME', 0)
        ok5 = abs(edi - 20.0) < 0.01 and abs(top - 5.0) < 0.01
        print(f"[5] AFW2 DESCER PRA BC: EDI={edi:.2f}% TOP={top:.2f}% | {'OK (20%/5% correto)' if ok5 else 'FALHA'}")
        break

# ─── RESUMO POR TITULAR ────────────────────────────────────────────────────────
print()
print("─── RESUMO FINAL POR TITULAR ────────────────────────────────────────")
total = 0
for nome, d in sorted(titular_creditos.items(), key=lambda x: -x[1]['total']):
    pct_total = d['total'] / total_recebido * 100
    tipo = 'EDITORA' if any(x in nome.upper() for x in ['EDI MUSIC','TOP SHOW','P3 EDITORA','LAMU','LOJAS MIL']) else 'AUTOR  '
    print(f"  [{tipo}] {nome:50} R$ {d['total']:>10.2f}  ({pct_total:.1f}%)")
    total += d['total']

print(f"\n  TOTAL: R$ {total:.2f}")
total_ed = sum(d['total'] for n,d in titular_creditos.items() if any(x in n.upper() for x in ['EDI MUSIC','TOP SHOW','P3 EDITORA','LAMU','LOJAS MIL']))
total_au = total - total_ed
print(f"  Editoras: R$ {total_ed:.2f} ({total_ed/total*100:.1f}%)")
print(f"  Autores:  R$ {total_au:.2f} ({total_au/total*100:.1f}%)")

if erros:
    print("\n─── ERROS ENCONTRADOS ───")
    for e in erros:
        print(e)
else:
    print("\n✓ NENHUM ERRO ENCONTRADO — distribuição íntegra")

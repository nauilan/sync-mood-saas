import json

with open('dist_resultado.json', 'r', encoding='utf-8') as f:
    dist = json.load(f)

# Titulares
print("--- DISTRIBUIÇÃO POR TITULAR ---")
titulares = dist['titular_creditos']
for nome, d in sorted(titulares.items(), key=lambda x: -x[1]['total']):
    print(f"  {nome:50} R$ {d['total']:>10.2f}")
print(f"\n  TOTAL: R$ {sum(d['total'] for d in titulares.values()):.2f}")

# Editoras específicas
print()
editoras = {k: v for k, v in titulares.items() if any(x in k.upper() for x in ['EDI MUSIC','TOP SHOW','LR EDICOES'])}
total_editoras = sum(v['total'] for v in editoras.values())
total_geral = sum(d['total'] for d in titulares.values())
print(f"  EDI MUSIC + TOP SHOW + LR = R$ {total_editoras:.2f} ({total_editoras/total_geral*100:.1f}% do total)")

# Verificar % aplicado por obra para uma obra específica (AFW2)
print()
print("--- % APLICADO PARA AFW2 (DESCER PRA BC) ---")
for o in dist['cc_obras']:
    if o['obra_codigo'] == 'AFW2':
        print(f"  Royalty: R$ {o['saldo']:.4f}")
        for d in o['distribuicoes']:
            print(f"    {d['titular_nome']:45} {d['percentual_aplicado']:>8.4f}%  R$ {d['valor_destinado']:.4f}")
        break

print()
print("--- % APLICADO PARA AFW3 (BAQUEADO) ---")
baqueado_total = 0
for o in dist['cc_obras']:
    if o['obra_codigo'] == 'AFW3':
        baqueado_total += o['saldo']
        print(f"  Stmt {o.get('mov_id','?')}: R$ {o['saldo']:.4f}")
        for d in o['distribuicoes']:
            print(f"    {d['titular_nome']:45} {d['percentual_aplicado']:>8.4f}%  R$ {d['valor_destinado']:.4f}")

import json

with open('dist_resultado.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

cc_obras = data['cc_obras']
erros = []
ok = 0

for o in cc_obras:
    soma = sum(d['percentual_aplicado'] for d in o['distribuicoes'])
    diff = abs(soma - 100.0)
    if diff > 0.01:
        erros.append({
            'obra': o['obra_titulo'],
            'codigo': o['obra_codigo'],
            'stmt': o['cco_id'],
            'soma_pct': round(soma, 6),
            'diff': round(diff, 6),
            'n_dist': len(o['distribuicoes']),
            'distribuicoes': [
                {'nome': d['titular_nome'], 'pct': d['percentual_aplicado'], 'papel': d['tipo_destino']}
                for d in o['distribuicoes']
            ],
        })
    else:
        ok += 1

print(f'OK : {ok} CC')
print(f'ERRO: {len(erros)} CC')
if erros:
    print()
    for e in erros[:30]:
        print(f"  [{e['stmt']}] {e['codigo']} {e['obra'][:40]}  soma={e['soma_pct']}  diff={e['diff']}  n={e['n_dist']}")
        for d in e['distribuicoes']:
            print(f"      {d['nome'][:30]:30} {d['papel']:15} {d['pct']:.4f}%")
else:
    print()
    print('Todos os 244 CC com soma exatamente 100% (tolerancia 0.01%)')
